# Xia Yizhou Local Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only Xia Yizhou interactive desktop companion MVP to the existing Tauri overlay.

**Architecture:** Keep the existing Tauri overlay shell and add a small local companion layer. Pure reply-selection logic lives in `@codexpet/core`; React components render the bundled pet atlas and speech bubble in the desktop overlay.

**Tech Stack:** Tauri v2, React 19, TypeScript, Zustand, Vitest, Testing Library, Vite public assets.

## Global Constraints

- No AI calls, no token usage, no API key, no account login, and no network dependency.
- Use existing pet atlas `/Users/yuki/.codex/pets/xia-yizhou/spritesheet.webp`.
- Bundle a copy of that atlas in `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp`.
- Preserve existing overlay drag, follow-Codex, standalone fixed position, click-through, and debug behavior.
- Keep the first version local and small; do not add editable reply settings.
- Do not touch unrelated dirty worktree changes such as `pnpm-workspace.yaml`.

---

## File Structure

- Create `packages/core/src/local-companion/replies.ts`: pure local reply category and selection helpers.
- Modify `packages/core/src/index.ts`: export local companion helpers.
- Create `packages/core/src/local-companion/replies.test.ts`: unit tests for local reply behavior.
- Create `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp`: bundled atlas asset copied from the existing Codex pet.
- Create `apps/desktop-tauri/src/components/companion/PetSprite.tsx`: atlas renderer.
- Create `apps/desktop-tauri/src/components/companion/SpeechBubble.tsx`: speech bubble renderer.
- Create `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`: click/idle state coordinator.
- Create `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx`: component behavior tests.
- Modify `apps/desktop-tauri/src/components/overlay/OverlayApp.tsx`: render the local companion in the existing overlay window.
- Modify `apps/desktop-tauri/src/components/overlay/OverlayApp.test.tsx`: update expectations for the primary companion overlay.

---

### Task 1: Local Reply Model

**Files:**
- Create: `packages/core/src/local-companion/replies.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/local-companion/replies.test.ts`

**Interfaces:**
- Produces:
  - `type CompanionReplyCategory = 'click' | 'idle' | 'night' | 'secret' | 'done' | 'error'`
  - `interface CompanionReply { category: CompanionReplyCategory; text: string }`
  - `XIA_YIZHOU_REPLIES: Record<CompanionReplyCategory, string[]>`
  - `selectCompanionReply(category: CompanionReplyCategory, seed?: number): CompanionReply`
  - `categoryForInteraction(input: { now: Date; clickCount: number }): CompanionReplyCategory`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/src/local-companion/replies.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  XIA_YIZHOU_REPLIES,
  categoryForInteraction,
  selectCompanionReply,
} from './replies';

