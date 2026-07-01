import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalCompanionOverlay } from './LocalCompanionOverlay';

describe('LocalCompanionOverlay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the default Shen Xinghui pet sprite', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);

    expect(screen.getByTestId('local-companion-root')).toHaveStyle({
      width: '320px',
      minHeight: '236px',
    });
    expect(screen.getByRole('button', { name: '和沈星回互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-pet')).toHaveStyle({
      backgroundImage: 'url(/pets/shen-xinghui/spritesheet.webp)',
    });
  });

  it('can still render the Xia Yizhou pet profile', () => {
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);

    expect(screen.getByRole('button', { name: '和夏以昼互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-pet')).toHaveStyle({
      backgroundImage: 'url(/pets/xia-yizhou/spritesheet.webp)',
    });
  });

  it('shows a Shen Xinghui local reply when clicked', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);

    fireEvent.click(screen.getByRole('button', { name: '和沈星回互动' }));

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(
      /戳我|点这么准|再点一下|手指不酸|确认我在/,
    );
  });

  it('does not handle clicks when click-through is enabled', () => {
    render(<LocalCompanionOverlay clickThrough />);

    fireEvent.click(screen.getByRole('button', { name: '和沈星回互动' }));

    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
  });

  it('can show hidden stronger lines after repeated clicks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);
    const button = screen.getByRole('button', { name: '和沈星回互动' });

    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(button);

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(
      /确认我在|楼下的猫很想你|无论多少次/,
    );
  });
});
