import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { createDefaultSettings } from '@codexpet/core';
import { OverlayApp } from './OverlayApp';
import { useAppConfigStore } from '@/store/appConfigStore';
import { builtInNestRegistryEntries, useRegistryStore } from '@/store/registryStore';
import { useSettingsStore } from '@/store/settingsStore';
import { FALLBACK_CONFIG } from '@/config';

describe('OverlayApp', () => {
  const registry = { schemaVersion: 1, packages: builtInNestRegistryEntries };

  beforeEach(() => {
    // Reset store to loading state before each test.
    useAppConfigStore.setState({
      config: FALLBACK_CONFIG,
      isLoading: true,
      error: null,
    });
    useRegistryStore.setState({
      registry,
      isLoading: true,
      isSaving: false,
      error: null,
    });
    useSettingsStore.setState({
      settings: createDefaultSettings(),
      isLoading: true,
      isSaving: false,
      error: null,
    });
  });

  it('should show loading state', () => {
    render(<OverlayApp />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render production nest UI without debug runtime text when config is loaded', async () => {
    useAppConfigStore.getState().setConfig({
      ...FALLBACK_CONFIG,
      appName: 'CodexPet',
      isDebug: false, // explicitly false to test non-debug path
    });
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);
    expect(screen.getByTestId('local-companion-pet')).toBeInTheDocument();
    expect(screen.queryByTestId('nest-render-model')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Docs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Codex Path' })).not.toBeInTheDocument();
    expect(screen.queryByText('Drag')).not.toBeInTheDocument();
    expect(screen.queryByTestId('debug-overlay-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId('debug-platform-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId('overlay-drag-diagnostics')).not.toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('get_codex_state'));
    expect(screen.queryByText(/Runtime:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/mode:/)).not.toBeInTheDocument();
  });

  it('should not render or execute quick actions from the pet overlay', async () => {
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);

    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Docs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Codex Path' })).not.toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('get_codex_state'));
    expect(vi.mocked(invoke)).not.toHaveBeenCalledWith('execute_quick_action', expect.anything());
  });

  it('should not render click-through quick-action status when interaction is disabled', async () => {
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({
      settings: { ...createDefaultSettings(), clickThrough: true },
      isLoading: false,
    });
    render(<OverlayApp />);

    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('overlay-interaction-disabled')).not.toBeInTheDocument();
    expect(screen.queryByText('Click-through on')).not.toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('get_codex_state'));
  });

  it('should render debug overlay elements when isDebug is true', async () => {
    useAppConfigStore.getState().setConfig({
      ...FALLBACK_CONFIG,
      isDebug: true,
    });
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);

    // Debug elements must be visible.
    expect(screen.getByTestId('overlay-root')).toBeInTheDocument();
    expect(screen.getByTestId('debug-overlay-label')).toBeInTheDocument();
    expect(screen.getByTestId('debug-overlay-label')).toHaveTextContent('DEBUG OVERLAY');
    expect(screen.getByTestId('debug-platform-label')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-drag-region')).toHaveAttribute('data-tauri-drag-region');
    expect(screen.queryByText('Drag')).not.toBeInTheDocument();
    expect(await screen.findByText(/Waiting for Codex pet position/)).toBeInTheDocument();
  });

  it('should not render debug overlay elements in production mode', async () => {
    useAppConfigStore.getState().setConfig({
      ...FALLBACK_CONFIG,
      isDebug: false,
    });
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);

    expect(screen.queryByTestId('debug-overlay-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId('debug-platform-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId('overlay-drag-diagnostics')).not.toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('get_codex_state'));
  });

  it('should keep quick actions hidden when interaction is disabled', async () => {
    useAppConfigStore.getState().setConfig({ ...FALLBACK_CONFIG, isDebug: false });
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({
      settings: { ...createDefaultSettings(), clickThrough: true },
      isLoading: false,
    });

    render(<OverlayApp />);

    expect(screen.queryByTestId('overlay-interaction-disabled')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Click-through on')).not.toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('get_codex_state'));
  });

  it('should hold position without technical error text when Codex state is unavailable', async () => {
    useAppConfigStore.getState().setConfig({ ...FALLBACK_CONFIG, isDebug: false });
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    vi.mocked(invoke).mockImplementation((command) => {
      if (command === 'get_codex_state') return Promise.reject(new Error('state file missing'));
      if (command === 'set_overlay_click_through') return Promise.resolve(undefined);
      return Promise.reject(new Error(`Unhandled invoke command: ${String(command)}`));
    });

    render(<OverlayApp />);

    await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('get_codex_state'));
    expect(screen.queryByText(/state file missing/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Runtime:/)).not.toBeInTheDocument();
  });

  it('should keep debug nest controls while showing the local companion', async () => {
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);

    fireEvent.click(screen.getByRole('button', { name: 'capacity-orbit' }));

    expect(screen.getByTestId('local-companion-pet')).toBeInTheDocument();
    expect(screen.queryByTestId('nest-render-model')).not.toBeInTheDocument();
    expect(await screen.findByText(/Waiting for Codex pet position/)).toBeInTheDocument();
  });

  it('should render saved built-in nest and overlay mode', async () => {
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({
      settings: {
        ...createDefaultSettings(),
        activeNestId: 'basket-pomodoro-nest',
        overlayMode: 'standalone-fixed',
      },
      isLoading: false,
    });

    render(<OverlayApp />);

    expect(screen.getByTestId('local-companion-pet')).toBeInTheDocument();
    expect(screen.getByText(/mode: standalone-fixed/)).toBeInTheDocument();
    expect(await screen.findByText(/Restored saved overlay position/)).toBeInTheDocument();
  });

  it('should fallback to default when saved active nest is not in registry', async () => {
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({
      settings: {
        ...createDefaultSettings(),
        activeNestId: 'missing-nest',
      },
      isLoading: false,
    });

    render(<OverlayApp />);

    expect(screen.getAllByText('default').length).toBeGreaterThan(0);
    expect(screen.getByText(/Registry fallback: missing-nest -> default/)).toBeInTheDocument();
    expect(await screen.findByText(/Using the default nest/)).toBeInTheDocument();
  });

  it('should render imported nest issue when local asset is missing', async () => {
    const importedNest = {
      ...builtInNestRegistryEntries[0]!,
      id: 'imported-nest',
      name: 'Imported Nest',
      manifestPath: '/tmp/imported/codexpet-package.json',
      assetRoot: '/tmp/imported',
    };
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({
      registry: { schemaVersion: 1, packages: [...builtInNestRegistryEntries, importedNest] },
      isLoading: false,
    });
    useSettingsStore.setState({
      settings: {
        ...createDefaultSettings(),
        activeNestId: 'imported-nest',
      },
      isLoading: false,
    });
    vi.mocked(invoke).mockImplementation((command) => {
      if (command === 'load_local_nest_package') {
        return Promise.resolve({
          nestLayout: {
            schemaVersion: '1.0.0',
            canvas: { width: 100, height: 80 },
            layers: [
              {
                id: 'missing',
                type: 'image',
                src: 'assets/missing.png',
                frame: { x: 0, y: 0, width: 100, height: 80 },
              },
            ],
          },
          missingAssets: ['assets/missing.png'],
        });
      }
      if (command === 'get_codex_state') {
        return Promise.resolve({
          overlay_bounds: null,
          avatar_overlay_open: true,
          state_available: true,
          diagnostic: 'test',
          codex_home: '/tmp/.codex',
        });
      }
      if (command === 'set_overlay_click_through') return Promise.resolve(undefined);
      if (command === 'move_overlay_to_clamped') {
        return Promise.resolve({ x: 100, y: 100, display_index: 0 });
      }
      return Promise.reject(new Error(`Unhandled invoke command: ${String(command)}`));
    });

    render(<OverlayApp />);

    expect(
      await screen.findByText(/Missing local assets: assets\/missing.png/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-pet')).toBeInTheDocument();
  });

  it('should receive pointer events on drag bar and start manual fallback drag', async () => {
    vi.mocked(getCurrentWebviewWindow).mockReturnValueOnce({
      startDragging: vi.fn().mockRejectedValueOnce(new Error('native drag unavailable')),
    } as unknown as ReturnType<typeof getCurrentWebviewWindow>);
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);

    const pointerDown = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      screenX: 120,
      screenY: 140,
    });
    Object.defineProperty(pointerDown, 'pointerId', { value: 1 });

    fireEvent(screen.getByTestId('overlay-drag-region'), pointerDown);

    expect(await screen.findByText('mouse down: 1')).toBeInTheDocument();
    expect(await screen.findByText('mode: manual-fallback')).toBeInTheDocument();
    expect(vi.mocked(invoke)).toHaveBeenCalledWith('get_overlay_position');
  });

  it('should move the overlay when dragging the local companion body', async () => {
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);

    const companion = screen.getByRole('button', { name: '和夏以昼互动' });
    fireEvent(companion, pointerEvent('pointerdown', 120, 140));
    expect(await screen.findByText('mode: manual-fallback')).toBeInTheDocument();

    fireEvent(companion, pointerEvent('pointermove', 150, 170));

    await waitFor(() => {
      expect(vi.mocked(invoke)).toHaveBeenCalledWith('move_overlay_to_clamped', {
        x: 130,
        y: 130,
      });
    });
  });

  it('should ignore a stale pet body drag start after the pointer is released', async () => {
    let resolveOverlayPosition: ((position: { x: number; y: number }) => void) | undefined;
    vi.mocked(invoke).mockImplementation((command) => {
      if (command === 'get_overlay_position') {
        return new Promise((resolve) => {
          resolveOverlayPosition = resolve;
        });
      }
      if (command === 'get_codex_state') {
        return Promise.resolve({
          avatar_overlay_open: true,
          overlay_bounds: null,
          state_available: true,
          diagnostic: 'test',
          codex_home: '/tmp/.codex',
        });
      }
      if (command === 'set_overlay_click_through') return Promise.resolve(undefined);
      if (command === 'move_overlay_to_clamped') {
        return Promise.resolve({ x: 100, y: 100, display_index: 0 });
      }
      return Promise.reject(new Error(`Unhandled invoke command: ${String(command)}`));
    });
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    render(<OverlayApp />);

    const companion = screen.getByRole('button', { name: '和夏以昼互动' });
    fireEvent(companion, pointerEvent('pointerdown', 120, 140));
    fireEvent(companion, pointerEvent('pointerup', 120, 140));
    await act(async () => {
      resolveOverlayPosition?.({ x: 100, y: 100 });
      await Promise.resolve();
    });

    fireEvent(screen.getByTestId('overlay-drag-region'), pointerEvent('pointermove', 160, 170));
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    expect(vi.mocked(invoke)).not.toHaveBeenCalledWith(
      'move_overlay_to_clamped',
      expect.anything(),
    );
  });

  it('should move overlay from Codex mascot bounds in follow mode', async () => {
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({ settings: createDefaultSettings(), isLoading: false });
    vi.mocked(invoke).mockImplementation((command) => {
      if (command === 'get_codex_state') {
        return Promise.resolve({
          avatar_overlay_open: true,
          overlay_bounds: {
            x: 100,
            y: 120,
            width: 356,
            height: 320,
            display_x: 0,
            display_y: 0,
            display_width: 1920,
            display_height: 1080,
            mascot: { left: 20, top: 30, width: 120, height: 100 },
          },
          state_available: true,
          diagnostic: 'test',
          codex_home: '/tmp/.codex',
        });
      }
      if (command === 'get_screen_list') {
        return Promise.resolve([
          { x: 0, y: 0, width: 1920, height: 1080, scale_factor: 2, is_primary: true },
        ]);
      }
      if (command === 'convert_position') {
        return Promise.resolve({ x: 128, y: 75, scale_factor: 2, display_index: 0 });
      }
      if (command === 'move_overlay_to_clamped') {
        return Promise.resolve({ x: 256, y: 150, display_index: 0 });
      }
      if (command === 'set_overlay_click_through') return Promise.resolve(undefined);
      return Promise.reject(new Error(`Unhandled invoke command: ${String(command)}`));
    });

    render(<OverlayApp />);

    expect(await screen.findByText(/Following Codex pet x=256, y=150/)).toBeInTheDocument();
    expect(vi.mocked(invoke)).toHaveBeenCalledWith('move_overlay_to_clamped', { x: 256, y: 150 });
  });

  it('should persist manual position after standalone drag fallback', async () => {
    vi.mocked(getCurrentWebviewWindow).mockReturnValueOnce({
      startDragging: vi.fn().mockRejectedValueOnce(new Error('native drag unavailable')),
    } as unknown as ReturnType<typeof getCurrentWebviewWindow>);
    useAppConfigStore.getState().setConfig(FALLBACK_CONFIG);
    useRegistryStore.setState({ registry, isLoading: false });
    useSettingsStore.setState({
      settings: { ...createDefaultSettings(), overlayMode: 'standalone-fixed' },
      isLoading: false,
    });
    render(<OverlayApp />);

    const dragRegion = screen.getByTestId('overlay-drag-region');
    const pointerDown = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      screenX: 120,
      screenY: 140,
    });
    Object.defineProperty(pointerDown, 'pointerId', { value: 1 });
    const pointerUp = new MouseEvent('pointerup', { bubbles: true, cancelable: true });
    Object.defineProperty(pointerUp, 'pointerId', { value: 1 });

    fireEvent(dragRegion, pointerDown);
    fireEvent(dragRegion, pointerUp);

    expect(await screen.findByText('mode: manual-fallback')).toBeInTheDocument();
    await waitFor(() => {
      expect(vi.mocked(invoke)).toHaveBeenCalledWith(
        'save_local_settings',
        expect.objectContaining({
          settings: expect.objectContaining({ standalonePosition: { x: 100, y: 100 } }),
        }),
      );
    });
  });
});

function pointerEvent(type: string, screenX: number, screenY: number) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    screenX,
    screenY,
  });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  return event;
}
