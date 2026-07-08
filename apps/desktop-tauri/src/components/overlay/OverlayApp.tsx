import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { builtInNestFixtures } from '@codexpet/renderer/fixtures/nests';
import { getOverlayRuntimeDecision, persistStandalonePosition } from '@codexpet/core';
import { getBuildCompanionProfileId } from '@/components/companion/buildProfile';
import { LocalCompanionOverlay } from '@/components/companion/LocalCompanionOverlay';
import { useAppConfigStore } from '@/store/appConfigStore';
import {
  getEnabledNestEntries,
  resolveActiveNestEntry,
  useRegistryStore,
} from '@/store/registryStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { CodexStateDebug, ConvertedPosition, ScreenInfo } from '@/store/debugStore';

interface OverlayPosition {
  x: number;
  y: number;
}

interface ClampedPosition extends OverlayPosition {
  display_index: number;
}

interface OverlayFollowDiagnostics {
  runtimeMode: string;
  lastCodexStateReadAt: string | null;
  lastTargetPosition: string | null;
  followLoopActive: boolean;
  lastMoveFailure: string | null;
}

interface DragDiagnostics {
  mouseDownCount: number;
  lastMousePosition: string;
  draggingActive: boolean;
  dragMode: 'idle' | 'native-attempted' | 'manual-fallback';
  lastDragError: string | null;
}

interface ImportedNestPackage {
  missingAssets: string[];
}

const initialDragDiagnostics: DragDiagnostics = {
  mouseDownCount: 0,
  lastMousePosition: 'none',
  draggingActive: false,
  dragMode: 'idle',
  lastDragError: null,
};

const FOLLOW_DIAGNOSTICS_KEY = 'codexpet.overlay.followDiagnostics';
const FOLLOW_INTERVAL_MS = 500;
const FOLLOW_MOVE_THROTTLE_MS = 250;
const FOLLOW_MIN_DELTA_PX = 2;

