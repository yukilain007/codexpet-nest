# Shen Xinghui Cat Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Shen Xinghui cat companion as a second local-only desktop pet without replacing Xia Yizhou.

**Architecture:** Generate a separate hatch-pet atlas for Shen Xinghui, bundle it under the desktop app public assets, and make the existing local companion UI data-driven through companion profiles. Pure reply/profile selection stays in `@codexpet/core`; React receives a selected profile and renders the correct spritesheet, accessible label, and local fixed replies.

**Tech Stack:** Hatch-pet, built-in image generation, Python hatch-pet validation scripts, Tauri v2, React 19, TypeScript, Vitest, Testing Library, Vite public assets.

## Global Constraints

- Add Shen Xinghui alongside Xia Yizhou; do not overwrite, remove, or regress Xia Yizhou.
- Preserve Shen Xinghui sticker outfit colors: deep navy-blue jacket, black lapel/collar, white shirt and trousers, blue bow tie or chest accent.
- Preserve visual identity: pale silver-white hair, cat ears with pink inner ears, blue dot eyes, tiny red mouth, pink cheeks, gray-brown sticker outline, curved striped tail.
- No runtime AI calls, no token usage, no API key, no account login, and no network dependency.
- Final pet atlas must be `1536x1872`, 8 columns x 9 rows, `192x208` cells, transparent background, transparent unused cells.
- Do not copy meme text, speech bubbles, white sticker backgrounds, or readable logos into sprite cells.
- Keep `pnpm-workspace.yaml` out of every commit unless the user explicitly asks to include it.

---

## File Structure

- Create or update hatch-pet run files under `/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat/`.
- Create `/Users/yuki/.codex/pets/shen-xinghui-cat/pet.json` and `/Users/yuki/.codex/pets/shen-xinghui-cat/spritesheet.webp`.
- Create `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp`.
- Modify `packages/core/src/local-companion/replies.ts` to support multiple companion profiles and reply sets.
- Modify `packages/core/src/local-companion/replies.test.ts` to cover Shen Xinghui and preserve Xia Yizhou behavior.
- Modify `packages/core/src/index.ts` only if new exports are split into a new module.
- Modify `apps/desktop-tauri/src/components/companion/animation.ts` only if animation metadata needs to expose profile-independent constants.
- Modify `apps/desktop-tauri/src/components/companion/PetSprite.tsx` to accept `spritesheetUrl`.
- Modify `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx` to accept/select a companion profile and default to Shen Xinghui for this QA pass.
- Modify `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx`.
- Modify `apps/desktop-tauri/src/components/overlay/OverlayApp.test.tsx` only where accessible labels or expected profile text change.

---

### Task 1: Hatch Shen Xinghui Cat Pet Asset

**Files:**
- Create: `/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat/pet_request.json`
- Create: `/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat/final/spritesheet.webp`
- Create: `/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat/final/validation.json`
- Create: `/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat/qa/contact-sheet.png`
- Create: `/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat/qa/previews/*.gif`
- Create: `/Users/yuki/.codex/pets/shen-xinghui-cat/pet.json`
- Create: `/Users/yuki/.codex/pets/shen-xinghui-cat/spritesheet.webp`
- Create: `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp`

**Interfaces:**
- Produces app asset path `/pets/shen-xinghui/spritesheet.webp`.
- Produces local pet package id `shen-xinghui-cat`.

- [ ] **Step 1: Prepare the hatch-pet run**

Run:

