import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import {
  categoryForInteraction,
  DEFAULT_COMPANION_SCALE,
  getCompanionProfile,
  selectCompanionReply,
  type CompanionProfileId,
} from '@codexpet/core';
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  completeAnimationDuration,
  getAnimationFrameCount,
  getAnimationFrameDuration,
  type PetAnimationState,
  type PetPose,
} from './animation';
import { PetSprite } from './PetSprite';
import {
  clickReactionForCount,
  nextAutonomousDelayMs,
  resolveCompanionPoseMode,
  type DragVisualState,
} from './stateMachine';
import { SpeechBubble } from './SpeechBubble';
import { useGlobalCursorGaze } from './useGlobalCursorGaze';

const BUBBLE_TIMEOUT_MS = 4_200;
const CLICK_STREAK_WINDOW_MS = 2_200;
const IDLE_REPLY_MS = 45_000;
const DRAG_THRESHOLD_PX = 6;
const ATTENTION_SESSION_RESET_MS = 2_000;
const ROOT_WIDTH_PX = 320;
const BUBBLE_RESERVED_HEIGHT_PX = 72;
const BUBBLE_GAP_PX = 8;
const DRAG_LIFT_SPACE_PX = 16;

interface DragGesture {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  dragged: boolean;
}

export function LocalCompanionOverlay({
  clickThrough,
  profileId,
  onPetDragStart,
  onPetDragMove,
  onPetDragEnd,
  scale = DEFAULT_COMPANION_SCALE,
}: {
  clickThrough: boolean;
  profileId?: CompanionProfileId;
  scale?: number;
  onPetDragStart?: (event: PointerEvent<HTMLElement>) => void;
  onPetDragMove?: (event: PointerEvent<HTMLElement>) => void;
  onPetDragEnd?: (event: PointerEvent<HTMLElement>) => void;
}) {
  const profile = getCompanionProfile(profileId);
  const layoutScale = getPixelStableLayoutScale(scale);
  const petWidth = Math.round(CELL_WIDTH * layoutScale);
  const petHeight = Math.round(CELL_HEIGHT * layoutScale);
  const rootHeight = petHeight + BUBBLE_RESERVED_HEIGHT_PX + BUBBLE_GAP_PX + DRAG_LIFT_SPACE_PX;
  const bubbleBottom = petHeight + BUBBLE_GAP_PX;
  const petButtonRef = useRef<HTMLButtonElement>(null);
  const gaze = useGlobalCursorGaze(petButtonRef, true);
  const [frame, setFrame] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [dragVisual, setDragVisual] = useState<DragVisualState>('idle');
  const [reactionState, setReactionState] = useState<PetAnimationState | null>(null);
  const [specialState, setSpecialState] = useState<PetAnimationState | null>(null);
  const [activityEpoch, setActivityEpoch] = useState(0);
  const [autonomousDelayMs, setAutonomousDelayMs] = useState(profile.cadence.autonomousIdleMs);
  const clickStreakRef = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });
  const dragGestureRef = useRef<DragGesture | null>(null);
  const suppressNextClickRef = useRef(false);
  const reactionTimerRef = useRef<number | null>(null);
  const specialTimerRef = useRef<number | null>(null);
  const autonomousTimerRef = useRef<number | null>(null);
  const outsideResetTimerRef = useRef<number | null>(null);
  const specialStateRef = useRef<PetAnimationState | null>(null);
  const waitingUsedRef = useRef(false);
  const waitingEligibleAtRef = useRef(0);
  const previousInAttentionRangeRef = useRef(false);
  const previousProfileIdRef = useRef(profile.id);

  const mode = resolveCompanionPoseMode({
    drag: dragVisual,
    reaction: reactionState,
    special: specialState,
    lookDirection: gaze.directionIndex,
  });
  const animatedState = mode.kind === 'animation' ? mode.state : null;
  const pose: PetPose =
    mode.kind === 'look' ? mode : { kind: 'animation', state: mode.state, frame };

  const clearReactionTimer = useCallback(() => {
    if (reactionTimerRef.current === null) return;
    window.clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = null;
  }, []);

  const clearSpecialTimer = useCallback(() => {
    if (specialTimerRef.current === null) return;
    window.clearTimeout(specialTimerRef.current);
    specialTimerRef.current = null;
  }, []);

  const clearAutonomousTimer = useCallback(() => {
    if (autonomousTimerRef.current === null) return;
    window.clearTimeout(autonomousTimerRef.current);
    autonomousTimerRef.current = null;
  }, []);

  const updateSpecialState = useCallback((next: PetAnimationState | null) => {
    specialStateRef.current = next;
    setSpecialState(next);
  }, []);

  const cancelSpecialMotion = useCallback(() => {
    clearSpecialTimer();
    updateSpecialState(null);
  }, [clearSpecialTimer, updateSpecialState]);

  const markActivity = useCallback(() => {
    clearAutonomousTimer();
    cancelSpecialMotion();
    waitingEligibleAtRef.current = Date.now() + profile.cadence.waitingDwellMs;
    setAutonomousDelayMs(profile.cadence.autonomousIdleMs);
    setActivityEpoch((current) => current + 1);
  }, [cancelSpecialMotion, clearAutonomousTimer, profile.cadence]);

  const startReaction = useCallback(
    (state: PetAnimationState, durationMs: number) => {
      clearReactionTimer();
      setReactionState(state);
      setFrame(0);
      reactionTimerRef.current = window.setTimeout(() => {
        reactionTimerRef.current = null;
        setReactionState(null);
      }, durationMs);
    },
    [clearReactionTimer],
  );

  useEffect(() => {
    setFrame(0);
  }, [animatedState]);

  useEffect(() => {
    if (!animatedState) return undefined;
    const timer = window.setTimeout(
      () => {
        setFrame((current) => (current + 1) % getAnimationFrameCount(animatedState));
      },
      getAnimationFrameDuration(animatedState, frame),
    );
    return () => window.clearTimeout(timer);
  }, [animatedState, frame]);

  useEffect(() => {
    if (reply === null) return undefined;
    const timer = window.setTimeout(() => setReply(null), BUBBLE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [reply]);

  useEffect(() => {
    if (clickThrough) return undefined;
    const timer = window.setInterval(() => {
      setReply(selectCompanionReply('idle', Date.now(), profile.id).text);
    }, IDLE_REPLY_MS);
    return () => window.clearInterval(timer);
  }, [clickThrough, profile.id]);

  useEffect(() => {
    if (previousProfileIdRef.current === profile.id) return;
    previousProfileIdRef.current = profile.id;
    clearReactionTimer();
    setReactionState(null);
    clearAutonomousTimer();
    cancelSpecialMotion();
    if (outsideResetTimerRef.current !== null) {
      window.clearTimeout(outsideResetTimerRef.current);
      outsideResetTimerRef.current = null;
    }
    waitingUsedRef.current = false;
    waitingEligibleAtRef.current = Date.now() + profile.cadence.waitingDwellMs;
    clickStreakRef.current = { count: 0, lastAt: 0 };
    setReply(null);
    setAutonomousDelayMs(profile.cadence.autonomousIdleMs);
    setActivityEpoch((current) => current + 1);
  }, [
    cancelSpecialMotion,
    clearAutonomousTimer,
    clearReactionTimer,
    profile.cadence.autonomousIdleMs,
    profile.cadence.waitingDwellMs,
    profile.id,
  ]);

  useEffect(() => {
    if (gaze.inAttentionRange) {
      if (outsideResetTimerRef.current !== null) {
        window.clearTimeout(outsideResetTimerRef.current);
        outsideResetTimerRef.current = null;
      }
    } else if (outsideResetTimerRef.current === null) {
      outsideResetTimerRef.current = window.setTimeout(() => {
        outsideResetTimerRef.current = null;
        waitingUsedRef.current = false;
      }, ATTENTION_SESSION_RESET_MS);
    }
  }, [gaze.inAttentionRange]);

  useEffect(() => {
    const cursorReentered = gaze.inAttentionRange && !previousInAttentionRangeRef.current;
    previousInAttentionRangeRef.current = gaze.inAttentionRange;
    if (!cursorReentered) return;

    clearAutonomousTimer();
    if (specialStateRef.current === 'running' || specialStateRef.current === 'review') {
      cancelSpecialMotion();
    }
    setAutonomousDelayMs(profile.cadence.autonomousIdleMs);
    setActivityEpoch((current) => current + 1);
  }, [
    cancelSpecialMotion,
    clearAutonomousTimer,
    gaze.inAttentionRange,
    profile.cadence.autonomousIdleMs,
  ]);

  useEffect(() => {
    if (
      !gaze.inAttentionRange ||
      waitingUsedRef.current ||
      gaze.stationaryForMs < profile.cadence.waitingDwellMs ||
      Date.now() < waitingEligibleAtRef.current ||
      dragVisual !== 'idle' ||
      reactionState !== null ||
      specialState !== null
    ) {
      return;
    }

    waitingUsedRef.current = true;
    updateSpecialState('waiting');
    specialTimerRef.current = window.setTimeout(() => {
      specialTimerRef.current = null;
      updateSpecialState(null);
    }, completeAnimationDuration('waiting'));
  }, [
    dragVisual,
    gaze.inAttentionRange,
    gaze.stationaryForMs,
    profile.cadence.waitingDwellMs,
    reactionState,
    specialState,
    updateSpecialState,
  ]);

  useEffect(() => {
    if (
      gaze.inAttentionRange ||
      dragVisual !== 'idle' ||
      reactionState !== null ||
      specialState !== null
    ) {
      clearAutonomousTimer();
      return undefined;
    }

    clearAutonomousTimer();
    autonomousTimerRef.current = window.setTimeout(() => {
      autonomousTimerRef.current = null;
      updateSpecialState('running');
      specialTimerRef.current = window.setTimeout(() => {
        updateSpecialState('review');
        specialTimerRef.current = window.setTimeout(() => {
          specialTimerRef.current = null;
          updateSpecialState(null);
          setAutonomousDelayMs(nextAutonomousDelayMs(Math.random()));
          setActivityEpoch((current) => current + 1);
        }, completeAnimationDuration('review'));
      }, completeAnimationDuration('running'));
    }, autonomousDelayMs);

    return clearAutonomousTimer;
  }, [
    activityEpoch,
    autonomousDelayMs,
    clearAutonomousTimer,
    dragVisual,
    gaze.inAttentionRange,
    reactionState,
    specialState,
    updateSpecialState,
  ]);

  useEffect(
    () => () => {
      clearReactionTimer();
      clearSpecialTimer();
      clearAutonomousTimer();
      if (outsideResetTimerRef.current !== null) {
        window.clearTimeout(outsideResetTimerRef.current);
        outsideResetTimerRef.current = null;
      }
    },
    [clearAutonomousTimer, clearReactionTimer, clearSpecialTimer],
  );

  const setDragVisualState = (next: DragVisualState) => {
    setDragVisual(next);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (clickThrough || event.button !== 0) return;
    event.preventDefault();
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    dragGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.screenX,
      startY: event.screenY,
      lastX: event.screenX,
      lastY: event.screenY,
      dragged: false,
    };
    suppressNextClickRef.current = false;
    clearReactionTimer();
    setReactionState(null);
    markActivity();
    setDragVisualState('held');
    onPetDragStart?.(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const gesture = dragGestureRef.current;
    if (!gesture) return;
    event.preventDefault();
    const totalDx = event.screenX - gesture.startX;
    const totalDy = event.screenY - gesture.startY;
    const deltaX = event.screenX - gesture.lastX;
    if (!gesture.dragged && Math.hypot(totalDx, totalDy) >= DRAG_THRESHOLD_PX) {
      gesture.dragged = true;
      suppressNextClickRef.current = true;
    }
    if (gesture.dragged) {
      if (deltaX > 0) {
        setDragVisualState('right');
      } else if (deltaX < 0) {
        setDragVisualState('left');
      } else if (totalDx > 0) {
        setDragVisualState('right');
      } else if (totalDx < 0) {
        setDragVisualState('left');
      }
    }
    gesture.lastX = event.screenX;
    gesture.lastY = event.screenY;
    onPetDragMove?.(event);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLElement>) => {
    const gesture = dragGestureRef.current;
    if (!gesture) return;
    if (
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(gesture.pointerId) &&
      typeof event.currentTarget.releasePointerCapture === 'function'
    ) {
      event.currentTarget.releasePointerCapture(gesture.pointerId);
    }
    dragGestureRef.current = null;
    if (gesture.dragged) suppressNextClickRef.current = true;
    markActivity();
    setDragVisualState('idle');
    onPetDragEnd?.(event);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
    if (!dragGestureRef.current) return;
    handlePointerEnd(event);
    suppressNextClickRef.current = false;
    startReaction('failed', 1_400);
  };

  const handleClick = () => {
    if (clickThrough) return;
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    const nowMs = Date.now();
    const previous = clickStreakRef.current;
    const count = nowMs - previous.lastAt <= CLICK_STREAK_WINDOW_MS ? previous.count + 1 : 1;
    clickStreakRef.current = { count, lastAt: nowMs };
    const category = categoryForInteraction({ now: new Date(nowMs), clickCount: count });
    const selectedReply = selectCompanionReply(category, nowMs, profile.id);
    setReply(
      category === 'secret'
        ? selectStableReplyText(profile.replies.secret, nowMs, selectedReply.text)
        : selectedReply.text,
    );
    markActivity();
    const reaction = clickReactionForCount(count);
    startReaction(reaction.state, reaction.durationMs);
  };

  const dragTransform =
    dragVisual === 'right'
      ? 'translateY(-14px) rotate(5deg)'
      : dragVisual === 'left'
        ? 'translateY(-14px) rotate(-5deg)'
        : dragVisual === 'held'
          ? 'translateY(-18px) rotate(2deg)'
          : 'translateY(0) rotate(0deg)';

  return (
    <div
      data-testid="local-companion-root"
      style={{
        position: 'relative',
        width: ROOT_WIDTH_PX,
        height: rootHeight,
        pointerEvents: clickThrough ? 'none' : 'auto',
      }}
    >
      <div
        data-testid="local-companion-bubble-anchor"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: bubbleBottom,
          zIndex: 2,
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      >
        {reply && <SpeechBubble text={reply} />}
      </div>
      <div
        data-testid="local-companion-pet-anchor"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          width: petWidth,
          height: petHeight,
          transform: 'translateX(-50%)',
        }}
      >
        <button
          ref={petButtonRef}
          type="button"
          aria-label={profile.interactionLabel}
          data-drag-visual={dragVisual}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerCancel}
          onClick={handleClick}
          style={{
            border: 0,
            padding: 0,
            background: 'transparent',
            cursor: clickThrough ? 'default' : dragVisual === 'idle' ? 'grab' : 'grabbing',
            transform: dragTransform,
            transition:
              dragVisual === 'idle' ? 'transform 140ms ease-out' : 'transform 80ms linear',
            touchAction: 'none',
          }}
        >
          <PetSprite pose={pose} spritesheetUrl={profile.spritesheetUrl} scale={scale} />
        </button>
      </div>
    </div>
  );
}

function getPixelStableLayoutScale(scale: number): number {
  return Math.max(1 / 16, Math.round(scale * 16) / 16);
}

function selectStableReplyText(replies: string[], seed: number, fallback: string): string {
  if (replies.length === 0) return fallback;
  const index = ((Math.floor(seed) % replies.length) + replies.length) % replies.length;
  return replies[index] ?? fallback;
}
