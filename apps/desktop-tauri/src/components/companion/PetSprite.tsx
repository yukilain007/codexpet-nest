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
  const pixelStableScale = getPixelStableScale(scale);
  const width = CELL_WIDTH * pixelStableScale;
  const height = CELL_HEIGHT * pixelStableScale;

  return (
    <div
      data-testid="local-companion-pet"
      data-animation-state={state}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        data-testid="local-companion-sprite-frame"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          width: CELL_WIDTH,
          height: CELL_HEIGHT,
          backgroundImage: `url(${spritesheetUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${CELL_WIDTH * ATLAS_COLUMNS}px auto`,
          backgroundPosition: `-${frameIndex * CELL_WIDTH}px -${animation.row * CELL_HEIGHT}px`,
          imageRendering: 'auto',
          filter: 'drop-shadow(0 10px 16px rgba(24, 32, 47, 0.18))',
          transform: `translateX(-50%) scale(${pixelStableScale})`,
          transformOrigin: 'center bottom',
        }}
      />
    </div>
  );
}

function getPixelStableScale(scale: number): number {
  return Math.max(1 / 16, Math.round(scale * 16) / 16);
}
