export const LOOK_DIRECTION_COUNT = 16;
export const LOOK_SECTOR_DEGREES = 360 / LOOK_DIRECTION_COUNT;
export const GAZE_DEADZONE_PX = 28;
export const GAZE_ATTENTION_RADIUS_PX = 640;
export const GAZE_HYSTERESIS_DEGREES = 4;

export type GazeTarget =
  | { kind: 'deadzone' }
  | { kind: 'outside' }
  | { kind: 'direction'; directionIndex: number };

export function resolveGazeTarget({
  dx,
  dy,
  previousDirection,
}: {
  dx: number;
  dy: number;
  previousDirection: number | null;
}): GazeTarget {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return { kind: 'outside' };
  }

  const distance = Math.hypot(dx, dy);
  if (distance <= GAZE_DEADZONE_PX) {
    return { kind: 'deadzone' };
  }
  if (distance > GAZE_ATTENTION_RADIUS_PX) {
    return { kind: 'outside' };
  }

  const degrees = normalizeDegrees((Math.atan2(dx, -dy) * 180) / Math.PI);
  if (isDirectionIndex(previousDirection)) {
    const previousCenter = previousDirection * LOOK_SECTOR_DEGREES;
    const delta = Math.abs(shortestSignedDelta(degrees, previousCenter));
    const retentionLimit = LOOK_SECTOR_DEGREES / 2 + GAZE_HYSTERESIS_DEGREES;
    if (delta <= retentionLimit + 1e-9) {
      return { kind: 'direction', directionIndex: previousDirection };
    }
  }

  return {
    kind: 'direction',
    directionIndex: Math.round(degrees / LOOK_SECTOR_DEGREES) % LOOK_DIRECTION_COUNT,
  };
}

function isDirectionIndex(value: number | null): value is number {
  return Number.isInteger(value) && value !== null && value >= 0 && value < LOOK_DIRECTION_COUNT;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function shortestSignedDelta(value: number, origin: number): number {
  return ((value - origin + 540) % 360) - 180;
}
