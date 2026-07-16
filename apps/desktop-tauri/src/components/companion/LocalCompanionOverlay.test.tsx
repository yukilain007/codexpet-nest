import { act, fireEvent, render, screen } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalCompanionOverlay } from './LocalCompanionOverlay';

const rightCursorSample = {
  cursor_x: 300,
  cursor_y: 0,
  window_x: 0,
  window_y: 0,
  cursor_scale_factor: 1,
  scale_factor: 1,
};

const outsideCursorSample = {
  ...rightCursorSample,
  cursor_x: 2_000,
  cursor_y: 2_000,
};

describe('LocalCompanionOverlay', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockImplementation(() => new Promise(() => undefined));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the default Xia Yizhou pet sprite', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);

    expect(screen.getByTestId('local-companion-root')).toHaveStyle({
      width: '320px',
      height: '278px',
    });
    expect(screen.getByRole('button', { name: '和夏以昼互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-sprite-frame')).toHaveStyle({
      backgroundImage: 'url(/pets/xia-yizhou/spritesheet.webp)',
    });
  });

  it('can still render the Xia Yizhou pet profile', () => {
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);

    expect(screen.getByRole('button', { name: '和夏以昼互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-sprite-frame')).toHaveStyle({
      backgroundImage: 'url(/pets/xia-yizhou/spritesheet.webp)',
    });
  });

  it('renders the separate Shen Xinghui v2 pet profile', () => {
    render(<LocalCompanionOverlay clickThrough={false} profileId="shen-xinghui" />);

    expect(screen.getByRole('button', { name: '和沈星回互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-sprite-frame')).toHaveStyle({
      backgroundImage: 'url(/pets/shen-xinghui/spritesheet.webp)',
    });
  });

  it('shows a Xia Yizhou local reply when clicked', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);

    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(
      /戳我|点这么准|再点一下|手指不酸|确认我在/,
    );
    expect(screen.getByTestId('local-companion-bubble-anchor')).toHaveStyle({
      left: '50%',
      bottom: '190px',
      transform: 'translateX(-50%)',
    });
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waving',
    );
  });

  it.each([2, 3])('uses jumping for a %s-click streak', (clickCount) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    for (let count = 0; count < clickCount; count += 1) {
      fireEvent.click(button);
      if (count + 1 < clickCount) act(() => vi.advanceTimersByTime(100));
    }

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'jumping',
    );
    act(() => vi.advanceTimersByTime(1_099));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'jumping',
    );
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId('local-companion-pet')).not.toHaveAttribute(
      'data-animation-state',
      'jumping',
    );
  });

  it('uses failed and a hidden stronger reply for four or more clicks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    for (let count = 0; count < 4; count += 1) {
      fireEvent.click(button);
      if (count < 3) act(() => vi.advanceTimersByTime(100));
    }

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'failed',
    );
    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(
      /宇宙很大|每次点我|别乱跑|想我的时候|一辈子的妹妹/,
    );
    act(() => vi.advanceTimersByTime(1_399));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'failed',
    );
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId('local-companion-pet')).not.toHaveAttribute(
      'data-animation-state',
      'failed',
    );
  });

  it('scales the pet while keeping the bubble attached above the sprite', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} scale={1} />);

    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));

    expect(screen.getByTestId('local-companion-root')).toHaveStyle({
      width: '320px',
      height: '304px',
    });
    expect(screen.getByTestId('local-companion-sprite-frame')).toHaveStyle({
      transform: 'translateX(-50%) scale(1)',
    });
    expect(screen.getByTestId('local-companion-bubble-anchor')).toHaveStyle({
      bottom: '216px',
    });
  });

  it('does not handle clicks when click-through is enabled', () => {
    render(<LocalCompanionOverlay clickThrough />);

    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));

    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
  });

  it('ignores pointer gestures when click-through is enabled', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    render(<LocalCompanionOverlay clickThrough />);
    await flushAsyncWork();
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent(button, pointerEvent('pointerdown', 100, 100));
    fireEvent(button, pointerEvent('pointercancel', 100, 100));

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
  });

  it('shows a picked-up pose while the pointer is held on the pet', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent(button, pointerEvent('pointerdown', 100, 100));

    expect(button).toHaveAttribute('data-drag-visual', 'held');
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'jumping',
    );
  });

  it('switches running direction while the pet body is dragged left and right', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent(button, pointerEvent('pointerdown', 100, 100));
    fireEvent(button, pointerEvent('pointermove', 128, 102));

    expect(button).toHaveAttribute('data-drag-visual', 'right');
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running-right',
    );

    fireEvent(button, pointerEvent('pointermove', 72, 102));

    expect(button).toHaveAttribute('data-drag-visual', 'left');
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running-left',
    );
  });

  it('shows failed for 1.4 seconds after a cancelled pickup', () => {
    vi.useFakeTimers();
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent(button, pointerEvent('pointerdown', 100, 100));
    fireEvent(button, pointerEvent('pointercancel', 100, 100));

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'failed',
    );
    act(() => vi.advanceTimersByTime(1_399));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'failed',
    );
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId('local-companion-pet')).not.toHaveAttribute(
      'data-animation-state',
      'failed',
    );
  });

  it('accepts the next real click after a cancelled drag', () => {
    vi.useFakeTimers();
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent(button, pointerEvent('pointerdown', 100, 100));
    fireEvent(button, pointerEvent('pointermove', 140, 100));
    fireEvent(button, pointerEvent('pointercancel', 140, 100));
    act(() => vi.advanceTimersByTime(1_400));
    fireEvent.click(button);

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waving',
    );
    expect(screen.getByTestId('local-companion-bubble')).toBeInTheDocument();
  });

  it('cancels a click reaction when a drag starts and returns to gaze on release', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} />);
    await flushAsyncWork();
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent.click(button);
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waving',
    );
    fireEvent(button, pointerEvent('pointerdown', 100, 100));
    fireEvent(button, pointerEvent('pointermove', 140, 100));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running-right',
    );
    fireEvent(button, pointerEvent('pointerup', 140, 100));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
  });

  it('does not show click dialogue after dragging the pet body', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent(button, pointerEvent('pointerdown', 100, 100));
    fireEvent(button, pointerEvent('pointermove', 140, 100));
    fireEvent(button, pointerEvent('pointerup', 140, 100));
    fireEvent.click(button);

    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
  });

  it('returns directly to gaze after a normal drag release', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} />);
    await flushAsyncWork();
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent(button, pointerEvent('pointerdown', 100, 100));
    fireEvent(button, pointerEvent('pointermove', 140, 100));
    fireEvent(button, pointerEvent('pointerup', 140, 100));

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
  });

  it('can show hidden stronger lines after repeated clicks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和夏以昼互动' });

    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(button);

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(
      /宇宙很大|每次点我|别乱跑|想我的时候|一辈子的妹妹/,
    );
  });

  it('looks right at a nearby global cursor even in click-through mode', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);

    render(<LocalCompanionOverlay clickThrough />);
    await flushAsyncWork();

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));
    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
  });

  it('shows waiting once for a stationary Xia attention session', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
    await flushAsyncWork();

    await act(async () => vi.advanceTimersByTimeAsync(2_400));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waiting',
    );
    await act(async () => vi.advanceTimersByTimeAsync(1_010));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
    await act(async () => vi.advanceTimersByTimeAsync(3_000));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
  });

  it('does not reset waiting after a short exit but resets after two seconds outside', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(2_400 + 1_010));

    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    await act(async () => vi.advanceTimersByTimeAsync(80));
    await act(async () => vi.advanceTimersByTimeAsync(1_919));
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    await act(async () => vi.advanceTimersByTimeAsync(80));
    await act(async () => vi.advanceTimersByTimeAsync(2_400));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');

    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    await act(async () => vi.advanceTimersByTimeAsync(80));
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    await act(async () => vi.advanceTimersByTimeAsync(80));
    await act(async () => vi.advanceTimersByTimeAsync(2_400));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waiting',
    );
  });

  it('uses the longer Shen waiting dwell', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} profileId="shen-xinghui" />);
    await flushAsyncWork();

    await act(async () => vi.advanceTimersByTimeAsync(2_999));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
    await act(async () => vi.advanceTimersByTimeAsync(41));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waiting',
    );
  });

  it('starts the new profile waiting dwell from zero when profiles switch', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    const view = render(<LocalCompanionOverlay clickThrough profileId="xia-yizhou" />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(3_040));

    view.rerender(<LocalCompanionOverlay clickThrough profileId="shen-xinghui" />);
    await flushAsyncWork();
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');

    await act(async () => vi.advanceTimersByTimeAsync(2_999));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
    await act(async () => vi.advanceTimersByTimeAsync(41));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waiting',
    );
  });

  it('clears the previous companion reply when profiles switch', () => {
    vi.useFakeTimers();
    const view = render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));
    expect(screen.getByTestId('local-companion-bubble')).toBeInTheDocument();

    view.rerender(<LocalCompanionOverlay clickThrough={false} profileId="shen-xinghui" />);

    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
  });

  it('does not let a nearly due autonomous timer overwrite waiting', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough profileId="xia-yizhou" />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(89_800));

    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    await act(async () => vi.advanceTimersByTimeAsync(80));
    await act(async () => vi.advanceTimersByTimeAsync(2_400));

    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waiting',
    );
  });

  it('runs, reviews, and returns idle after Xia inactivity', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
    await flushAsyncWork();

    await act(async () => vi.advanceTimersByTimeAsync(90_000));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );
    await act(async () => vi.advanceTimersByTimeAsync(820));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'review',
    );
    await act(async () => vi.advanceTimersByTimeAsync(1_030));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'idle',
    );
  });

  it('waits 105 seconds before the first Shen autonomous sequence', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough profileId="shen-xinghui" />);
    await flushAsyncWork();

    await act(async () => vi.advanceTimersByTimeAsync(104_999));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'idle',
    );
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );
  });

  it('uses a deterministic 120-180 second delay after the first autonomous sequence', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough profileId="xia-yizhou" />);
    await flushAsyncWork();

    await act(async () => vi.advanceTimersByTimeAsync(90_000 + 820 + 1_030));
    await act(async () => vi.advanceTimersByTimeAsync(149_999));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'idle',
    );
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );
  });

  it('cancels an autonomous sequence when clicked', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(90_000));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );

    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'waving',
    );
    await act(async () => vi.advanceTimersByTimeAsync(820 + 1_030));
    expect(screen.getByTestId('local-companion-pet')).not.toHaveAttribute(
      'data-animation-state',
      'review',
    );
  });

  it('cancels and re-schedules autonomy when the cursor re-enters', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough profileId="xia-yizhou" />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(90_000));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );

    vi.mocked(invoke).mockResolvedValue(rightCursorSample);
    await act(async () => vi.advanceTimersByTimeAsync(80));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    await act(async () => vi.advanceTimersByTimeAsync(80));
    await act(async () => vi.advanceTimersByTimeAsync(89_999));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'idle',
    );
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );
  });

  it('keeps autonomous actions active in click-through mode', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough profileId="xia-yizhou" />);
    await flushAsyncWork();

    await act(async () => vi.advanceTimersByTimeAsync(90_000));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );
  });

  it('uses the v2 idle frame durations instead of a fixed interval', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    render(<LocalCompanionOverlay clickThrough={false} />);
    const sprite = screen.getByTestId('local-companion-sprite-frame');

    expect(sprite).toHaveStyle({ backgroundPosition: '0px 0px' });
    await act(async () => vi.advanceTimersByTimeAsync(279));
    expect(sprite).toHaveStyle({ backgroundPosition: '0px 0px' });
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(sprite).toHaveStyle({ backgroundPosition: '-192px 0px' });
    await act(async () => vi.advanceTimersByTimeAsync(110));
    await act(async () => vi.advanceTimersByTimeAsync(110));
    await act(async () => vi.advanceTimersByTimeAsync(140));
    await act(async () => vi.advanceTimersByTimeAsync(140));
    expect(sprite).toHaveStyle({ backgroundPosition: '-960px 0px' });
    await act(async () => vi.advanceTimersByTimeAsync(319));
    expect(sprite).toHaveStyle({ backgroundPosition: '-960px 0px' });
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(sprite).toHaveStyle({ backgroundPosition: '0px 0px' });
  });

  it('clears reaction, reply, animation, gaze, and autonomous timers on unmount', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    const view = render(<LocalCompanionOverlay clickThrough={false} />);
    await flushAsyncWork();
    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    view.unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears an active autonomous sequence timer on unmount', async () => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockResolvedValue(outsideCursorSample);
    const view = render(<LocalCompanionOverlay clickThrough profileId="xia-yizhou" />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(90_000));
    expect(screen.getByTestId('local-companion-pet')).toHaveAttribute(
      'data-animation-state',
      'running',
    );

    view.unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

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
