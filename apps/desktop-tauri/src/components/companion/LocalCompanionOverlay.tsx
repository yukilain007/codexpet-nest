import { useEffect, useRef, useState } from 'react';
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
  getAnimationFrameCount,
  type PetAnimationState,
} from './animation';
import { PetSprite } from './PetSprite';
import { SpeechBubble } from './SpeechBubble';

const FRAME_INTERVAL_MS = 180;
const BUBBLE_TIMEOUT_MS = 4_200;
const CLICK_STREAK_WINDOW_MS = 2_200;
const IDLE_REPLY_MS = 45_000;
const DRAG_THRESHOLD_PX = 6;
const ROOT_WIDTH_PX = 320;
const BUBBLE_RESERVED_HEIGHT_PX = 72;
const BUBBLE_GAP_PX = 8;
const DRAG_LIFT_SPACE_PX = 16;

type DragVisualState = 'idle' | 'held' | 'left' | 'right';

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
  const [animationState, setAnimationState] = useState<PetAnimationState>('idle');
  const [frame, setFrame] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [dragVisual, setDragVisual] = useState<DragVisualState>('idle');
  const clickStreakRef = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });
  const animationStateRef = useRef<PetAnimationState>('idle');
  const dragGestureRef = useRef<DragGesture | null>(null);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % getAnimationFrameCount(animationState));
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [animationState]);

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

  const setCompanionAnimation = (next: PetAnimationState) => {
    if (animationStateRef.current === next) return;
    animationStateRef.current = next;
    setAnimationState(next);
    setFrame(0);
  };

  const setDragVisualState = (next: DragVisualState) => {
    setDragVisual(next);
    if (next === 'right') {
      setCompanionAnimation('running-right');
      return;
    }
    if (next === 'left') {
      setCompanionAnimation('running-left');
      return;
    }
    if (next === 'held') {
      setCompanionAnimation('jumping');
      return;
    }
    setCompanionAnimation('idle');
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
    setDragVisualState('idle');
    onPetDragEnd?.(event);
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
    setReply(selectCompanionReply(category, nowMs, profile.id).text);
    setCompanionAnimation('waving');
    window.setTimeout(() => {
      if (!dragGestureRef.current) setCompanionAnimation('idle');
    }, 900);
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
          type="button"
          aria-label={profile.interactionLabel}
          data-drag-visual={dragVisual}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
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
          <PetSprite
            state={animationState}
            frame={frame}
            spritesheetUrl={profile.spritesheetUrl}
            scale={scale}
          />
        </button>
      </div>
    </div>
  );
}

function getPixelStableLayoutScale(scale: number): number {
  return Math.max(1 / 16, Math.round(scale * 16) / 16);
}
