export type PetAnimationState =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review';

export type PetPose =
  | { kind: 'animation'; state: PetAnimationState; frame: number }
  | { kind: 'look'; directionIndex: number };

export const ATLAS_COLUMNS = 8;
export const CELL_WIDTH = 192;
export const CELL_HEIGHT = 208;

const animationRows: Record<
  PetAnimationState,
  { row: number; frames: number; durations: number[] }
> = {
  idle: { row: 0, frames: 6, durations: [280, 110, 110, 140, 140, 320] },
  'running-right': {
    row: 1,
    frames: 8,
    durations: [120, 120, 120, 120, 120, 120, 120, 220],
  },
  'running-left': {
    row: 2,
    frames: 8,
    durations: [120, 120, 120, 120, 120, 120, 120, 220],
  },
  waving: { row: 3, frames: 4, durations: [140, 140, 140, 280] },
  jumping: { row: 4, frames: 5, durations: [140, 140, 140, 140, 280] },
  failed: { row: 5, frames: 8, durations: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, frames: 6, durations: [150, 150, 150, 150, 150, 260] },
  running: { row: 7, frames: 6, durations: [120, 120, 120, 120, 120, 220] },
  review: { row: 8, frames: 6, durations: [150, 150, 150, 150, 150, 280] },
};

export function getAnimationRow(state: PetAnimationState) {
  return animationRows[state];
}

export function getAnimationFrameCount(state: PetAnimationState): number {
  return animationRows[state].frames;
}

export function getAnimationFrameDuration(state: PetAnimationState, frame: number): number {
  const animation = animationRows[state];
  return (
    animation.durations[((frame % animation.frames) + animation.frames) % animation.frames] ?? 120
  );
}

export function completeAnimationDuration(state: PetAnimationState): number {
  return animationRows[state].durations.reduce((total, duration) => total + duration, 0);
}

export function getPoseCell(pose: PetPose): { row: number; column: number } {
  if (pose.kind === 'look') {
    const finiteDirectionIndex = Number.isFinite(pose.directionIndex) ? pose.directionIndex : 0;
    const directionIndex = Math.max(0, Math.min(15, Math.trunc(finiteDirectionIndex)));
    return directionIndex < 8
      ? { row: 9, column: directionIndex }
      : { row: 10, column: directionIndex - 8 };
  }
  const animation = animationRows[pose.state];
  return {
    row: animation.row,
    column: ((pose.frame % animation.frames) + animation.frames) % animation.frames,
  };
}
