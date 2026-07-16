import { invoke } from '@tauri-apps/api/core';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { resolveGazeTarget } from './gaze';

export const CURSOR_POLL_MS = 80;
export const CURSOR_STALE_MS = CURSOR_POLL_MS * 3;
export const GAZE_EXIT_GRACE_MS = 600;
export const STATIONARY_DELTA_PX = 12;

export interface OverlayCursorSample {
  cursor_x: number;
  cursor_y: number;
  window_x: number;
  window_y: number;
  cursor_scale_factor: number;
  scale_factor: number;
}

export interface CursorGazeSnapshot {
  directionIndex: number | null;
  inAttentionRange: boolean;
  stationaryForMs: number;
}

const EMPTY_SNAPSHOT: CursorGazeSnapshot = {
  directionIndex: null,
  inAttentionRange: false,
  stationaryForMs: 0,
};

export function useGlobalCursorGaze(
  anchorRef: RefObject<HTMLElement | null>,
  enabled = true,
): CursorGazeSnapshot {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const directionRef = useRef<number | null>(null);
  const outsideSinceRef = useRef<number | null>(null);
  const stationarySinceRef = useRef<number | null>(null);
  const lastCursorRef = useRef<{ x: number; y: number } | null>(null);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!enabled || !pageVisible) {
      directionRef.current = null;
      outsideSinceRef.current = null;
      stationarySinceRef.current = null;
      lastCursorRef.current = null;
      setSnapshot(EMPTY_SNAPSHOT);
      return undefined;
    }

    let cancelled = false;
    let timeout: number | null = null;
    let staleTimeout: number | null = null;

    const scheduleNextPoll = () => {
      if (!cancelled) timeout = window.setTimeout(poll, CURSOR_POLL_MS);
    };

    const poll = async () => {
      if (cancelled) return;
      if (requestInFlightRef.current) {
        scheduleNextPoll();
        return;
      }

      requestInFlightRef.current = true;
      let requestStale = false;
      staleTimeout = window.setTimeout(() => {
        if (cancelled) return;
        requestStale = true;
        directionRef.current = null;
        outsideSinceRef.current = null;
        stationarySinceRef.current = null;
        lastCursorRef.current = null;
        setSnapshot(EMPTY_SNAPSHOT);
      }, CURSOR_STALE_MS);
      try {
        const sample = await invoke<OverlayCursorSample>('get_overlay_cursor_sample');
        if (staleTimeout !== null) {
          window.clearTimeout(staleTimeout);
          staleTimeout = null;
        }
        if (cancelled || requestStale) return;

        const anchor = anchorRef.current?.getBoundingClientRect();
        if (!anchor || !isValidSample(sample)) throw new Error('Gaze geometry unavailable');

        const now = Date.now();
        const cursor = {
          x: sample.cursor_x / sample.cursor_scale_factor - sample.window_x / sample.scale_factor,
          y: sample.cursor_y / sample.cursor_scale_factor - sample.window_y / sample.scale_factor,
        };
        const target = resolveGazeTarget({
          dx: cursor.x - (anchor.left + anchor.width / 2),
          dy: cursor.y - (anchor.top + anchor.height * 0.36),
          previousDirection: directionRef.current,
        });

        if (target.kind === 'outside') {
          lastCursorRef.current = null;
          stationarySinceRef.current = null;
          outsideSinceRef.current ??= now;
          const keepDirection = now - outsideSinceRef.current < GAZE_EXIT_GRACE_MS;
          if (!keepDirection) directionRef.current = null;
          setSnapshot({
            directionIndex: keepDirection ? directionRef.current : null,
            inAttentionRange: false,
            stationaryForMs: 0,
          });
          return;
        }

        outsideSinceRef.current = null;
        const lastCursor = lastCursorRef.current;
        const moved = lastCursor
          ? Math.hypot(cursor.x - lastCursor.x, cursor.y - lastCursor.y)
          : Infinity;
        stationarySinceRef.current =
          moved <= STATIONARY_DELTA_PX ? (stationarySinceRef.current ?? now) : now;
        lastCursorRef.current = cursor;
        const stationaryForMs = Math.max(0, now - stationarySinceRef.current);

        if (target.kind === 'direction') {
          directionRef.current = target.directionIndex;
          setSnapshot({
            directionIndex: target.directionIndex,
            inAttentionRange: true,
            stationaryForMs,
          });
        } else {
          directionRef.current = null;
          setSnapshot({
            directionIndex: null,
            inAttentionRange: true,
            stationaryForMs,
          });
        }
      } catch {
        if (!cancelled && !requestStale) {
          directionRef.current = null;
          outsideSinceRef.current = null;
          stationarySinceRef.current = null;
          lastCursorRef.current = null;
          setSnapshot(EMPTY_SNAPSHOT);
        }
      } finally {
        if (staleTimeout !== null) {
          window.clearTimeout(staleTimeout);
          staleTimeout = null;
        }
        requestInFlightRef.current = false;
        scheduleNextPoll();
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timeout !== null) window.clearTimeout(timeout);
      if (staleTimeout !== null) window.clearTimeout(staleTimeout);
    };
  }, [anchorRef, enabled, pageVisible]);

  return snapshot;
}

function isValidSample(sample: OverlayCursorSample): boolean {
  return (
    Number.isFinite(sample.cursor_x) &&
    Number.isFinite(sample.cursor_y) &&
    Number.isFinite(sample.window_x) &&
    Number.isFinite(sample.window_y) &&
    Number.isFinite(sample.cursor_scale_factor) &&
    Number.isFinite(sample.scale_factor) &&
    sample.cursor_scale_factor > 0 &&
    sample.scale_factor > 0
  );
}
