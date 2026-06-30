export type PetAnimationState = 'idle' | 'waving';

export const ATLAS_COLUMNS = 8;
export const CELL_WIDTH = 192;
export const CELL_HEIGHT = 208;
export const SPRITESHEET_URL = '/pets/xia-yizhou/spritesheet.webp';

const animationRows: Record<PetAnimationState, { row: number; frames: number }> = {
  idle: { row: 0, frames: 6 },
  waving: { row: 3, frames: 4 },
};

export function getAnimationRow(state: PetAnimationState) {
  return animationRows[state];
}

export function getAnimationFrameCount(state: PetAnimationState): number {
  return animationRows[state].frames;
}
