import { describe, expect, it } from 'vitest';
import { resolveGazeTarget } from './gaze';

function pointAt(degrees: number, distance = 100): { dx: number; dy: number } {
  const radians = (degrees * Math.PI) / 180;
  return {
    dx: Math.sin(radians) * distance,
    dy: -Math.cos(radians) * distance,
  };
}

describe('resolveGazeTarget', () => {
  it.each([
    [0, -100, 0],
    [100, -100, 2],
    [100, 0, 4],
    [100, 100, 6],
    [0, 100, 8],
    [-100, 100, 10],
    [-100, 0, 12],
    [-100, -100, 14],
  ])('maps dx=%s dy=%s clockwise to direction %s', (dx, dy, directionIndex) => {
    expect(resolveGazeTarget({ dx, dy, previousDirection: null })).toEqual({
      kind: 'direction',
      directionIndex,
    });
  });

  it('maps every 22.5-degree sector center to indices 0 through 15', () => {
    for (let directionIndex = 0; directionIndex < 16; directionIndex += 1) {
      expect(
        resolveGazeTarget({ ...pointAt(directionIndex * 22.5), previousDirection: null }),
      ).toEqual({
        kind: 'direction',
        directionIndex,
      });
    }
  });

  it('uses idle through the 28px neutral deadzone boundary', () => {
    expect(resolveGazeTarget({ dx: 12, dy: 8, previousDirection: null })).toEqual({
      kind: 'deadzone',
    });
    expect(resolveGazeTarget({ dx: 28, dy: 0, previousDirection: null })).toEqual({
      kind: 'deadzone',
    });
  });

  it('keeps gaze at the 640px boundary and uses idle beyond it', () => {
    expect(resolveGazeTarget({ dx: 640, dy: 0, previousDirection: null })).toEqual({
      kind: 'direction',
      directionIndex: 4,
    });
    expect(resolveGazeTarget({ dx: 641, dy: 0, previousDirection: 4 })).toEqual({
      kind: 'outside',
    });
  });

  it('uses the clockwise sector at an exact sector boundary', () => {
    expect(resolveGazeTarget({ ...pointAt(11.25), previousDirection: null })).toEqual({
      kind: 'direction',
      directionIndex: 1,
    });
    expect(resolveGazeTarget({ ...pointAt(348.75), previousDirection: null })).toEqual({
      kind: 'direction',
      directionIndex: 0,
    });
  });

  it('retains the prior sector through four degrees of hysteresis', () => {
    expect(resolveGazeTarget({ ...pointAt(11.25 + 4), previousDirection: 0 })).toEqual({
      kind: 'direction',
      directionIndex: 0,
    });
    expect(resolveGazeTarget({ ...pointAt(360 - 11.25 - 4), previousDirection: 0 })).toEqual({
      kind: 'direction',
      directionIndex: 0,
    });
  });

  it('changes sector after crossing the hysteresis margin', () => {
    expect(resolveGazeTarget({ ...pointAt(11.25 + 4.01), previousDirection: 0 })).toEqual({
      kind: 'direction',
      directionIndex: 1,
    });
    expect(resolveGazeTarget({ ...pointAt(360 - 11.25 - 4.01), previousDirection: 0 })).toEqual({
      kind: 'direction',
      directionIndex: 15,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'treats non-finite coordinate %s as outside',
    (coordinate) => {
      expect(resolveGazeTarget({ dx: coordinate, dy: 0, previousDirection: null })).toEqual({
        kind: 'outside',
      });
      expect(resolveGazeTarget({ dx: 0, dy: coordinate, previousDirection: 0 })).toEqual({
        kind: 'outside',
      });
    },
  );

  it.each([-1, 16, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'ignores invalid previous direction %s',
    (previousDirection) => {
      expect(resolveGazeTarget({ dx: 100, dy: 0, previousDirection })).toEqual({
        kind: 'direction',
        directionIndex: 4,
      });
    },
  );
});
