import { act, render, screen } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CURSOR_POLL_MS,
  CURSOR_STALE_MS,
  type CursorGazeSnapshot,
  useGlobalCursorGaze,
} from './useGlobalCursorGaze';

const rightSample = {
  cursor_x: 250,
  cursor_y: 136,
  window_x: 0,
  window_y: 0,
  cursor_scale_factor: 1,
  scale_factor: 1,
};

const outsideSample = { ...rightSample, cursor_x: 1_000, cursor_y: 1_000 };

function Harness({
  enabled = true,
  onSnapshot,
}: {
  enabled?: boolean;
  onSnapshot?: (snapshot: CursorGazeSnapshot) => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    anchorRef.current.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      left: 100,
      top: 100,
      right: 200,
      bottom: 200,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });
  }, []);

  const gaze = useGlobalCursorGaze(anchorRef, enabled);

  useEffect(() => {
    onSnapshot?.(gaze);
  }, [gaze, onSnapshot]);

  return (
    <div>
      <div ref={anchorRef} />
      <span data-testid="direction">{gaze.directionIndex ?? 'none'}</span>
      <span data-testid="in-range">{String(gaze.inAttentionRange)}</span>
      <span data-testid="stationary">{gaze.stationaryForMs}</span>
    </div>
  );
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useGlobalCursorGaze', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T00:00:00.000Z'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    vi.mocked(invoke).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('converts a global cursor sample into a rightward look from the pet head anchor', async () => {
    vi.mocked(invoke).mockResolvedValue(rightSample);

    render(<Harness />);
    await flushAsyncWork();

    expect(invoke).toHaveBeenCalledWith('get_overlay_cursor_sample');
    expect(screen.getByTestId('direction')).toHaveTextContent('4');
    expect(screen.getByTestId('in-range')).toHaveTextContent('true');
  });

  it('converts physical coordinates with a mixed-DPI scale factor', async () => {
    vi.mocked(invoke).mockResolvedValue({
      cursor_x: 700,
      cursor_y: 472,
      window_x: 100,
      window_y: 100,
      cursor_scale_factor: 2,
      scale_factor: 1,
    });

    render(<Harness />);
    await flushAsyncWork();

    expect(screen.getByTestId('direction')).toHaveTextContent('4');
    expect(screen.getByTestId('in-range')).toHaveTextContent('true');
  });

  it('converts a cursor sample from a window with negative screen coordinates', async () => {
    vi.mocked(invoke).mockResolvedValue({
      cursor_x: -390,
      cursor_y: -224,
      window_x: -640,
      window_y: -360,
      cursor_scale_factor: 1,
      scale_factor: 1,
    });

    render(<Harness />);
    await flushAsyncWork();

    expect(screen.getByTestId('direction')).toHaveTextContent('4');
    expect(screen.getByTestId('in-range')).toHaveTextContent('true');
  });

  it('tracks how long the cursor remains stationary within 12 logical pixels', async () => {
    vi.mocked(invoke).mockResolvedValue(rightSample);

    render(<Harness />);
    await flushAsyncWork();
    expect(screen.getByTestId('stationary')).toHaveTextContent('0');

    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS * 3));

    expect(screen.getByTestId('stationary')).toHaveTextContent(String(CURSOR_POLL_MS * 3));
  });

  it('resets stationary time after the cursor moves more than 12 logical pixels', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(rightSample)
      .mockResolvedValueOnce(rightSample)
      .mockResolvedValue({ ...rightSample, cursor_x: rightSample.cursor_x + 13 });

    render(<Harness />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS));
    expect(screen.getByTestId('stationary')).toHaveTextContent(String(CURSOR_POLL_MS));

    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS));

    expect(screen.getByTestId('stationary')).toHaveTextContent('0');
  });

  it('keeps the prior direction for 600ms after leaving range', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(rightSample).mockResolvedValue(outsideSample);

    render(<Harness />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(560));

    expect(screen.getByTestId('direction')).toHaveTextContent('4');
    expect(screen.getByTestId('in-range')).toHaveTextContent('false');

    await act(async () => vi.advanceTimersByTimeAsync(160));

    expect(screen.getByTestId('direction')).toHaveTextContent('none');
  });

  it('falls back silently when the native sample or geometry is unavailable', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('unavailable'));

    render(<Harness />);
    await flushAsyncWork();

    expect(screen.getByTestId('direction')).toHaveTextContent('none');
    expect(screen.getByTestId('in-range')).toHaveTextContent('false');
    expect(screen.getByTestId('stationary')).toHaveTextContent('0');
  });

  it('silently rejects a non-positive display scale factor', async () => {
    vi.mocked(invoke).mockResolvedValue({ ...rightSample, scale_factor: 0 });

    render(<Harness />);
    await flushAsyncWork();

    expect(screen.getByTestId('direction')).toHaveTextContent('none');
    expect(screen.getByTestId('in-range')).toHaveTextContent('false');
  });

  it('silently rejects a non-positive cursor scale factor', async () => {
    vi.mocked(invoke).mockResolvedValue({ ...rightSample, cursor_scale_factor: 0 });

    render(<Harness />);
    await flushAsyncWork();

    expect(screen.getByTestId('direction')).toHaveTextContent('none');
    expect(screen.getByTestId('in-range')).toHaveTextContent('false');
  });

  it('never overlaps native requests', async () => {
    vi.mocked(invoke).mockImplementation(() => new Promise(() => undefined));

    render(<Harness />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(400));

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('clears prior gaze when the next native request becomes stale without overlapping it', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(rightSample)
      .mockImplementation(() => new Promise(() => undefined));

    render(<Harness />);
    await flushAsyncWork();
    expect(screen.getByTestId('direction')).toHaveTextContent('4');

    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS));
    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_STALE_MS - 1));
    expect(screen.getByTestId('direction')).toHaveTextContent('4');

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByTestId('direction')).toHaveTextContent('none');
    expect(screen.getByTestId('in-range')).toHaveTextContent('false');

    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('ignores a late stale response and resumes polling only after that request settles', async () => {
    let resolveStale: ((sample: typeof rightSample) => void) | undefined;
    vi.mocked(invoke)
      .mockResolvedValueOnce(rightSample)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveStale = resolve;
          }),
      )
      .mockResolvedValue(rightSample);

    render(<Harness />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS + CURSOR_STALE_MS));
    expect(screen.getByTestId('direction')).toHaveTextContent('none');

    await act(async () =>
      resolveStale?.({ ...rightSample, cursor_x: 50, cursor_y: rightSample.cursor_y }),
    );
    await flushAsyncWork();
    expect(screen.getByTestId('direction')).toHaveTextContent('none');
    expect(invoke).toHaveBeenCalledTimes(2);

    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS - 1));
    expect(invoke).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(invoke).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId('direction')).toHaveTextContent('4');
  });

  it('pauses while hidden and resumes with an immediate poll when visible', async () => {
    vi.mocked(invoke).mockResolvedValue(rightSample);

    render(<Harness />);
    await flushAsyncWork();
    expect(invoke).toHaveBeenCalledTimes(1);

    await act(async () => setDocumentHidden(true));
    expect(screen.getByTestId('direction')).toHaveTextContent('none');
    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(invoke).toHaveBeenCalledTimes(1);

    await act(async () => setDocumentHidden(false));
    await flushAsyncWork();

    expect(invoke).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('direction')).toHaveTextContent('4');
  });

  it('does not overlap a pending request when visibility resumes', async () => {
    let resolveFirst: ((sample: typeof rightSample) => void) | undefined;
    vi.mocked(invoke)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(rightSample);

    render(<Harness />);
    await flushAsyncWork();
    expect(invoke).toHaveBeenCalledTimes(1);

    await act(async () => setDocumentHidden(true));
    await act(async () => setDocumentHidden(false));
    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS * 2));
    expect(invoke).toHaveBeenCalledTimes(1);

    await act(async () => resolveFirst?.(rightSample));
    await act(async () => vi.advanceTimersByTimeAsync(CURSOR_POLL_MS));

    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('does not poll while initially hidden but starts after becoming visible', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    vi.mocked(invoke).mockResolvedValue(rightSample);

    render(<Harness />);
    await flushAsyncWork();
    expect(invoke).not.toHaveBeenCalled();

    await act(async () => setDocumentHidden(false));
    await flushAsyncWork();

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('does not poll while disabled and starts when enabled', async () => {
    vi.mocked(invoke).mockResolvedValue(rightSample);

    const view = render(<Harness enabled={false} />);
    await flushAsyncWork();
    expect(invoke).not.toHaveBeenCalled();

    view.rerender(<Harness enabled />);
    await flushAsyncWork();

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('stops polling and ignores a pending response after unmount', async () => {
    let resolveSample: ((sample: typeof rightSample) => void) | undefined;
    vi.mocked(invoke).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSample = resolve;
        }),
    );
    const onSnapshot = vi.fn();
    const view = render(<Harness onSnapshot={onSnapshot} />);
    await flushAsyncWork();
    const updatesBeforeUnmount = onSnapshot.mock.calls.length;

    view.unmount();
    await act(async () => resolveSample?.(rightSample));
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(400));

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledTimes(updatesBeforeUnmount);
  });
});
