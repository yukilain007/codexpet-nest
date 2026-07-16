import { describe, expect, it } from 'vitest';
import {
  clickReactionForCount,
  nextAutonomousDelayMs,
  resolveCompanionPoseMode,
} from './stateMachine';

describe('companion state priority', () => {
  it.each([
    ['left', 'running-left'],
    ['right', 'running-right'],
    ['held', 'jumping'],
  ] as const)('prioritizes %s drag over reaction, special, and gaze', (drag, state) => {
    expect(
      resolveCompanionPoseMode({
        drag,
        reaction: 'failed',
        special: 'waiting',
        lookDirection: 4,
      }),
    ).toEqual({ kind: 'animation', state });
  });

  it('falls through reaction, special, gaze, then idle', () => {
    expect(
      resolveCompanionPoseMode({
        drag: 'idle',
        reaction: 'waving',
        special: 'review',
        lookDirection: 4,
      }),
    ).toEqual({ kind: 'animation', state: 'waving' });
    expect(
      resolveCompanionPoseMode({
        drag: 'idle',
        reaction: null,
        special: 'review',
        lookDirection: 4,
      }),
    ).toEqual({ kind: 'animation', state: 'review' });
    expect(
      resolveCompanionPoseMode({
        drag: 'idle',
        reaction: null,
        special: null,
        lookDirection: 4,
      }),
    ).toEqual({ kind: 'look', directionIndex: 4 });
    expect(
      resolveCompanionPoseMode({
        drag: 'idle',
        reaction: null,
        special: null,
        lookDirection: null,
      }),
    ).toEqual({ kind: 'animation', state: 'idle' });
  });
});

describe('clickReactionForCount', () => {
  it('maps click counts to the approved reactions and durations', () => {
    expect(clickReactionForCount(1)).toEqual({ state: 'waving', durationMs: 900 });
    expect(clickReactionForCount(2)).toEqual({ state: 'jumping', durationMs: 1_100 });
    expect(clickReactionForCount(3)).toEqual({ state: 'jumping', durationMs: 1_100 });
    expect(clickReactionForCount(4)).toEqual({ state: 'failed', durationMs: 1_400 });
    expect(clickReactionForCount(12)).toEqual({ state: 'failed', durationMs: 1_400 });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'uses the least disruptive reaction for invalid count %s',
    (count) => {
      expect(clickReactionForCount(count)).toEqual({ state: 'waving', durationMs: 900 });
    },
  );
});

describe('nextAutonomousDelayMs', () => {
  it('maps injected random values deterministically to 120-180 second delays', () => {
    expect(nextAutonomousDelayMs(0)).toBe(120_000);
    expect(nextAutonomousDelayMs(0.5)).toBe(150_000);
    expect(nextAutonomousDelayMs(1)).toBe(180_000);
  });

  it.each([
    [-1, 120_000],
    [2, 180_000],
    [Number.NEGATIVE_INFINITY, 120_000],
    [Number.POSITIVE_INFINITY, 180_000],
    [Number.NaN, 120_000],
  ])('clamps invalid random value %s to a finite delay', (randomValue, expectedDelayMs) => {
    expect(nextAutonomousDelayMs(randomValue)).toBe(expectedDelayMs);
  });
});