```bash
cd /Users/yuki/codexpet-nest
SKILL_DIR="${CODEX_HOME:-$HOME/.codex}/skills/hatch-pet"
RUN_DIR="/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat"
python "$SKILL_DIR/scripts/prepare_pet_run.py" \
  --pet-name "shen-xinghui-cat" \
  --description "A sleepy, earnest Shen Xinghui cat companion with silver hair, blue eyes, cat ears, and a navy formal outfit." \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy1ehi3j30wi0whafr.jpg" \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy3e1ooj30u00u0tbl.jpg" \
  --reference "/Users/yuki/Downloads/u=3794904872,212971452&fm=253&app=138&f=JPEG.jpeg" \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy2tix6j30u00u0whh.jpg" \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy1qk91j30wi0wd0y3.jpg" \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy16879j30wi0wd43h.jpg" \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy32x9vj30u00u0tc6.jpg" \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy1z3i5j30wi0wgjwx.jpg" \
  --reference "/Users/yuki/Downloads/008rFKTBly1hz6dy0t2wzj30u00u0wh3.jpg" \
  --output-dir "$RUN_DIR" \
  --style-preset sticker \
  --style-notes "Keep the sticker meme chibi style: soft pale silver hair, tall cat ears, blue dot eyes, pink cheeks, gray-brown hand-drawn outline, curved striped tail, deep navy jacket, black lapel, white shirt and pants, blue bow tie. Do not change outfit colors. No text in sprite cells." \
  --pet-notes "Shen Xinghui cat companion, sleepy and earnest, slightly stubborn and easily flustered; compact full-body sprite with consistent navy formal outfit and cat features." \
  --force
```

Expected: `$RUN_DIR/imagegen-jobs.json` exists and includes `base`, `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, and `review`.

- [ ] **Step 2: Generate and record visual jobs**

For each ready job in `$RUN_DIR/imagegen-jobs.json`, use `$imagegen` with the prompt and input images listed in the job. Repeat the following command block once for each concrete generated job id: `base`, `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, and `review`. Before each run, set `JOB_ID` to that exact id and set `SOURCE` to the exact `selected_source` path returned by the visual generation worker.

```bash
cd /Users/yuki/codexpet-nest
RUN_DIR="/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat"
JOB_ID=base
SOURCE="$SELECTED_SOURCE"
OUTPUT_REL=$(jq -r --arg id "$JOB_ID" '.jobs[] | select(.id == $id) | .output_path' "$RUN_DIR/imagegen-jobs.json")
mkdir -p "$(dirname "$RUN_DIR/$OUTPUT_REL")"
cp "$SOURCE" "$RUN_DIR/$OUTPUT_REL"
if [ "$JOB_ID" = "base" ]; then
  mkdir -p "$RUN_DIR/references"
  cp "$RUN_DIR/$OUTPUT_REL" "$RUN_DIR/references/canonical-base.png"
fi
UPDATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TMP_MANIFEST=$(mktemp)
jq --arg id "$JOB_ID" --arg source "$SOURCE" --arg at "$UPDATED_AT" '(.jobs[] | select(.id == $id)) += {status: "complete", source_path: $source, completed_at: $at}' "$RUN_DIR/imagegen-jobs.json" > "$TMP_MANIFEST"
mv "$TMP_MANIFEST" "$RUN_DIR/imagegen-jobs.json"
```

Expected: every job in `imagegen-jobs.json` has `"status": "complete"`.

- [ ] **Step 3: Derive running-left only if safe**

If `running-right` is visually symmetric enough to mirror without changing identity, run:

```bash
cd /Users/yuki/codexpet-nest
SKILL_DIR="${CODEX_HOME:-$HOME/.codex}/skills/hatch-pet"
RUN_DIR="/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat"
python "$SKILL_DIR/scripts/derive_running_left_from_running_right.py" \
  --run-dir "$RUN_DIR" \
  --confirm-appropriate-mirror \
  --decision-note "The Shen Xinghui cat design keeps the same outfit, face, ears, and tail identity when mirrored for leftward drag movement."
```

Expected: `running-left` is marked complete and preserves frame order. If mirroring makes the tail or outfit read wrong, generate `running-left` as its own row with `$imagegen`.

- [ ] **Step 4: Build and validate the atlas**

Run:

