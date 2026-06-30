import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalCompanionOverlay } from './LocalCompanionOverlay';

describe('LocalCompanionOverlay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the Xia Yizhou pet sprite', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);

    expect(screen.getByTestId('local-companion-root')).toHaveStyle({
      width: '320px',
      minHeight: '236px',
    });
    expect(screen.getByTestId('local-companion-pet')).toBeInTheDocument();
  });

  it('shows a local reply when clicked', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30T15:30:00+08:00'));
    render(<LocalCompanionOverlay clickThrough={false} />);

    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(/我在|怎么了|心事/);
  });

  it('does not handle clicks when click-through is enabled', () => {
    render(<LocalCompanionOverlay clickThrough />);

    fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));

    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
  });

  it('can show hidden stronger lines after repeated clicks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30T15:30:00+08:00'));
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
      /不要瞒着我|全都知道|妹妹/,
    );
  });
});
