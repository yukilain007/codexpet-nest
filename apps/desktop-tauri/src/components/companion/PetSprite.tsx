import {
  ATLAS_COLUMNS,
  CELL_HEIGHT,
  CELL_WIDTH,
  getAnimationRow,
  type PetAnimationState,
} from './animation';

export function PetSprite({
  state,
  frame,
  spritesheetUrl,
  scale = 1,
}: {
  state: PetAnimationState;
  frame: number;
  spritesheetUrl: string;
  scale?: number;
}) {
  const animation = getAnimationRow(state);
  const frameIndex = frame % animation.frames;
  const width = CELL_WIDTH * scale;
  const height = CELL_HEIGHT * scale;

  return (
    <div
      data-testid="local-companion-pet"
      data-animation-state={state}
      style={{
        width,
        height,
        backgroundImage: `url(${spritesheetUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${CELL_WIDTH * ATLAS_COLUMNS * scale}px auto`,
        backgroundPosition: `-${frameIndex * width}px -${animation.row * height}px`,
        imageRendering: 'auto',
        filter: 'drop-shadow(0 10px 16px rgba(24, 32, 47, 0.18))',
      }}
    />
  );
}