```bash
cd /Users/yuki/codexpet-nest
SKILL_DIR="${CODEX_HOME:-$HOME/.codex}/skills/hatch-pet"
RUN_DIR="/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat"
mkdir -p "$RUN_DIR/final" "$RUN_DIR/qa"
python "$SKILL_DIR/scripts/extract_strip_frames.py" \
  --decoded-dir "$RUN_DIR/decoded" \
  --output-dir "$RUN_DIR/frames" \
  --states all \
  --method auto
python "$SKILL_DIR/scripts/inspect_frames.py" \
  --frames-root "$RUN_DIR/frames" \
  --json-out "$RUN_DIR/qa/review.json" \
  --require-components
python "$SKILL_DIR/scripts/compose_atlas.py" \
  --frames-root "$RUN_DIR/frames" \
  --output "$RUN_DIR/final/spritesheet.png" \
  --webp-output "$RUN_DIR/final/spritesheet.webp"
python "$SKILL_DIR/scripts/validate_atlas.py" \
  "$RUN_DIR/final/spritesheet.webp" \
  --json-out "$RUN_DIR/final/validation.json"
python "$SKILL_DIR/scripts/make_contact_sheet.py" \
  "$RUN_DIR/final/spritesheet.webp" \
  --output "$RUN_DIR/qa/contact-sheet.png"
python "$SKILL_DIR/scripts/render_animation_previews.py" \
  --frames-root "$RUN_DIR/frames" \
  --output-dir "$RUN_DIR/qa/previews"
```

Expected: `qa/review.json` has no errors, `final/validation.json` reports a valid `1536x1872` atlas, and contact sheet/previews exist.

- [ ] **Step 5: Package and bundle the asset**

Run:

```bash
cd /Users/yuki/codexpet-nest
RUN_DIR="/Users/yuki/codexpet-nest/.hatch-runs/shen-xinghui-cat"
PET_DIR="${CODEX_HOME:-$HOME/.codex}/pets/shen-xinghui-cat"
mkdir -p "$PET_DIR" apps/desktop-tauri/public/pets/shen-xinghui
cp "$RUN_DIR/final/spritesheet.webp" "$PET_DIR/spritesheet.webp"
jq -n \
  --arg id "shen-xinghui-cat" \
  --arg displayName "沈星回猫猫" \
  --arg description "一只困困又认真、容易被看扁的沈星回猫猫桌宠。" \
  '{id: $id, displayName: $displayName, description: $description, spritesheetPath: "spritesheet.webp"}' \
  > "$PET_DIR/pet.json"
cp "$RUN_DIR/final/spritesheet.webp" apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp
jq -n \
  --arg run_dir "$RUN_DIR" \
  --arg spritesheet "$RUN_DIR/final/spritesheet.webp" \
  --arg validation "$RUN_DIR/final/validation.json" \
  --arg contact_sheet "$RUN_DIR/qa/contact-sheet.png" \
  --arg review "$RUN_DIR/qa/review.json" \
  --arg package "$PET_DIR" \
  '{ok: true, run_dir: $run_dir, spritesheet: $spritesheet, validation: $validation, contact_sheet: $contact_sheet, review: $review, package: $package}' \
  > "$RUN_DIR/qa/run-summary.json"
```

Expected: `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp` exists and can be used by the app.

- [ ] **Step 6: Commit the generated asset**

Run:

```bash
cd /Users/yuki/codexpet-nest
git add apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp
git commit -m "feat: add shen xinghui pet asset"
```

Expected: commit includes only the bundled Shen Xinghui spritesheet.

---

### Task 2: Companion Profiles And Reply Sets

**Files:**
- Modify: `packages/core/src/local-companion/replies.ts`
- Modify: `packages/core/src/local-companion/replies.test.ts`
- Modify: `packages/core/src/index.ts` only if exports move to a new file

**Interfaces:**
- Consumes app asset path `/pets/shen-xinghui/spritesheet.webp`.
- Produces:
  - `type CompanionProfileId = 'xia-yizhou' | 'shen-xinghui'`
  - `interface CompanionProfile { id: CompanionProfileId; displayName: string; interactionLabel: string; spritesheetUrl: string; replies: Record<CompanionReplyCategory, string[]> }`
  - `COMPANION_PROFILES: Record<CompanionProfileId, CompanionProfile>`
  - `DEFAULT_COMPANION_PROFILE_ID: CompanionProfileId`
  - `getCompanionProfile(id?: CompanionProfileId): CompanionProfile`
  - `selectCompanionReply(category: CompanionReplyCategory, seed?: number, profileId?: CompanionProfileId): CompanionReply`

- [ ] **Step 1: Write failing core tests**

Append these tests to `packages/core/src/local-companion/replies.test.ts`:

