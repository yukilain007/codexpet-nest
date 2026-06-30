import {
  ATLAS_COLUMNS,
  CELL_HEIGHT,
  CELL_WIDTH,
  SPRITESHEET_URL,
  getAnimationRow,
  type PetAnimationState,
} from './animation';

export function PetSprite({
  state,
  frame,
  scale = 1,
}: {
  state: PetAnimationState;
  frame: number;
  scale?: number;
}) {
  const animation = getAnimationRow(state);
  const frameIndex = frame % animation.frames;
  const width = CELL_WIDTH * scale;
  const height = CELL_HEIGHT * scale;

  return (
    <div
      data-testid="local-companion-pet"
      style={{
        width,
        height,
        backgroundImage: `url(${SPRITESHEET_URL})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${CELL_WIDTH * ATLAS_COLUMNS * scale}px auto`,
        backgroundPosition: `-${frameIndex * width}px -${animation.row * height}px`,
        imageRendering: 'auto',
        filter: 'drop-shadow(0 10px 16px rgba(24, 32, 47, 0.18))',
      }}
    />
  );
}
