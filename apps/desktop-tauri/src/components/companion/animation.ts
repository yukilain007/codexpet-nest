export type PetAnimationState = 'idle' | 'running-right' | 'running-left' | 'waving' | 'jumping';

export const ATLAS_COLUMNS = 8;
export const CELL_WIDTH = 192;
export const CELL_HEIGHT = 208;

const animationRows: Record<PetAnimationState, { row: number; frames: number }> = {
  idle: { row: 0, frames: 6 },
  'running-right': { row: 1, frames: 8 },
  'running-left': { row: 2, frames: 8 },
  waving: { row: 3, frames: 4 },
  jumping: { row: 4, frames: 4 },
};

export function getAnimationRow(state: PetAnimationState) {
  return animationRows[state];
}

export function getAnimationFrameCount(state: PetAnimationState): number {
  return animationRows[state].frames;
}
