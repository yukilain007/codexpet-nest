import type { PetAnimationState } from './animation';

export type DragVisualState = 'idle' | 'held' | 'left' | 'right';
export type CompanionPoseMode =
  | { kind: 'animation'; state: PetAnimationState }
  | { kind: 'look'; directionIndex: number };

export function clickReactionForCount(count: number): {
  state: PetAnimationState;
  durationMs: number;
} {
  const normalizedCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  if (normalizedCount >= 4) return { state: 'failed', durationMs: 1_400 };
  if (normalizedCount >= 2) return { state: 'jumping', durationMs: 1_100 };
  return { state: 'waving', durationMs: 900 };
}

export function resolveCompanionPoseMode({
  drag,
  reaction,
  special,
  lookDirection,
}: {
  drag: DragVisualState;
  reaction: PetAnimationState | null;
  special: PetAnimationState | null;
  lookDirection: number | null;
}): CompanionPoseMode {
  if (drag === 'left') return { kind: 'animation', state: 'running-left' };
  if (drag === 'right') return { kind: 'animation', state: 'running-right' };
  if (drag === 'held') return { kind: 'animation', state: 'jumping' };
  if (reaction) return { kind: 'animation', state: reaction };
  if (special) return { kind: 'animation', state: special };
  if (lookDirection !== null) return { kind: 'look', directionIndex: lookDirection };
  return { kind: 'animation', state: 'idle' };
}

export function nextAutonomousDelayMs(randomValue: number): number {
  const normalizedRandomValue = Number.isNaN(randomValue) ? 0 : randomValue;
  const clamped = Math.max(0, Math.min(1, normalizedRandomValue));
  return 120_000 + Math.round(clamped * 60_000);
}