describe('local companion replies', () => {
  it('selects a stable click reply by seed', () => {
    const reply = selectCompanionReply('click', 0);
    expect(reply).toEqual({ category: 'click', text: XIA_YIZHOU_REPLIES.click[0] });
  });

  it('wraps seeded selection within the category list', () => {
    const reply = selectCompanionReply('secret', 999);
    expect(reply.category).toBe('secret');
    expect(XIA_YIZHOU_REPLIES.secret).toContain(reply.text);
  });

  it('uses secret mode for repeated clicks', () => {
    expect(categoryForInteraction({ now: new Date('2026-06-30T12:00:00+08:00'), clickCount: 4 }))
      .toBe('secret');
  });

  it('uses night mode late at night before ordinary click replies', () => {
    expect(categoryForInteraction({ now: new Date('2026-06-30T23:30:00+08:00'), clickCount: 1 }))
      .toBe('night');
  });

  it('uses click mode during daytime ordinary clicks', () => {
    expect(categoryForInteraction({ now: new Date('2026-06-30T15:30:00+08:00'), clickCount: 1 }))
      .toBe('click');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm --filter @codexpet/core test -- local-companion/replies.test.ts`

Expected: FAIL because `./replies` does not exist.

- [ ] **Step 3: Implement the reply model**

Create `packages/core/src/local-companion/replies.ts`:

```ts
export type CompanionReplyCategory = 'click' | 'idle' | 'night' | 'secret' | 'done' | 'error';

export interface CompanionReply {
  category: CompanionReplyCategory;
  text: string;
}

export const XIA_YIZHOU_REPLIES: Record<CompanionReplyCategory, string[]> = {
  click: ['我在。', '怎么了？慢慢说。', '如果有什么心事，可以悄悄告诉我。'],
  idle: [
    '晒太阳是很舒服的事，身上会充满阳光的味道。',
    '最近没休息好？正好该午休了，和我一起补会觉。',
    '过几天会有一个太阳天，一起出去逛逛？',
    '现在已经错过朝霞了，不过晚上还有晚霞，到时候带你飞去天上看。',
  ],
  night: [
    '我不睡，是有报告要批，你不睡是准备埋伏流浪体？',
    '我回来后，你休息得比之前更好吗，还是更差？',
    '今天的床似乎对你的吸引力不够大。',
  ],
  secret: [
    '嘴巴都张开了，怎么又闭上了？记住，无论是什么事，都不要瞒着我。',
    '关于你的，我全都知道。',
    '妹妹。',
  ],
  done: ['好了，看看结果。', '不管什么身份，我都是那个能让你依靠的夏以昼。'],
  error: ['没关系，再试一次。', '这里出了点小问题。'],
};

export function selectCompanionReply(
  category: CompanionReplyCategory,
  seed = Date.now(),
): CompanionReply {
  const replies = XIA_YIZHOU_REPLIES[category];
  const index = positiveModulo(Math.floor(seed), replies.length);
  return { category, text: replies[index] ?? replies[0] ?? '' };
}

export function categoryForInteraction(input: {
  now: Date;
  clickCount: number;
}): CompanionReplyCategory {
  if (input.clickCount >= 4) return 'secret';
  const hour = input.now.getHours();
  if (hour >= 22 || hour < 6) return 'night';
  return 'click';
}

function positiveModulo(value: number, divisor: number): number {
  if (divisor <= 0) return 0;
  return ((value % divisor) + divisor) % divisor;
}
```

Modify `packages/core/src/index.ts`:

```ts
export * from './codex-home';
export * from './local-companion/replies';
export * from './overlay-runtime';
export * from './package-registry';
export * from './package-schema';
export * from './settings';
export * from './sync';
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm --filter @codexpet/core test -- local-companion/replies.test.ts`

Expected: PASS.

---

### Task 2: Companion UI Components

**Files:**
- Create: `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp`
- Create: `apps/desktop-tauri/src/components/companion/PetSprite.tsx`
- Create: `apps/desktop-tauri/src/components/companion/SpeechBubble.tsx`
- Create: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`
- Test: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx`

**Interfaces:**
- Consumes:
  - `categoryForInteraction(input: { now: Date; clickCount: number }): CompanionReplyCategory`
  - `selectCompanionReply(category: CompanionReplyCategory, seed?: number): CompanionReply`
- Produces:
  - `LocalCompanionOverlay({ clickThrough }: { clickThrough: boolean })`

- [ ] **Step 1: Copy the atlas asset**

Run:

```bash
mkdir -p apps/desktop-tauri/public/pets/xia-yizhou
cp /Users/yuki/.codex/pets/xia-yizhou/spritesheet.webp apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp
```

Expected: `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp` exists.

- [ ] **Step 2: Write failing component tests**

Create `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocalCompanionOverlay } from './LocalCompanionOverlay';

describe('LocalCompanionOverlay', () => {
  it('renders the Xia Yizhou pet sprite', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);
    expect(screen.getByTestId('local-companion-pet')).toBeInTheDocument();
  });

  it('shows a local reply when clicked', () => {
    vi.setSystemTime(new Date('2026-06-30T15:30:00+08:00'));
    render(<LocalCompanionOverlay clickThrough={false} />);

    fireEvent.click(screen.getByTestId('local-companion-pet'));

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(/我在|怎么了|心事/);
    vi.useRealTimers();
  });

  it('does not handle clicks when click-through is enabled', () => {
    render(<LocalCompanionOverlay clickThrough />);

    fireEvent.click(screen.getByTestId('local-companion-pet'));

    expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
  });

  it('can show hidden stronger lines after repeated clicks', () => {
    vi.setSystemTime(new Date('2026-06-30T15:30:00+08:00'));
    render(<LocalCompanionOverlay clickThrough={false} />);
    const pet = screen.getByTestId('local-companion-pet');

    fireEvent.click(pet);
    fireEvent.click(pet);
    fireEvent.click(pet);
    fireEvent.click(pet);

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(/不要瞒着我|全都知道|妹妹/);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 3: Run the test and verify it fails**

Run: `pnpm --filter @codexpet/desktop-tauri test -- LocalCompanionOverlay.test.tsx`

Expected: FAIL because `LocalCompanionOverlay` does not exist.

- [ ] **Step 4: Implement `PetSprite`**

Create `apps/desktop-tauri/src/components/companion/PetSprite.tsx`:

```tsx
export type PetAnimationState = 'idle' | 'waving';

const ATLAS_COLUMNS = 8;
const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;
const SPRITESHEET_URL = '/pets/xia-yizhou/spritesheet.webp';

const animationRows: Record<PetAnimationState, { row: number; frames: number; durationMs: number }> = {
  idle: { row: 0, frames: 6, durationMs: 1200 },
  waving: { row: 3, frames: 4, durationMs: 820 },
};

export function PetSprite({
  state,
  frame,
}: {
  state: PetAnimationState;
  frame: number;
}) {
  const animation = animationRows[state];
  const frameIndex = frame % animation.frames;
  return (
    <div
      data-testid="local-companion-pet"
      style={{
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        backgroundImage: `url(${SPRITESHEET_URL})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${CELL_WIDTH * ATLAS_COLUMNS}px auto`,
        backgroundPosition: `-${frameIndex * CELL_WIDTH}px -${animation.row * CELL_HEIGHT}px`,
        imageRendering: 'auto',
        filter: 'drop-shadow(0 10px 16px rgba(24, 32, 47, 0.18))',
      }}
    />
  );
}

export function getAnimationFrameCount(state: PetAnimationState): number {
  return animationRows[state].frames;
}
```

- [ ] **Step 5: Implement `SpeechBubble`**

Create `apps/desktop-tauri/src/components/companion/SpeechBubble.tsx`:

```tsx
export function SpeechBubble({ text }: { text: string }) {
  return (
    <div
      data-testid="local-companion-bubble"
      style={{
        maxWidth: 260,
        padding: '10px 12px',
        borderRadius: 14,
        background: 'rgba(255, 250, 240, 0.96)',
        border: '1px solid rgba(241, 193, 113, 0.82)',
        boxShadow: '0 12px 28px rgba(63, 46, 22, 0.18)',
        color: '#3b2a1a',
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.45,
      }}
    >
      {text}
    </div>
  );
}
```

- [ ] **Step 6: Implement `LocalCompanionOverlay`**

Create `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { categoryForInteraction, selectCompanionReply } from '@codexpet/core';
import { getAnimationFrameCount, PetSprite, type PetAnimationState } from './PetSprite';
import { SpeechBubble } from './SpeechBubble';

const FRAME_INTERVAL_MS = 180;
const BUBBLE_TIMEOUT_MS = 4200;
const CLICK_STREAK_WINDOW_MS = 2200;
const IDLE_REPLY_MS = 45_000;

export function LocalCompanionOverlay({ clickThrough }: { clickThrough: boolean }) {
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
    if (reply === null) return;
    const timer = window.setTimeout(() => setReply(null), BUBBLE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [reply]);

  useEffect(() => {
    if (clickThrough) return;
    const timer = window.setInterval(() => {
      setReply(selectCompanionReply('idle').text);
    }, IDLE_REPLY_MS);
    return () => window.clearInterval(timer);
  }, [clickThrough]);

  const handleClick = () => {
    if (clickThrough) return;
    const nowMs = Date.now();
    const previous = clickStreakRef.current;
    const count = nowMs - previous.lastAt <= CLICK_STREAK_WINDOW_MS ? previous.count + 1 : 1;
    clickStreakRef.current = { count, lastAt: nowMs };
    const category = categoryForInteraction({ now: new Date(nowMs), clickCount: count });
    setReply(selectCompanionReply(category, nowMs).text);
    setAnimationState('waving');
    setFrame(0);
    window.setTimeout(() => setAnimationState('idle'), 900);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: 330,
        minHeight: 260,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: clickThrough ? 'none' : 'auto',
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
        {reply && <SpeechBubble text={reply} />}
      </div>
      <button
        type="button"
        aria-label="和夏以昼互动"
        onClick={handleClick}
        style={{
          border: 0,
          padding: 0,
          background: 'transparent',
          cursor: clickThrough ? 'default' : 'pointer',
        }}
      >
        <PetSprite state={animationState} frame={frame} />
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Run component tests**

Run: `pnpm --filter @codexpet/desktop-tauri test -- LocalCompanionOverlay.test.tsx`

Expected: PASS.

---

### Task 3: Wire Companion Into Overlay

**Files:**
- Modify: `apps/desktop-tauri/src/components/overlay/OverlayApp.tsx`
- Modify: `apps/desktop-tauri/src/components/overlay/OverlayApp.test.tsx`

**Interfaces:**
- Consumes: `LocalCompanionOverlay({ clickThrough }: { clickThrough: boolean })`
- Produces: overlay root still supports drag region and diagnostics while showing the companion as the primary visible content.

- [ ] **Step 1: Write failing overlay expectations**

Modify the production overlay test in `apps/desktop-tauri/src/components/overlay/OverlayApp.test.tsx` so it expects the local companion:

```tsx
expect(screen.getByTestId('local-companion-pet')).toBeInTheDocument();
expect(screen.queryByTestId('nest-render-model')).not.toBeInTheDocument();
```

Add a click-through expectation:

```tsx
expect(screen.getByTestId('local-companion-pet').closest('div')).toBeTruthy();
```

- [ ] **Step 2: Run the overlay test and verify it fails**

Run: `pnpm --filter @codexpet/desktop-tauri test -- OverlayApp.test.tsx`

Expected: FAIL because `OverlayApp` still renders `NestOverlayView` as primary content.

- [ ] **Step 3: Render `LocalCompanionOverlay` in `OverlayApp`**

In `apps/desktop-tauri/src/components/overlay/OverlayApp.tsx`:

Add import:

```ts
import { LocalCompanionOverlay } from '@/components/companion/LocalCompanionOverlay';
```

Replace the primary production content inside the centered container:

```tsx
<LocalCompanionOverlay clickThrough={interactiveDisabled} />
```

Keep existing debug panels, drag region, action result, fallback, and diagnostic blocks around it.

- [ ] **Step 4: Run overlay tests**

Run: `pnpm --filter @codexpet/desktop-tauri test -- OverlayApp.test.tsx`

Expected: PASS after updating tests that intentionally expected nest UI as the production primary content.

---

### Task 4: Verification And Build

**Files:**
- Modify only files from Tasks 1-3 if verification reveals issues.

**Interfaces:**
- Consumes all implemented files.
- Produces verified local MVP build.

- [ ] **Step 1: Run focused package tests**

Run:

```bash
pnpm --filter @codexpet/core test
pnpm --filter @codexpet/desktop-tauri test
```

Expected: PASS.

- [ ] **Step 2: Run static checks**

Run:

```bash
pnpm --filter @codexpet/core typecheck
pnpm --filter @codexpet/desktop-tauri typecheck
pnpm --filter @codexpet/desktop-tauri lint
```

Expected: PASS.

- [ ] **Step 3: Build the desktop frontend**

Run:

```bash
pnpm --filter @codexpet/desktop-tauri build
```

Expected: PASS and `apps/desktop-tauri/dist` exists.

- [ ] **Step 4: Build macOS app bundle if frontend succeeds**

Run:

```bash
pnpm tauri:build:app
```

Expected on this Mac: a macOS `.app` bundle is produced under `apps/desktop-tauri/src-tauri/target/release/bundle/macos/`.

- [ ] **Step 5: Report Windows packaging boundary**

State clearly in the final handoff: Windows installer should be built on Windows or CI using the existing Windows workflow/configuration, not from this macOS-only run.

---

## Plan Self-Review

- Spec coverage: local atlas use, fixed replies, click bubble, repeated-click secret lines, idle lines, no AI/API/network, and existing overlay reuse are all mapped to Tasks 1-4.
- Red-flag scan: every implementation step is concrete and specified.
- Type consistency: `CompanionReplyCategory`, `selectCompanionReply`, `categoryForInteraction`, `PetSprite`, and `LocalCompanionOverlay` names are consistent across tasks.