```ts
  it('exposes the Shen Xinghui companion profile with its bundled sprite path', () => {
    const profile = getCompanionProfile('shen-xinghui');

    expect(profile.displayName).toBe('沈星回猫猫');
    expect(profile.interactionLabel).toBe('和沈星回互动');
    expect(profile.spritesheetUrl).toBe('/pets/shen-xinghui/spritesheet.webp');
  });

  it('keeps Xia Yizhou replies available separately from Shen Xinghui replies', () => {
    const xiaReply = selectCompanionReply('click', 0, 'xia-yizhou');
    const shenReply = selectCompanionReply('click', 0, 'shen-xinghui');

    expect(xiaReply.text).toBe('我在。');
    expect(shenReply.text).toBe('真的被看扁了。');
  });

  it('defaults new companion profile lookup to Shen Xinghui for this QA pass', () => {
    expect(getCompanionProfile().id).toBe(DEFAULT_COMPANION_PROFILE_ID);
    expect(DEFAULT_COMPANION_PROFILE_ID).toBe('shen-xinghui');
  });
```

Also update the import:

```ts
import {
  COMPANION_PROFILES,
  DEFAULT_COMPANION_PROFILE_ID,
  XIA_YIZHOU_REPLIES,
  categoryForInteraction,
  getCompanionProfile,
  selectCompanionReply,
} from './replies';
```

- [ ] **Step 2: Run the core test and verify it fails**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm --filter @codexpet/core test -- local-companion/replies.test.ts
```

Expected: FAIL because `getCompanionProfile`, `COMPANION_PROFILES`, and `DEFAULT_COMPANION_PROFILE_ID` are not exported.

- [ ] **Step 3: Implement profiles and Shen Xinghui replies**

Replace `packages/core/src/local-companion/replies.ts` with:

```ts
export type CompanionReplyCategory = 'click' | 'idle' | 'night' | 'secret' | 'done' | 'error';

export type CompanionProfileId = 'xia-yizhou' | 'shen-xinghui';

export interface CompanionReply {
  category: CompanionReplyCategory;
  text: string;
}

export type CompanionReplySet = Record<CompanionReplyCategory, string[]>;

export interface CompanionProfile {
  id: CompanionProfileId;
  displayName: string;
  interactionLabel: string;
  spritesheetUrl: string;
  replies: CompanionReplySet;
}

