import { useEffect, useRef, useState } from 'react';
import {
  categoryForInteraction,
  getCompanionProfile,
  selectCompanionReply,
  type CompanionProfileId,
} from '@codexpet/core';
import { getAnimationFrameCount, type PetAnimationState } from './animation';
import { PetSprite } from './PetSprite';
import { SpeechBubble } from './SpeechBubble';

const FRAME_INTERVAL_MS = 180;
const BUBBLE_TIMEOUT_MS = 4_200;
const CLICK_STREAK_WINDOW_MS = 2_200;
const IDLE_REPLY_MS = 45_000;
const SPRITE_SCALE = 0.86;

export function LocalCompanionOverlay({
  clickThrough,
  profileId,
}: {
  clickThrough: boolean;
  profileId?: CompanionProfileId;
}) {
  const profile = getCompanionProfile(profileId);
  const [animationState, setAnimationState] = useState<PetAnimationState>('idle');
  const [frame, setFrame] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const clickStreakRef = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });

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

  const handleClick = () => {
    if (clickThrough) return;
    const nowMs = Date.now();
    const previous = clickStreakRef.current;
    const count = nowMs - previous.lastAt <= CLICK_STREAK_WINDOW_MS ? previous.count + 1 : 1;
    clickStreakRef.current = { count, lastAt: nowMs };
    const category = categoryForInteraction({ now: new Date(nowMs), clickCount: count });
    setReply(selectCompanionReply(category, nowMs, profile.id).text);
    setAnimationState('waving');
    setFrame(0);
    window.setTimeout(() => setAnimationState('idle'), 900);
  };

  return (
    <div
      data-testid="local-companion-root"
      style={{
        position: 'relative',
        width: 320,
        minHeight: 236,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexDirection: 'column',
        pointerEvents: clickThrough ? 'none' : 'auto',
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
        {reply && <SpeechBubble text={reply} />}
      </div>
      <button
        type="button"
        aria-label={profile.interactionLabel}
        onClick={handleClick}
        style={{
          border: 0,
          padding: 0,
          background: 'transparent',
          cursor: clickThrough ? 'default' : 'pointer',
        }}
      >
        <PetSprite
          state={animationState}
          frame={frame}
          spritesheetUrl={profile.spritesheetUrl}
          scale={SPRITE_SCALE}
        />
      </button>
    </div>
  );
}
