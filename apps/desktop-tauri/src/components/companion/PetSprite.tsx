import { ATLAS_COLUMNS, CELL_HEIGHT, CELL_WIDTH, getPoseCell, type PetPose } from './animation';

export function PetSprite({
  pose,
  spritesheetUrl,
  scale = 1,
}: {
  pose: PetPose;
  spritesheetUrl: string;
  scale?: number;
}) {
  const cell = getPoseCell(pose);
  const pixelStableScale = getPixelStableScale(scale);
  const width = CELL_WIDTH * pixelStableScale;
  const height = CELL_HEIGHT * pixelStableScale;

  return (
    <div
      data-testid="local-companion-pet"
      data-animation-state={pose.kind === 'animation' ? pose.state : undefined}
      data-look-direction={pose.kind === 'look' ? pose.directionIndex : undefined}
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
          backgroundPosition: `-${cell.column * CELL_WIDTH}px -${cell.row * CELL_HEIGHT}px`,
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
