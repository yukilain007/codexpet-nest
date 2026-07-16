import { describe, expect, it } from 'vitest';
import {
  completeAnimationDuration,
  getAnimationFrameCount,
  getAnimationFrameDuration,
  getAnimationRow,
  getPoseCell,
  type PetAnimationState,
} from './animation';

describe('v2 companion animation contract', () => {
  it('maps all nine standard rows and exact frame counts', () => {
    expect(getAnimationRow('idle')).toMatchObject({ row: 0, frames: 6 });
    expect(getAnimationRow('running-right')).toMatchObject({ row: 1, frames: 8 });
    expect(getAnimationRow('running-left')).toMatchObject({ row: 2, frames: 8 });
    expect(getAnimationRow('waving')).toMatchObject({ row: 3, frames: 4 });
    expect(getAnimationRow('jumping')).toMatchObject({ row: 4, frames: 5 });
    expect(getAnimationRow('failed')).toMatchObject({ row: 5, frames: 8 });
    expect(getAnimationRow('waiting')).toMatchObject({ row: 6, frames: 6 });
    expect(getAnimationRow('running')).toMatchObject({ row: 7, frames: 6 });
    expect(getAnimationRow('review')).toMatchObject({ row: 8, frames: 6 });
  });

  it('uses every approved non-uniform duration array', () => {
    const durationContracts = [
      ['idle', [280, 110, 110, 140, 140, 320]],
      ['running-right', [120, 120, 120, 120, 120, 120, 120, 220]],
      ['running-left', [120, 120, 120, 120, 120, 120, 120, 220]],
      ['waving', [140, 140, 140, 280]],
      ['jumping', [140, 140, 140, 140, 280]],
      ['failed', [140, 140, 140, 140, 140, 140, 140, 240]],
      ['waiting', [150, 150, 150, 150, 150, 260]],
      ['running', [120, 120, 120, 120, 120, 220]],
      ['review', [150, 150, 150, 150, 150, 280]],
    ] satisfies ReadonlyArray<readonly [PetAnimationState, readonly number[]]>;

    for (const [state, durations] of durationContracts) {
      expect(
        Array.from({ length: getAnimationFrameCount(state) }, (_, frame) =>
          getAnimationFrameDuration(state, frame),
        ),
      ).toEqual(durations);
      expect(completeAnimationDuration(state)).toBe(
        durations.reduce((total, duration) => total + duration, 0),
      );
    }
  });

  it('maps all 16 gaze directions across rows 9 and 10', () => {
    expect(
      Array.from({ length: 16 }, (_, directionIndex) =>
        getPoseCell({ kind: 'look', directionIndex }),
      ),
    ).toEqual([
      { row: 9, column: 0 },
      { row: 9, column: 1 },
      { row: 9, column: 2 },
      { row: 9, column: 3 },
      { row: 9, column: 4 },
      { row: 9, column: 5 },
      { row: 9, column: 6 },
      { row: 9, column: 7 },
      { row: 10, column: 0 },
      { row: 10, column: 1 },
      { row: 10, column: 2 },
      { row: 10, column: 3 },
      { row: 10, column: 4 },
      { row: 10, column: 5 },
      { row: 10, column: 6 },
      { row: 10, column: 7 },
    ]);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'normalizes non-finite look direction %s to the first look cell',
    (directionIndex) => {
      expect(getPoseCell({ kind: 'look', directionIndex })).toEqual({ row: 9, column: 0 });
    },
  );
});
