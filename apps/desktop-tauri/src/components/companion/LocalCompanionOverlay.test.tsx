import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalCompanionOverlay } from './LocalCompanionOverlay';

describe('LocalCompanionOverlay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the default Xia Yizhou pet sprite', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);

    expect(screen.getByTestId('local-companion-root')).toHaveStyle({
      width: '320px',
      minHeight: '236px',
    });
    expect(screen.getByRole('button', { name: '和夏以昼互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-pet')).toHaveStyle({
      backgroundImage: 'url(/pets/xia-yizhou/spritesheet.webp)',
    });
  });

  it('can still render the Xia Yizhou pet profile', () => {
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);

    expect(screen.getByRole('button', { name: '和夏以昼互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-pet')).toHaveStyle({
      backgroundImage: 'url(/pets/xia-yizhou/spritesheet.webp)',
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
  });

  it('does not handle clicks when click-through is enabled', () => {
    render(<LocalCompanionOverlay clickThrough />);

    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));

    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
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
      /确认我在|戳我|点这么准|再点一下|手指不酸/,
    );
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