export function OverlayApp() {
  const { config, isLoading } = useAppConfigStore();
  const { registry, isLoading: registryLoading } = useRegistryStore();
  const { settings, isLoading: settingsLoading, update: updateSettings } = useSettingsStore();
  const registryNests = getEnabledNestEntries(registry);
  const { entry: selectedNestEntry, fallback: nestFallback } = resolveActiveNestEntry(
    registry,
    settings.activeNestId,
  );
  const selectedNestId = selectedNestEntry?.id ?? builtInNestFixtures[0]?.id ?? 'default';
  const overlayMode = settings.overlayMode;
  const [runtimeStatus, setRuntimeStatus] = useState('Checking Codex position...');
  const [assetIssue, setAssetIssue] = useState<string | null>(null);
  const [dragDiagnostics, setDragDiagnostics] = useState<DragDiagnostics>(initialDragDiagnostics);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    windowX: number;
    windowY: number;
  } | null>(null);
  const pendingPositionRef = useRef<OverlayPosition | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFollowMoveRef = useRef<{ x: number; y: number; at: number } | null>(null);

  useEffect(() => {
    writeDragDiagnostics(dragDiagnostics);
  }, [dragDiagnostics]);

  useEffect(() => {
    writeFollowDiagnostics({
      runtimeMode: settings.overlayMode,
      lastCodexStateReadAt: null,
      lastTargetPosition: null,
      followLoopActive: settings.overlayMode === 'follow-codex' && !settingsLoading,
      lastMoveFailure: null,
    });
  }, [settings.overlayMode, settingsLoading]);

  useEffect(() => {
    if (isLoading || settingsLoading || registryLoading) return;
    invoke('set_overlay_click_through', { enabled: settings.clickThrough }).catch(() => undefined);
  }, [isLoading, registryLoading, settings.clickThrough, settingsLoading]);

  useEffect(() => {
    if (isLoading || settingsLoading || registryLoading) return;
    if (!selectedNestEntry || isBuiltInEntry(selectedNestEntry.assetRoot)) {
      setAssetIssue(null);
      return;
    }

    let cancelled = false;
    invoke<ImportedNestPackage>('load_local_nest_package', {
      assetRoot: selectedNestEntry.assetRoot,
      manifestPath: selectedNestEntry.manifestPath,
    })
      .then((pkg) => {
        if (cancelled) return;
        setAssetIssue(
          pkg.missingAssets.length > 0
            ? `Missing local assets: ${pkg.missingAssets.join(', ')}`
            : null,
        );
      })
      .catch((loadError) => {
        if (cancelled) return;
        setAssetIssue(`Local package load failed: ${String(loadError)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, registryLoading, selectedNestEntry, settingsLoading]);

  useEffect(() => {
    if (isLoading || settingsLoading || registryLoading) return;
    if (nestFallback && settings.activeNestId) {
      setRuntimeStatus('Using the default nest because the saved nest is unavailable.');
      return;
    }
    const runtimeDecision = getOverlayRuntimeDecision(settings.overlayMode);
    if (runtimeDecision.shouldUseStandalonePosition) {
      const position = settings.standalonePosition;
      invoke<ClampedPosition>('move_overlay_to_clamped', {
        x: Math.round(position.x),
        y: Math.round(position.y),
      })
        .then((clamped) => {
          setRuntimeStatus(`Restored saved overlay position x=${clamped.x}, y=${clamped.y}`);
          writeFollowDiagnostics({
            runtimeMode: settings.overlayMode,
            lastCodexStateReadAt: null,
            lastTargetPosition: `x=${clamped.x}, y=${clamped.y}`,
            followLoopActive: false,
            lastMoveFailure: null,
          });
        })
        .catch((error) => {
          setRuntimeStatus('Keeping current overlay position.');
          writeFollowDiagnostics({
            runtimeMode: settings.overlayMode,
            lastCodexStateReadAt: null,
            lastTargetPosition: `x=${position.x}, y=${position.y}`,
            followLoopActive: false,
            lastMoveFailure: String(error),
          });
        });
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    async function followCodexOnce() {
      const readAt = new Date().toISOString();
      try {
        const codexState = await invoke<CodexStateDebug>('get_codex_state');
        const bounds = codexState.overlay_bounds;
        const mascot = bounds?.mascot;
        if (!bounds || !mascot) {
          if (!cancelled) {
            setRuntimeStatus('Waiting for Codex pet position.');
            writeFollowDiagnostics({
              runtimeMode: settings.overlayMode,
              lastCodexStateReadAt: readAt,
              lastTargetPosition: lastFollowMoveRef.current
                ? `x=${lastFollowMoveRef.current.x}, y=${lastFollowMoveRef.current.y}`
                : null,
              followLoopActive: true,
              lastMoveFailure: null,
            });
          }
          return;
        }

        const screens = await invoke<ScreenInfo[]>('get_screen_list');
        const converted = await invoke<ConvertedPosition>('convert_position', {
          codexX: bounds.x + mascot.left,
          codexY: bounds.y + mascot.top,
          codexWidth: mascot.width,
          codexHeight: mascot.height,
          screens,
          scale: screens[0]?.scale_factor ?? 1.0,
        });
        const screen = screens[converted.display_index] ?? screens[0];
        if (!screen) return;
        const target = {
          x: Math.round(screen.x + converted.x * converted.scale_factor),
          y: Math.round(screen.y + converted.y * converted.scale_factor),
        };
        const nowMs = Date.now();
        const last = lastFollowMoveRef.current;
        if (
          last &&
          nowMs - last.at < FOLLOW_MOVE_THROTTLE_MS &&
          Math.abs(target.x - last.x) < FOLLOW_MIN_DELTA_PX &&
          Math.abs(target.y - last.y) < FOLLOW_MIN_DELTA_PX
        ) {
          return;
        }
        const clamped = await invoke<ClampedPosition>('move_overlay_to_clamped', target);
        lastFollowMoveRef.current = { x: clamped.x, y: clamped.y, at: nowMs };
        if (!cancelled) {
          setRuntimeStatus(`Following Codex pet x=${clamped.x}, y=${clamped.y}`);
          writeFollowDiagnostics({
            runtimeMode: settings.overlayMode,
            lastCodexStateReadAt: readAt,
            lastTargetPosition: `x=${clamped.x}, y=${clamped.y}`,
            followLoopActive: true,
            lastMoveFailure: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setRuntimeStatus('Holding current position until Codex is available.');
          writeFollowDiagnostics({
            runtimeMode: settings.overlayMode,
            lastCodexStateReadAt: readAt,
            lastTargetPosition: lastFollowMoveRef.current
              ? `x=${lastFollowMoveRef.current.x}, y=${lastFollowMoveRef.current.y}`
              : null,
            followLoopActive: true,
            lastMoveFailure: String(error),
          });
        }
      }
    }

    void followCodexOnce();
    timer = window.setInterval(() => void followCodexOnce(), FOLLOW_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearInterval(timer);
    };
  }, [
    isLoading,
    nestFallback,
    registryLoading,
    selectedNestId,
    settings.activeNestId,
    settings.overlayMode,
    settings.standalonePosition,
    settingsLoading,
  ]);

  if (isLoading || settingsLoading || registryLoading) {
    return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;
  }

  const isDevOverlay = config.isDebug === true;
  const showProductionFeedback = nestFallback || assetIssue;
  const interactiveDisabled = settings.clickThrough;

  const updateDragDiagnostics = (patch: Partial<DragDiagnostics>) => {
    setDragDiagnostics((current) => ({ ...current, ...patch }));
  };

  const flushPendingPosition = () => {
    animationFrameRef.current = null;
    const nextPosition = pendingPositionRef.current;
    if (!nextPosition) return;
    invoke('move_overlay_to_clamped', { x: nextPosition.x, y: nextPosition.y }).catch((error) => {
      updateDragDiagnostics({ lastDragError: String(error) });
    });
  };

  const scheduleOverlayPosition = (position: OverlayPosition) => {
    pendingPositionRef.current = position;
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(flushPendingPosition);
  };

  const startManualFallbackDrag = (pointerX: number, pointerY: number) => {
    invoke<OverlayPosition>('get_overlay_position')
      .then((position) => {
        dragStartRef.current = {
          pointerX,
          pointerY,
          windowX: position.x,
          windowY: position.y,
        };
        updateDragDiagnostics({ dragMode: 'manual-fallback' });
      })
      .catch((error) => {
        updateDragDiagnostics({
          draggingActive: false,
          lastDragError: `manual drag init failed: ${String(error)}`,
        });
      });
  };

  const handleDragPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const pointerX = event.screenX;
    const pointerY = event.screenY;
    const point = `${Math.round(pointerX)}, ${Math.round(pointerY)}`;
    setDragDiagnostics((current) => ({
      ...current,
      mouseDownCount: current.mouseDownCount + 1,
      lastMousePosition: point,
      draggingActive: true,
      dragMode: 'native-attempted',
      lastDragError: null,
    }));

    getCurrentWebviewWindow()
      .startDragging()
      .catch((error) => {
        updateDragDiagnostics({ lastDragError: `native startDragging failed: ${String(error)}` });
        startManualFallbackDrag(pointerX, pointerY);
      });
  };

  const handleDragPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    event.preventDefault();
    const scale = window.devicePixelRatio || 1;
    const dx = Math.round((event.screenX - start.pointerX) * scale);
    const dy = Math.round((event.screenY - start.pointerY) * scale);
    const next = { x: start.windowX + dx, y: start.windowY + dy };
    updateDragDiagnostics({
      lastMousePosition: `${Math.round(event.screenX)}, ${Math.round(event.screenY)}`,
      dragMode: 'manual-fallback',
    });
    scheduleOverlayPosition(next);
  };

  const stopManualDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartRef.current = null;
    updateDragDiagnostics({ draggingActive: false });
    const persisted = persistStandalonePosition(
      settings.overlayMode,
      pendingPositionRef.current ?? { x: 0, y: 0 },
    );
    if (persisted) {
      invoke<OverlayPosition>('get_overlay_position')
        .then((position) => updateSettings({ standalonePosition: position }).catch(() => undefined))
        .catch((error) =>
          updateDragDiagnostics({ lastDragError: `position save failed: ${String(error)}` }),
        );
    }
  };

  return (
    <div
      data-testid="overlay-root"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontFamily: 'system-ui, sans-serif',
        userSelect: 'none',

        // Dev overlay: ultra-visible borders so the overlay bounding box
        // is unmistakable during manual verification.
        ...(isDevOverlay
          ? ({
              border: '6px solid #ff0000',
              outline: '4px solid #ffff00',
              outlineOffset: '-10px',
              background: 'rgba(255, 0, 0, 0.22)',
              boxSizing: 'border-box',
              borderRadius: 4,
            } satisfies React.CSSProperties)
          : { background: 'transparent' }),
      }}
    >
      {/* Fixed DEBUG OVERLAY label: only visible when backend reports debug mode. */}
      {isDevOverlay && (
        <div
          data-testid="debug-overlay-label"
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: '#ff0000',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 12,
            padding: '2px 6px',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          DEBUG OVERLAY
        </div>
      )}

      <div
        data-testid="overlay-drag-region"
        data-tauri-drag-region
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={stopManualDrag}
        onPointerCancel={stopManualDrag}
        style={{
          position: 'absolute',
          top: 8,
          left: isDevOverlay ? 92 : 112,
          right: isDevOverlay ? 178 : 112,
          height: 20,
          zIndex: 25,
          border: 0,
          background: 'transparent',
          color: 'transparent',
          fontSize: 0,
          cursor: interactiveDisabled ? 'default' : 'move',
          pointerEvents: interactiveDisabled ? 'none' : 'auto',
        }}
      />

      {isDevOverlay && (
        <div
          data-testid="overlay-drag-diagnostics"
          style={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            zIndex: 30,
            maxWidth: 220,
            padding: '3px 6px',
            borderRadius: 6,
            background: 'rgba(0,0,0,0.55)',
            color: '#ffffff',
            fontSize: 9,
            lineHeight: 1.25,
            textAlign: 'left',
            pointerEvents: 'none',
          }}
        >
          <div>mouse down: {dragDiagnostics.mouseDownCount}</div>
          <div>last pointer: {dragDiagnostics.lastMousePosition}</div>
          <div>dragging: {String(dragDiagnostics.draggingActive)}</div>
          <div>mode: {dragDiagnostics.dragMode}</div>
          {dragDiagnostics.lastDragError && <div>error: {dragDiagnostics.lastDragError}</div>}
        </div>
      )}

      {isDevOverlay && (
        <div
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 20, display: 'flex', gap: 4 }}
        >
          {registryNests.slice(0, 3).map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => updateSettings({ activeNestId: entry.id }).catch(() => undefined)}
              style={{
                fontSize: 9,
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 4,
                background: selectedNestId === entry.id ? '#ffffff' : 'rgba(0,0,0,0.45)',
                color: selectedNestId === entry.id ? '#111' : '#fff',
                padding: '2px 4px',
                cursor: 'pointer',
              }}
            >
              {entry.id.replace('-nest', '')}
            </button>
          ))}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
        <LocalCompanionOverlay
          clickThrough={interactiveDisabled}
          profileId={getBuildCompanionProfileId()}
        />
        {isDevOverlay && (
          <div style={{ textAlign: 'center', fontSize: 10, opacity: 0.82, marginTop: -4 }}>
            {config.appName || 'CodexPet'} v{config.version} · mode: {overlayMode}
          </div>
        )}
        {isDevOverlay && nestFallback && settings.activeNestId && (
          <div style={{ textAlign: 'center', fontSize: 9, color: '#ffcc00', opacity: 0.9 }}>
            Registry fallback: {settings.activeNestId} {'->'} {selectedNestId}
          </div>
        )}
        {isDevOverlay && assetIssue && (
          <div style={{ textAlign: 'center', fontSize: 9, color: '#ffcc00', opacity: 0.9 }}>
            {assetIssue}
          </div>
        )}
        {isDevOverlay && (
          <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.72 }}>{runtimeStatus}</div>
        )}
        {!isDevOverlay && showProductionFeedback && (
          <div
            data-testid="overlay-user-feedback"
            style={{ textAlign: 'center', fontSize: 9, opacity: 0.78 }}
          >
            {nestFallback ? 'Using default nest.' : 'Some local nest assets are unavailable.'}
          </div>
        )}
        {isDevOverlay && (
          <div
            data-testid="debug-platform-label"
            style={{
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#ff0000',
              marginTop: 4,
              background: 'rgba(0,0,0,0.6)',
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            DEBUG — {config.platform || 'unknown'}
          </div>
        )}
      </div>
    </div>
  );
}

function writeDragDiagnostics(diagnostics: DragDiagnostics) {
  window.localStorage.setItem('codexpet.overlay.dragDiagnostics', JSON.stringify(diagnostics));
}

function writeFollowDiagnostics(diagnostics: OverlayFollowDiagnostics) {
  window.localStorage.setItem(FOLLOW_DIAGNOSTICS_KEY, JSON.stringify(diagnostics));
}

function isBuiltInEntry(assetRoot: string): boolean {
  return assetRoot.startsWith('builtin/');
}