export const XIA_YIZHOU_REPLIES: CompanionReplySet = {
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

export const SHEN_XINGHUI_REPLIES: CompanionReplySet = {
  click: ['真的被看扁了。', '嗯嗯好的。', '差不多星了。'],
  idle: [
    '虽然什么都没干，但今天也真是辛苦我了呢。',
    '今天一定要努力工作。',
    '吃又吃不饱，睡又睡不醒。',
  ],
  night: ['睡又睡不醒。', '今天的任务响应率可能只有0.7%。', '再不睡，我也要困扁了。'],
  secret: ['你少看扁我。', '那我扁扁地走开。', '如果你惹毛了我，那我就毛茸茸地走开。'],
  done: ['OK，好的。', '收到。', '嗯嗯好的。'],
  error: ['那我扁扁的走开。', '真的被看扁了。', '差不多星了。'],
};

export const DEFAULT_COMPANION_PROFILE_ID: CompanionProfileId = 'shen-xinghui';

export const COMPANION_PROFILES: Record<CompanionProfileId, CompanionProfile> = {
  'xia-yizhou': {
    id: 'xia-yizhou',
    displayName: '夏以昼',
    interactionLabel: '和夏以昼互动',
    spritesheetUrl: '/pets/xia-yizhou/spritesheet.webp',
    replies: XIA_YIZHOU_REPLIES,
  },
  'shen-xinghui': {
    id: 'shen-xinghui',
    displayName: '沈星回猫猫',
    interactionLabel: '和沈星回互动',
    spritesheetUrl: '/pets/shen-xinghui/spritesheet.webp',
    replies: SHEN_XINGHUI_REPLIES,
  },
};

export function getCompanionProfile(
  id: CompanionProfileId = DEFAULT_COMPANION_PROFILE_ID,
): CompanionProfile {
  return COMPANION_PROFILES[id];
}

export function selectCompanionReply(
  category: CompanionReplyCategory,
  seed = Date.now(),
  profileId: CompanionProfileId = 'xia-yizhou',
): CompanionReply {
  const replies = getCompanionProfile(profileId).replies[category];
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

Keep `selectCompanionReply(category, seed)` backward compatible by defaulting its `profileId` parameter to Xia Yizhou.

- [ ] **Step 4: Run the core test and verify it passes**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm --filter @codexpet/core test -- local-companion/replies.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit core profile work**

Run:

```bash
cd /Users/yuki/codexpet-nest
git add packages/core/src/local-companion/replies.ts packages/core/src/local-companion/replies.test.ts
git commit -m "feat: add shen xinghui companion profile"
```

Expected: commit contains only core reply/profile code and tests.

---

### Task 3: Render Selected Companion Profile In The Overlay

**Files:**
- Modify: `apps/desktop-tauri/src/components/companion/PetSprite.tsx`
- Modify: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`
- Modify: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx`
- Modify: `apps/desktop-tauri/src/components/overlay/OverlayApp.test.tsx` only where labels change

**Interfaces:**
- Consumes:
  - `getCompanionProfile(id?: CompanionProfileId): CompanionProfile`
  - `CompanionProfile.spritesheetUrl`
  - `CompanionProfile.interactionLabel`
- Produces:
  - `PetSprite({ state, frame, scale, spritesheetUrl })`
  - `LocalCompanionOverlay({ clickThrough, profileId })`

- [ ] **Step 1: Write failing component tests**

In `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx`, update and add tests:

```tsx
  it('renders the default Shen Xinghui pet sprite', () => {
    render(<LocalCompanionOverlay clickThrough={false} />);

    expect(screen.getByTestId('local-companion-root')).toHaveStyle({
      width: '320px',
      minHeight: '236px',
    });
    expect(screen.getByRole('button', { name: '和沈星回互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-pet')).toHaveStyle({
      backgroundImage: 'url(/pets/shen-xinghui/spritesheet.webp)',
    });
  });

  it('can still render the Xia Yizhou pet profile', () => {
    render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);

    expect(screen.getByRole('button', { name: '和夏以昼互动' })).toBeInTheDocument();
    expect(screen.getByTestId('local-companion-pet')).toHaveStyle({
      backgroundImage: 'url(/pets/xia-yizhou/spritesheet.webp)',
    });
  });

  it('shows a Shen Xinghui local reply when clicked', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));
    render(<LocalCompanionOverlay clickThrough={false} />);

    fireEvent.click(screen.getByRole('button', { name: '和沈星回互动' }));

    expect(screen.getByTestId('local-companion-bubble')).toHaveTextContent(
      /看扁|嗯嗯好的|差不多星/,
    );
  });
```

Update any existing `和夏以昼互动` default-click queries to `和沈星回互动`, except the explicit Xia Yizhou compatibility test.

- [ ] **Step 2: Run the desktop component test and verify it fails**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm --filter @codexpet/desktop-tauri test -- LocalCompanionOverlay.test.tsx
```

Expected: FAIL because `profileId` and `spritesheetUrl` rendering are not wired.

- [ ] **Step 3: Update `PetSprite`**

Modify `apps/desktop-tauri/src/components/companion/PetSprite.tsx`:

```tsx
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
```

- [ ] **Step 4: Update `LocalCompanionOverlay`**

Modify `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx` so the component starts like this:

```tsx
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
```

Update the signature and profile lookup:

```tsx
export function LocalCompanionOverlay({
  clickThrough,
  profileId,
}: {
  clickThrough: boolean;
  profileId?: CompanionProfileId;
}) {
  const profile = getCompanionProfile(profileId);
```

Update reply selection calls:

```tsx
setReply(selectCompanionReply('idle', Date.now(), profile.id).text);
```

and:

```tsx
setReply(selectCompanionReply(category, nowMs, profile.id).text);
```

Update the button and sprite:

```tsx
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
```

- [ ] **Step 5: Run the desktop component test and verify it passes**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm --filter @codexpet/desktop-tauri test -- LocalCompanionOverlay.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run overlay tests and update label expectations if needed**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm --filter @codexpet/desktop-tauri test -- OverlayApp.test.tsx
```

Expected: PASS. If a test queries the old default accessible label, update it from `和夏以昼互动` to `和沈星回互动` because the default QA profile is Shen Xinghui.

- [ ] **Step 7: Commit UI profile rendering**

Run:

```bash
cd /Users/yuki/codexpet-nest
git add \
  apps/desktop-tauri/src/components/companion/PetSprite.tsx \
  apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx \
  apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx \
  apps/desktop-tauri/src/components/overlay/OverlayApp.test.tsx
git commit -m "feat: render selected companion profile"
```

Expected: commit contains only profile-driven renderer changes and tests.

---

### Task 4: Verify Full Local App

**Files:**
- Read: `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp`
- Read: `packages/core/src/local-companion/replies.ts`
- Read: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`

**Interfaces:**
- Consumes all previous tasks.
- Produces a verified local build state ready for packaging.

- [ ] **Step 1: Run full tests**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm lint
```

Expected: PASS.

- [ ] **Step 4: Run release smoke check**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm qa:release-smoke
```

Expected: PASS.

- [ ] **Step 5: Commit any verification-only fixes**

If verification required a small code fix, stage only the known Shen Xinghui companion files that were changed by that fix:

```bash
cd /Users/yuki/codexpet-nest
git status --short
git add \
  packages/core/src/local-companion/replies.ts \
  packages/core/src/local-companion/replies.test.ts \
  apps/desktop-tauri/src/components/companion/PetSprite.tsx \
  apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx \
  apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx \
  apps/desktop-tauri/src/components/overlay/OverlayApp.test.tsx
git commit -m "fix: stabilize shen xinghui companion"
```

Expected: no unrelated `pnpm-workspace.yaml` change is included.

---

### Task 5: Rebuild Installers

**Files:**
- Create: `apps/desktop-tauri/src-tauri/target/release/bundle/dmg/*.dmg`
- Create via GitHub Actions: Windows `*.exe` and `*.msi` artifacts

**Interfaces:**
- Consumes the verified app state from Task 4.
- Produces Mac and Windows installable packages that include the Shen Xinghui pet asset.

- [ ] **Step 1: Build the Mac DMG**

Run:

```bash
cd /Users/yuki/codexpet-nest
pnpm tauri:build:mac:dmg
```

Expected: a new `CodexPet-Nest-0.1.12-aarch64.dmg` exists under `apps/desktop-tauri/src-tauri/target/release/bundle/dmg/`.

- [ ] **Step 2: Push commits to the user's fork**

Run from the user's terminal if Codex cannot access GitHub credentials:

```bash
cd /Users/yuki/codexpet-nest
GIT_CONFIG_GLOBAL=/dev/null git push https://github.com/yukilain007/codexpet-nest.git HEAD:main
```

Expected: remote `main` updates to the latest local commit.

- [ ] **Step 3: Wait for Windows CI**

Check:

```bash
cd /Users/yuki/codexpet-nest
curl -fsSL 'https://api.github.com/repos/yukilain007/codexpet-nest/actions/workflows/windows-build.yml/runs?per_page=5'
```

Expected: newest run for the pushed commit completes with `conclusion: "success"`.

- [ ] **Step 4: Download Windows artifact**

Use the GitHub artifact named `codexpet-nest-windows-bundle` from the successful workflow run.

Expected files after extraction:

```text
CodexPet Nest_0.1.12_x64-setup.exe
CodexPet Nest_0.1.12_x64_en-US.msi
```

---

## Self-Review

- Spec coverage: the plan covers separate Shen Xinghui asset generation, non-overwrite behavior, outfit color preservation, app profile integration, fixed local replies, tests, and Mac/Windows packaging.
- Placeholder scan: no `TBD`, `TODO`, or undefined implementation slots remain.
- Type consistency: `CompanionProfileId`, `CompanionProfile`, `getCompanionProfile`, `selectCompanionReply`, and `LocalCompanionOverlay` signatures are consistent across tasks.
