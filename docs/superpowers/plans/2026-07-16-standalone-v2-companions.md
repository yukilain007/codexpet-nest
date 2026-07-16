# Standalone V2 Companions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the separately installed Xia Yizhou and Shen Xinghui standalone desktop companions to the approved v2 atlases, nine standard states, global-cursor 16-direction gaze, and macOS/Windows 0.2.0 packages.

**Architecture:** Keep the existing Tauri v2 + React variant-build architecture. Add a small read-only native cursor sample command, pure TypeScript gaze and state-selection modules, a v2 pose renderer with exact per-frame timings, and orchestration in `LocalCompanionOverlay`; both character builds share mechanics while profiles retain separate assets, identities, dialogue, and cadence.

**Tech Stack:** Tauri 2.11, Rust 2021, React 19, TypeScript 5.7, Vitest 3, Testing Library, pnpm 10, hatch-pet v2 validation scripts, GitHub Actions `windows-latest`.

## Global Constraints

- Xia Yizhou and Shen Xinghui remain two separately installed applications.
- Preserve identifiers `xyz.codexpet.nest.xiayizhou` and `xyz.codexpet.nest.shenxinghui`.
- The target version is exactly `0.2.0`.
- macOS target is macOS 14 or later on Apple Silicon.
- Windows target is Windows 10 or 11 on x64.
- The apps remain local-only: no Codex-state dependency, network service, analytics, AI chat, system-wide mouse hook, or new operating-system permission.
- Use Tauri's existing global cursor API and logical-pixel gaze geometry; do not add a platform-specific mouse-hook dependency.
- The installed Codex pets under `/Users/yuki/.codex/pets` are read-only source assets and must remain unchanged.
- Preserve the user's uncommitted `pnpm-workspace.yaml` change and never stage it in this feature's commits.
- Use TDD for every behavioral change: failing test, observed failure, minimal implementation, passing test, then explicit-file commit.
- Standard atlas rows and look directions must match `docs/superpowers/specs/2026-07-16-standalone-v2-companions-design.md` exactly.

---

## File Map

### New files

- `apps/desktop-tauri/src/components/companion/animation.test.ts` — v2 row, duration, and look-cell contract tests.
- `apps/desktop-tauri/src/components/companion/gaze.ts` — pure angle, distance, sector, and hysteresis calculations.
- `apps/desktop-tauri/src/components/companion/gaze.test.ts` — cardinal, diagonal, deadzone, radius, and hysteresis tests.
- `apps/desktop-tauri/src/components/companion/stateMachine.ts` — pure interaction priority, click reaction, and autonomous delay helpers.
- `apps/desktop-tauri/src/components/companion/stateMachine.test.ts` — priority and timed-state helper tests.
- `apps/desktop-tauri/src/components/companion/useGlobalCursorGaze.ts` — non-overlapping Tauri cursor polling and exit-grace state.
- `apps/desktop-tauri/src/components/companion/useGlobalCursorGaze.test.tsx` — polling, coordinate conversion, error fallback, and cleanup tests.

### Modified files

- `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp` — approved Xia Yizhou 1536x2288 v2 asset.
- `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp` — approved Shen Xinghui 1536x2288 v2 asset.
- `apps/desktop-tauri/src/components/companion/animation.ts` — nine standard rows, exact duration arrays, and 16 look-cell mapping.
- `apps/desktop-tauri/src/components/companion/PetSprite.tsx` — render `PetPose` rather than legacy state/frame props.
- `apps/desktop-tauri/src/components/companion/PetSprite.test.tsx` — standard and look-pose rendering assertions.
- `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx` — v2 state orchestration, per-frame timing, gaze, waiting, and autonomous behavior.
- `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx` — direct interaction, gaze, waiting, autonomous, and click-through coverage.
- `packages/core/src/local-companion/replies.ts` — per-profile waiting and autonomous cadence.
- `packages/core/src/local-companion/replies.test.ts` — exact cadence contract tests.
- `apps/desktop-tauri/src-tauri/src/commands/debug.rs` — read-only overlay cursor sample command.
- `apps/desktop-tauri/src-tauri/src/lib.rs` — cursor command registration.
- `apps/desktop-tauri/src/test-setup.ts` — cursor command mock and 0.2.0 fallback version.
- `scripts/check-release-readiness.mjs` — v2 asset dimensions/hashes, new command, row count, and packaging checks.
- `scripts/package-macos-dmg.mjs` — verify and report both variant DMGs rather than build the default product.
- `apps/desktop-tauri/package.json` — version 0.2.0.
- `apps/desktop-tauri/src/config/index.ts` — fallback version 0.2.0.
- `apps/desktop-tauri/src/components/settings/SettingsApp.test.tsx` — expected visible version 0.2.0.
- `apps/desktop-tauri/src-tauri/tauri.conf.json` — bundle version 0.2.0.
- `apps/desktop-tauri/src-tauri/Cargo.toml` — Rust package version 0.2.0.
- `apps/desktop-tauri/src-tauri/Cargo.lock` — mechanically refreshed local package version.
- `package.json` — retain variant build and expose verified dual-variant macOS packaging.

### Release-only outputs

- `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/mac/`
- `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/windows/`
- `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/RELEASE-NOTES-zh-CN.md`
- `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/QA-REPORT.md`
- `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/SHA256SUMS.txt`

---

### Task 1: Install and gate the approved v2 character assets

**Files:**
- Modify: `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp`
- Modify: `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp`
- Modify: `scripts/check-release-readiness.mjs`

**Interfaces:**
- Consumes: approved source hashes and 1536x2288 dimensions from the design spec.
- Produces: byte-identical embedded v2 assets and release-smoke gates named `Xia Yizhou v2 asset` and `Shen Xinghui v2 asset`.

- [ ] **Step 1: Add failing cross-platform asset checks**

Add `createHash` to the Node imports and these helpers/constants to `scripts/check-release-readiness.mjs`:

```js
import { createHash } from 'node:crypto';

const companionAssets = [
  {
    label: 'Xia Yizhou',
    path: 'apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp',
    sha256: '32c0d8e5222b731c6ca1e6ae74e1bdd141dfdb249afd45a276655924c0d44e08',
  },
  {
    label: 'Shen Xinghui',
    path: 'apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp',
    sha256: 'e8f95384a3d3e3569a52bbf142993ff908cab20a15d0d65b41f23b7c5ff1c3b0',
  },
];

function readVp8lDimensions(buffer) {
  if (
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP' ||
    buffer.toString('ascii', 12, 16) !== 'VP8L' ||
    buffer[20] !== 0x2f
  ) {
    throw new Error('Expected a lossless VP8L WebP spritesheet');
  }
  const bits = buffer.readUInt32LE(21);
  return {
    width: (bits & 0x3fff) + 1,
    height: ((bits >>> 14) & 0x3fff) + 1,
  };
}

for (const asset of companionAssets) {
  const buffer = readFileSync(join(root, asset.path));
  const dimensions = readVp8lDimensions(buffer);
  const hash = createHash('sha256').update(buffer).digest('hex');
  check(
    `${asset.label} v2 asset`,
    dimensions.width === 1536 && dimensions.height === 2288 && hash === asset.sha256,
    `${dimensions.width}x${dimensions.height} ${hash}`,
  );
}
```

- [ ] **Step 2: Run the smoke check and verify the legacy assets fail**

Run: `pnpm qa:release-smoke`

Expected: FAIL for both companion v2 asset checks, reporting height `1872` and legacy hashes.

- [ ] **Step 3: Copy the approved binary assets without altering the Codex sources**

Run:

```bash
cp /Users/yuki/.codex/pets/xia-yizhou/spritesheet.webp apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp
cp /Users/yuki/.codex/pets/shen-xinghui-cat/spritesheet.webp apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp
```

- [ ] **Step 4: Run release smoke and hatch-pet v2 validation**

First call `codex_app__load_workspace_dependencies`, set `PYTHON` to its exact bundled Python path, then run:

```bash
pnpm qa:release-smoke
"$PYTHON" /Users/yuki/.codex/skills/hatch-pet/scripts/validate_atlas.py apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp --json-out /tmp/xia-yizhou-standalone-v2-validation.json --require-v2
"$PYTHON" /Users/yuki/.codex/skills/hatch-pet/scripts/validate_atlas.py apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp --json-out /tmp/shen-xinghui-standalone-v2-validation.json --require-v2
```

Expected: release smoke passes both asset checks; both validator outputs contain `"ok": true`.

- [ ] **Step 5: Commit only the asset gate and two assets**

```bash
git add docs/superpowers/specs/2026-07-16-standalone-v2-companions-design.md docs/superpowers/plans/2026-07-16-standalone-v2-companions.md scripts/check-release-readiness.mjs apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp
git commit -m "feat: install standalone v2 companion assets"
```

---

### Task 2: Replace the legacy animation contract with v2 poses

**Files:**
- Create: `apps/desktop-tauri/src/components/companion/animation.test.ts`
- Modify: `apps/desktop-tauri/src/components/companion/animation.ts`
- Modify: `apps/desktop-tauri/src/components/companion/PetSprite.tsx`
- Modify: `apps/desktop-tauri/src/components/companion/PetSprite.test.tsx`
- Modify: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`
- Modify: `scripts/check-release-readiness.mjs`

**Interfaces:**
- Consumes: 8x11 atlas contract from Task 1.
- Produces: `PetAnimationState`, `PetPose`, `getAnimationRow()`, `getAnimationFrameCount()`, `getAnimationFrameDuration()`, `completeAnimationDuration()`, and `getPoseCell()`.

- [ ] **Step 1: Write failing v2 animation and rendering tests**

Create `animation.test.ts` with exact contract assertions:

```ts
import { describe, expect, it } from 'vitest';
import {
  completeAnimationDuration,
  getAnimationFrameCount,
  getAnimationFrameDuration,
  getAnimationRow,
  getPoseCell,
} from './animation';

describe('v2 companion animation contract', () => {
  it('maps all nine standard rows and exact frame counts', () => {
    expect(getAnimationRow('idle')).toMatchObject({ row: 0, frames: 6 });
    expect(getAnimationRow('running-right')).toMatchObject({ row: 1, frames: 8 });
    expect(getAnimationRow('running-left')).toMatchObject({ row: 2, frames: 8 });
    expect(getAnimationRow('waving')).toMatchObject({ row: 3, frames: 4 });
    expect(getAnimationRow('jumping')).toMatchObject({ row: 4, frames: 5 });
    expect(getAnimationRow('failed')).toMatchObject({ row: 5, frames: 8 });
    expect(getAnimationRow('waiting')).toMatchObject({ row: 6, frames: 6 });
    expect(getAnimationRow('running')).toMatchObject({ row: 7, frames: 6 });
    expect(getAnimationRow('review')).toMatchObject({ row: 8, frames: 6 });
  });

  it('uses the approved non-uniform durations', () => {
    expect(Array.from({ length: getAnimationFrameCount('idle') }, (_, frame) =>
      getAnimationFrameDuration('idle', frame),
    )).toEqual([280, 110, 110, 140, 140, 320]);
    expect(getAnimationFrameDuration('jumping', 4)).toBe(280);
    expect(getAnimationFrameDuration('failed', 7)).toBe(240);
    expect(completeAnimationDuration('running')).toBe(820);
    expect(completeAnimationDuration('review')).toBe(1_030);
  });

  it('maps all 16 gaze directions across rows 9 and 10', () => {
    expect(getPoseCell({ kind: 'look', directionIndex: 0 })).toEqual({ row: 9, column: 0 });
    expect(getPoseCell({ kind: 'look', directionIndex: 7 })).toEqual({ row: 9, column: 7 });
    expect(getPoseCell({ kind: 'look', directionIndex: 8 })).toEqual({ row: 10, column: 0 });
    expect(getPoseCell({ kind: 'look', directionIndex: 15 })).toEqual({ row: 10, column: 7 });
  });
});
```

Update `PetSprite.test.tsx` to pass a pose and add a look assertion:

```tsx
render(
  <PetSprite
    pose={{ kind: 'look', directionIndex: 12 }}
    spritesheetUrl="/pets/xia-yizhou/spritesheet.webp"
    scale={1}
  />,
);
expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '12');
expect(screen.getByTestId('local-companion-sprite-frame')).toHaveStyle({
  backgroundPosition: '-768px -2080px',
});
```

- [ ] **Step 2: Run the focused tests and verify missing v2 APIs fail**

Run:

```bash
pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/animation.test.ts src/components/companion/PetSprite.test.tsx
```

Expected: FAIL because `PetPose`, duration helpers, look mapping, and the `pose` prop do not exist.

- [ ] **Step 3: Implement the exact v2 contract**

Replace the row model in `animation.ts` with:

```ts
export type PetAnimationState =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review';

export type PetPose =
  | { kind: 'animation'; state: PetAnimationState; frame: number }
  | { kind: 'look'; directionIndex: number };

export const ATLAS_COLUMNS = 8;
export const CELL_WIDTH = 192;
export const CELL_HEIGHT = 208;

const animationRows: Record<PetAnimationState, { row: number; frames: number; durations: number[] }> = {
  idle: { row: 0, frames: 6, durations: [280, 110, 110, 140, 140, 320] },
  'running-right': { row: 1, frames: 8, durations: [120, 120, 120, 120, 120, 120, 120, 220] },
  'running-left': { row: 2, frames: 8, durations: [120, 120, 120, 120, 120, 120, 120, 220] },
  waving: { row: 3, frames: 4, durations: [140, 140, 140, 280] },
  jumping: { row: 4, frames: 5, durations: [140, 140, 140, 140, 280] },
  failed: { row: 5, frames: 8, durations: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, frames: 6, durations: [150, 150, 150, 150, 150, 260] },
  running: { row: 7, frames: 6, durations: [120, 120, 120, 120, 120, 220] },
  review: { row: 8, frames: 6, durations: [150, 150, 150, 150, 150, 280] },
};

export function getAnimationRow(state: PetAnimationState) {
  return animationRows[state];
}

export function getAnimationFrameCount(state: PetAnimationState): number {
  return animationRows[state].frames;
}

export function getAnimationFrameDuration(state: PetAnimationState, frame: number): number {
  const animation = animationRows[state];
  return animation.durations[((frame % animation.frames) + animation.frames) % animation.frames] ?? 120;
}

export function completeAnimationDuration(state: PetAnimationState): number {
  return animationRows[state].durations.reduce((total, duration) => total + duration, 0);
}

export function getPoseCell(pose: PetPose): { row: number; column: number } {
  if (pose.kind === 'look') {
    const directionIndex = Math.max(0, Math.min(15, Math.trunc(pose.directionIndex)));
    return directionIndex < 8
      ? { row: 9, column: directionIndex }
      : { row: 10, column: directionIndex - 8 };
  }
  const animation = animationRows[pose.state];
  return {
    row: animation.row,
    column: ((pose.frame % animation.frames) + animation.frames) % animation.frames,
  };
}
```

Replace `PetSprite` with the same pixel-stable layout using this pose-based cell selection:

```tsx
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
  const pixelStableScale = Math.max(1 / 16, Math.round(scale * 16) / 16);
  return (
    <div
      data-testid="local-companion-pet"
      data-animation-state={pose.kind === 'animation' ? pose.state : undefined}
      data-look-direction={pose.kind === 'look' ? pose.directionIndex : undefined}
      style={{
        width: CELL_WIDTH * pixelStableScale,
        height: CELL_HEIGHT * pixelStableScale,
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
```

Keep the repository type-safe during this task by changing the existing overlay call immediately:

```tsx
<PetSprite
  pose={{ kind: 'animation', state: animationState, frame }}
  spritesheetUrl={profile.spritesheetUrl}
  scale={scale}
/>
```

Replace the legacy release-smoke animation assertion with:

```js
check(
  'v2 companion animation rows configured',
  /'running-right':\s*\{\s*row:\s*1,\s*frames:\s*8/.test(companionAnimationSource) &&
    /'running-left':\s*\{\s*row:\s*2,\s*frames:\s*8/.test(companionAnimationSource) &&
    /jumping:\s*\{\s*row:\s*4,\s*frames:\s*5/.test(companionAnimationSource) &&
    /failed:\s*\{\s*row:\s*5,\s*frames:\s*8/.test(companionAnimationSource) &&
    /waiting:\s*\{\s*row:\s*6,\s*frames:\s*6/.test(companionAnimationSource) &&
    /running:\s*\{\s*row:\s*7,\s*frames:\s*6/.test(companionAnimationSource) &&
    /review:\s*\{\s*row:\s*8,\s*frames:\s*6/.test(companionAnimationSource),
  'animation.ts',
);
```

- [ ] **Step 4: Run focused tests and release smoke**

Run:

```bash
pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/animation.test.ts src/components/companion/PetSprite.test.tsx
pnpm --filter @codexpet/desktop-tauri typecheck
pnpm qa:release-smoke
```

Expected: focused tests, typecheck, and release smoke PASS.

- [ ] **Step 5: Commit the v2 renderer contract**

```bash
git add apps/desktop-tauri/src/components/companion/animation.ts apps/desktop-tauri/src/components/companion/animation.test.ts apps/desktop-tauri/src/components/companion/PetSprite.tsx apps/desktop-tauri/src/components/companion/PetSprite.test.tsx apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx scripts/check-release-readiness.mjs
git commit -m "feat: render standalone v2 companion poses"
```

---

### Task 3: Implement pure 16-direction gaze geometry

**Files:**
- Create: `apps/desktop-tauri/src/components/companion/gaze.ts`
- Create: `apps/desktop-tauri/src/components/companion/gaze.test.ts`

**Interfaces:**
- Consumes: screen-relative logical `dx` and `dy`, plus the previous direction index.
- Produces: `resolveGazeTarget(input): GazeTarget`, where `GazeTarget` is `deadzone`, `outside`, or a direction index from 0 through 15.

- [ ] **Step 1: Write failing geometry tests**

Create tests for the four cardinals, diagonals, deadzone, attention radius, and hysteresis:

```ts
import { describe, expect, it } from 'vitest';
import { resolveGazeTarget } from './gaze';

describe('resolveGazeTarget', () => {
  it.each([
    [0, -100, 0],
    [100, -100, 2],
    [100, 0, 4],
    [100, 100, 6],
    [0, 100, 8],
    [-100, 100, 10],
    [-100, 0, 12],
    [-100, -100, 14],
  ])('maps dx=%s dy=%s to direction %s', (dx, dy, directionIndex) => {
    expect(resolveGazeTarget({ dx, dy, previousDirection: null })).toEqual({
      kind: 'direction',
      directionIndex,
    });
  });

  it('uses idle inside the 28px neutral deadzone', () => {
    expect(resolveGazeTarget({ dx: 12, dy: 8, previousDirection: null })).toEqual({ kind: 'deadzone' });
  });

  it('uses idle outside the 640px attention radius', () => {
    expect(resolveGazeTarget({ dx: 641, dy: 0, previousDirection: 4 })).toEqual({ kind: 'outside' });
  });

  it('retains the prior sector through four degrees of hysteresis', () => {
    const degrees = 11.25 + 3.9;
    const radians = (degrees * Math.PI) / 180;
    expect(resolveGazeTarget({
      dx: Math.sin(radians) * 100,
      dy: -Math.cos(radians) * 100,
      previousDirection: 0,
    })).toEqual({ kind: 'direction', directionIndex: 0 });
  });
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/gaze.test.ts`

Expected: FAIL because `./gaze` does not exist.

- [ ] **Step 3: Implement the pure gaze resolver**

Create `gaze.ts`:

```ts
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
  const distance = Math.hypot(dx, dy);
  if (distance <= GAZE_DEADZONE_PX) return { kind: 'deadzone' };
  if (distance > GAZE_ATTENTION_RADIUS_PX) return { kind: 'outside' };

  const degrees = normalizeDegrees((Math.atan2(dx, -dy) * 180) / Math.PI);
  if (previousDirection !== null) {
    const previousCenter = normalizeDegrees(previousDirection * LOOK_SECTOR_DEGREES);
    const delta = Math.abs(shortestSignedDelta(degrees, previousCenter));
    if (delta <= LOOK_SECTOR_DEGREES / 2 + GAZE_HYSTERESIS_DEGREES) {
      return { kind: 'direction', directionIndex: previousDirection };
    }
  }

  return {
    kind: 'direction',
    directionIndex: Math.round(degrees / LOOK_SECTOR_DEGREES) % LOOK_DIRECTION_COUNT,
  };
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function shortestSignedDelta(value: number, origin: number): number {
  return ((value - origin + 540) % 360) - 180;
}
```

- [ ] **Step 4: Run the geometry tests**

Run: `pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/gaze.test.ts`

Expected: PASS for all cardinal, diagonal, radius, and hysteresis cases.

- [ ] **Step 5: Commit the gaze geometry**

```bash
git add apps/desktop-tauri/src/components/companion/gaze.ts apps/desktop-tauri/src/components/companion/gaze.test.ts
git commit -m "feat: add 16-direction companion gaze geometry"
```

---

### Task 4: Add the cross-platform native cursor sample command

**Files:**
- Modify: `apps/desktop-tauri/src-tauri/src/commands/debug.rs`
- Modify: `apps/desktop-tauri/src-tauri/src/lib.rs`
- Modify: `apps/desktop-tauri/src/test-setup.ts`

**Interfaces:**
- Consumes: Tauri `AppHandle::cursor_position()`, overlay `outer_position()`, and overlay `scale_factor()`.
- Produces: invoke command `get_overlay_cursor_sample` returning `{ cursor_x, cursor_y, window_x, window_y, scale_factor }` in physical coordinates plus scale.

- [ ] **Step 1: Write the failing Rust serialization test**

Add inside `commands::debug::tests`:

```rust
#[test]
fn overlay_cursor_sample_serializes_for_frontend() {
    let sample = OverlayCursorSample {
        cursor_x: 640.5,
        cursor_y: 320.25,
        window_x: 100,
        window_y: 200,
        scale_factor: 2.0,
    };
    let value = serde_json::to_value(sample).expect("cursor sample should serialize");
    assert_eq!(value["cursor_x"], 640.5);
    assert_eq!(value["window_y"], 200);
    assert_eq!(value["scale_factor"], 2.0);
}
```

- [ ] **Step 2: Run the focused Rust test and verify it fails**

Run: `cargo test overlay_cursor_sample_serializes_for_frontend` from `apps/desktop-tauri/src-tauri`.

Expected: FAIL because `OverlayCursorSample` is undefined.

- [ ] **Step 3: Implement and register the read-only command**

Add to `commands/debug.rs`:

```rust
#[derive(Debug, Serialize)]
pub struct OverlayCursorSample {
    cursor_x: f64,
    cursor_y: f64,
    window_x: i32,
    window_y: i32,
    scale_factor: f64,
}

#[tauri::command]
pub fn get_overlay_cursor_sample(app: tauri::AppHandle) -> Result<OverlayCursorSample, String> {
    let cursor = app
        .cursor_position()
        .map_err(|error| format!("Cursor position unavailable: {error}"))?;
    let window = app
        .get_webview_window("overlay")
        .ok_or_else(|| "Overlay window not found".to_string())?;
    let position = window
        .outer_position()
        .map_err(|error| format!("Overlay position unavailable: {error}"))?;
    let scale_factor = window
        .scale_factor()
        .map_err(|error| format!("Overlay scale factor unavailable: {error}"))?;
    Ok(OverlayCursorSample {
        cursor_x: cursor.x,
        cursor_y: cursor.y,
        window_x: position.x,
        window_y: position.y,
        scale_factor,
    })
}
```

Register `commands::debug::get_overlay_cursor_sample` in `tauri::generate_handler![]`. Add this test mock branch in `src/test-setup.ts`:

```ts
case 'get_overlay_cursor_sample':
  return Promise.resolve({
    cursor_x: 900,
    cursor_y: 300,
    window_x: 100,
    window_y: 100,
    scale_factor: 1,
  });
```

- [ ] **Step 4: Run Rust tests and frontend smoke tests**

Run:

```bash
cargo fmt --all --check
cargo test overlay_cursor_sample_serializes_for_frontend
pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/LocalCompanionOverlay.test.tsx
```

Expected: Rust and frontend focused tests PASS; there is no new permission prompt or dependency.

- [ ] **Step 5: Commit the native cursor bridge**

```bash
git add apps/desktop-tauri/src-tauri/src/commands/debug.rs apps/desktop-tauri/src-tauri/src/lib.rs apps/desktop-tauri/src/test-setup.ts
git commit -m "feat: expose overlay cursor samples"
```

---

### Task 5: Add character-specific timing profiles

**Files:**
- Modify: `packages/core/src/local-companion/replies.ts`
- Modify: `packages/core/src/local-companion/replies.test.ts`

**Interfaces:**
- Consumes: existing `CompanionProfile` selection.
- Produces: `CompanionCadence` and `profile.cadence` with exact `waitingDwellMs` and `autonomousIdleMs` fields.

- [ ] **Step 1: Write failing cadence assertions**

Add to `replies.test.ts`:

```ts
it('keeps distinct approved interaction cadence per profile', () => {
  expect(getCompanionProfile('xia-yizhou').cadence).toEqual({
    waitingDwellMs: 2_400,
    autonomousIdleMs: 90_000,
  });
  expect(getCompanionProfile('shen-xinghui').cadence).toEqual({
    waitingDwellMs: 3_000,
    autonomousIdleMs: 105_000,
  });
});
```

- [ ] **Step 2: Run the core test and verify it fails**

Run: `pnpm --filter @codexpet/core test -- src/local-companion/replies.test.ts`

Expected: FAIL because `cadence` is absent.

- [ ] **Step 3: Add exact cadence metadata**

Add:

```ts
export interface CompanionCadence {
  waitingDwellMs: number;
  autonomousIdleMs: number;
}

export interface CompanionProfile {
  id: CompanionProfileId;
  displayName: string;
  interactionLabel: string;
  spritesheetUrl: string;
  cadence: CompanionCadence;
  persona?: CompanionPersona;
  dialogues?: CompanionDialogueLine[];
  replies: CompanionReplySet;
}
```

Set Xia's cadence to `{ waitingDwellMs: 2_400, autonomousIdleMs: 90_000 }` and Shen's to `{ waitingDwellMs: 3_000, autonomousIdleMs: 105_000 }` inside `COMPANION_PROFILES`.

- [ ] **Step 4: Run core tests**

Run: `pnpm --filter @codexpet/core test -- src/local-companion/replies.test.ts`

Expected: PASS with existing dialogue selection unchanged.

- [ ] **Step 5: Commit the profile cadence**

```bash
git add packages/core/src/local-companion/replies.ts packages/core/src/local-companion/replies.test.ts
git commit -m "feat: add companion interaction cadence"
```

---

### Task 6: Implement pure interaction priority and autonomous helpers

**Files:**
- Create: `apps/desktop-tauri/src/components/companion/stateMachine.ts`
- Create: `apps/desktop-tauri/src/components/companion/stateMachine.test.ts`

**Interfaces:**
- Consumes: drag state, reaction state, special state, and optional gaze direction.
- Produces: `CompanionPoseMode`, `resolveCompanionPoseMode()`, `clickReactionForCount()`, and `nextAutonomousDelayMs()`.

- [ ] **Step 1: Write failing state-priority tests**

Create `stateMachine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  clickReactionForCount,
  nextAutonomousDelayMs,
  resolveCompanionPoseMode,
} from './stateMachine';

describe('companion state priority', () => {
  it('prioritizes drag over reaction, special, and gaze', () => {
    expect(resolveCompanionPoseMode({
      drag: 'left',
      reaction: 'failed',
      special: 'waiting',
      lookDirection: 4,
    })).toEqual({ kind: 'animation', state: 'running-left' });
  });

  it('falls through reaction, special, gaze, then idle', () => {
    expect(resolveCompanionPoseMode({ drag: 'idle', reaction: 'waving', special: null, lookDirection: 4 }))
      .toEqual({ kind: 'animation', state: 'waving' });
    expect(resolveCompanionPoseMode({ drag: 'idle', reaction: null, special: 'review', lookDirection: 4 }))
      .toEqual({ kind: 'animation', state: 'review' });
    expect(resolveCompanionPoseMode({ drag: 'idle', reaction: null, special: null, lookDirection: 4 }))
      .toEqual({ kind: 'look', directionIndex: 4 });
    expect(resolveCompanionPoseMode({ drag: 'idle', reaction: null, special: null, lookDirection: null }))
      .toEqual({ kind: 'animation', state: 'idle' });
  });

  it('maps click counts to the approved reactions', () => {
    expect(clickReactionForCount(1)).toEqual({ state: 'waving', durationMs: 900 });
    expect(clickReactionForCount(2)).toEqual({ state: 'jumping', durationMs: 1_100 });
    expect(clickReactionForCount(3)).toEqual({ state: 'jumping', durationMs: 1_100 });
    expect(clickReactionForCount(4)).toEqual({ state: 'failed', durationMs: 1_400 });
  });

  it('maps injected random values to 120-180 second delays', () => {
    expect(nextAutonomousDelayMs(0)).toBe(120_000);
    expect(nextAutonomousDelayMs(0.5)).toBe(150_000);
    expect(nextAutonomousDelayMs(1)).toBe(180_000);
  });
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/stateMachine.test.ts`

Expected: FAIL because `./stateMachine` does not exist.

- [ ] **Step 3: Implement the pure helpers**

Create `stateMachine.ts`:

```ts
import type { PetAnimationState } from './animation';

export type DragVisualState = 'idle' | 'held' | 'left' | 'right';
export type CompanionPoseMode =
  | { kind: 'animation'; state: PetAnimationState }
  | { kind: 'look'; directionIndex: number };

export function clickReactionForCount(count: number): {
  state: PetAnimationState;
  durationMs: number;
} {
  if (count >= 4) return { state: 'failed', durationMs: 1_400 };
  if (count >= 2) return { state: 'jumping', durationMs: 1_100 };
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
  const clamped = Math.max(0, Math.min(1, randomValue));
  return 120_000 + Math.round(clamped * 60_000);
}
```

- [ ] **Step 4: Run the state-machine tests**

Run: `pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/stateMachine.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the state helpers**

```bash
git add apps/desktop-tauri/src/components/companion/stateMachine.ts apps/desktop-tauri/src/components/companion/stateMachine.test.ts
git commit -m "feat: define companion interaction priorities"
```

---

### Task 7: Poll global cursor state without overlap or visible errors

**Files:**
- Create: `apps/desktop-tauri/src/components/companion/useGlobalCursorGaze.ts`
- Create: `apps/desktop-tauri/src/components/companion/useGlobalCursorGaze.test.tsx`

**Interfaces:**
- Consumes: `get_overlay_cursor_sample`, an anchor `RefObject<HTMLElement | null>`, and `resolveGazeTarget()`.
- Produces: `CursorGazeSnapshot` containing `directionIndex`, `inAttentionRange`, and `stationaryForMs`.

- [ ] **Step 1: Write failing hook tests**

Create `useGlobalCursorGaze.test.tsx` with a fixed 100x100 anchor at logical `(100, 100)`:

```tsx
import { act, render, screen } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutEffect, useRef } from 'react';
import { useGlobalCursorGaze } from './useGlobalCursorGaze';

const rightSample = {
  cursor_x: 250,
  cursor_y: 136,
  window_x: 0,
  window_y: 0,
  scale_factor: 1,
};
const outsideSample = { ...rightSample, cursor_x: 1_000, cursor_y: 1_000 };

function Harness() {
  const anchorRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    anchorRef.current.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      left: 100,
      top: 100,
      right: 200,
      bottom: 200,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });
  }, []);
  const gaze = useGlobalCursorGaze(anchorRef);
  return (
    <div>
      <div ref={anchorRef} />
      <span data-testid="direction">{gaze.directionIndex ?? 'none'}</span>
      <span data-testid="in-range">{String(gaze.inAttentionRange)}</span>
      <span data-testid="stationary">{gaze.stationaryForMs}</span>
    </div>
  );
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useGlobalCursorGaze', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    vi.mocked(invoke).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('converts a global cursor sample into a rightward look', async () => {
    vi.mocked(invoke).mockResolvedValue(rightSample);
    render(<Harness />);
    await flushAsyncWork();
    expect(screen.getByTestId('direction')).toHaveTextContent('4');
    expect(screen.getByTestId('in-range')).toHaveTextContent('true');
  });

  it('keeps the prior direction for 600ms after leaving range', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(rightSample).mockResolvedValue(outsideSample);
    render(<Harness />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(560));
    expect(screen.getByTestId('direction')).toHaveTextContent('4');
    await act(async () => vi.advanceTimersByTimeAsync(160));
    expect(screen.getByTestId('direction')).toHaveTextContent('none');
  });

  it('falls back silently when the native sample fails', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('unavailable'));
    render(<Harness />);
    await flushAsyncWork();
    expect(screen.getByTestId('direction')).toHaveTextContent('none');
    expect(screen.getByTestId('in-range')).toHaveTextContent('false');
  });

  it('never overlaps native requests', async () => {
    vi.mocked(invoke).mockImplementation(() => new Promise(() => undefined));
    render(<Harness />);
    await flushAsyncWork();
    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('stops polling after unmount', async () => {
    vi.mocked(invoke).mockResolvedValue(rightSample);
    const view = render(<Harness />);
    await flushAsyncWork();
    const callsBeforeUnmount = vi.mocked(invoke).mock.calls.length;
    view.unmount();
    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(invoke).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it('does not poll while the document is hidden', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    vi.mocked(invoke).mockResolvedValue(rightSample);
    render(<Harness />);
    await flushAsyncWork();
    expect(invoke).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the hook test and verify the hook is missing**

Run: `pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/useGlobalCursorGaze.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement recursive non-overlapping polling**

Use these public types/constants and scheduling structure:

```ts
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { resolveGazeTarget } from './gaze';

export const CURSOR_POLL_MS = 80;
export const GAZE_EXIT_GRACE_MS = 600;
export const STATIONARY_DELTA_PX = 12;

export interface OverlayCursorSample {
  cursor_x: number;
  cursor_y: number;
  window_x: number;
  window_y: number;
  scale_factor: number;
}

export interface CursorGazeSnapshot {
  directionIndex: number | null;
  inAttentionRange: boolean;
  stationaryForMs: number;
}

const EMPTY_SNAPSHOT: CursorGazeSnapshot = {
  directionIndex: null,
  inAttentionRange: false,
  stationaryForMs: 0,
};

export function useGlobalCursorGaze(
  anchorRef: RefObject<HTMLElement | null>,
  enabled = true,
): CursorGazeSnapshot {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const directionRef = useRef<number | null>(null);
  const outsideSinceRef = useRef<number | null>(null);
  const stationarySinceRef = useRef<number | null>(null);
  const lastCursorRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!enabled || !pageVisible) {
      setSnapshot(EMPTY_SNAPSHOT);
      return undefined;
    }
    let cancelled = false;
    let timeout: number | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const sample = await invoke<OverlayCursorSample>('get_overlay_cursor_sample');
        const anchor = anchorRef.current?.getBoundingClientRect();
        if (!anchor || sample.scale_factor <= 0) throw new Error('Gaze anchor unavailable');
        const now = Date.now();
        const cursor = {
          x: (sample.cursor_x - sample.window_x) / sample.scale_factor,
          y: (sample.cursor_y - sample.window_y) / sample.scale_factor,
        };
        const target = resolveGazeTarget({
          dx: cursor.x - (anchor.left + anchor.width / 2),
          dy: cursor.y - (anchor.top + anchor.height * 0.36),
          previousDirection: directionRef.current,
        });
        const last = lastCursorRef.current;
        const moved = last ? Math.hypot(cursor.x - last.x, cursor.y - last.y) : Infinity;
        stationarySinceRef.current = moved <= STATIONARY_DELTA_PX
          ? stationarySinceRef.current ?? now
          : now;
        lastCursorRef.current = cursor;

        if (target.kind === 'direction') {
          directionRef.current = target.directionIndex;
          outsideSinceRef.current = null;
          if (!cancelled) setSnapshot({
            directionIndex: target.directionIndex,
            inAttentionRange: true,
            stationaryForMs: Math.max(0, now - (stationarySinceRef.current ?? now)),
          });
        } else if (target.kind === 'deadzone') {
          directionRef.current = null;
          outsideSinceRef.current = null;
          if (!cancelled) setSnapshot({
            directionIndex: null,
            inAttentionRange: true,
            stationaryForMs: Math.max(0, now - (stationarySinceRef.current ?? now)),
          });
        } else {
          outsideSinceRef.current ??= now;
          const keepDirection = now - outsideSinceRef.current < GAZE_EXIT_GRACE_MS;
          if (!keepDirection) directionRef.current = null;
          if (!cancelled) setSnapshot({
            directionIndex: keepDirection ? directionRef.current : null,
            inAttentionRange: false,
            stationaryForMs: 0,
          });
        }
      } catch {
        directionRef.current = null;
        if (!cancelled) setSnapshot(EMPTY_SNAPSHOT);
      } finally {
        if (!cancelled) timeout = window.setTimeout(poll, CURSOR_POLL_MS);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [anchorRef, enabled, pageVisible]);

  return snapshot;
}
```

- [ ] **Step 4: Run the hook and geometry tests**

Run:

```bash
pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/gaze.test.ts src/components/companion/useGlobalCursorGaze.test.tsx
```

Expected: PASS with no overlapping native requests and no error text rendered.

- [ ] **Step 5: Commit the gaze polling hook**

```bash
git add apps/desktop-tauri/src/components/companion/useGlobalCursorGaze.ts apps/desktop-tauri/src/components/companion/useGlobalCursorGaze.test.tsx
git commit -m "feat: follow nearby cursor without input hooks"
```

---

### Task 8: Integrate all v2 states into the standalone overlay

**Files:**
- Modify: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`
- Modify: `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx`

**Interfaces:**
- Consumes: `profile.cadence`, `useGlobalCursorGaze()`, `resolveCompanionPoseMode()`, `clickReactionForCount()`, v2 duration helpers, and `PetSprite pose`.
- Produces: all nine standard rows and all sixteen look directions through real interaction or autonomous behavior.

- [ ] **Step 1: Expand the failing component tests**

Keep existing assertions and add tests with fake timers for:

```tsx
fireEvent.click(button);
expect(pet).toHaveAttribute('data-animation-state', 'waving');

fireEvent.click(button);
act(() => vi.advanceTimersByTime(100));
fireEvent.click(button);
expect(pet).toHaveAttribute('data-animation-state', 'jumping');

fireEvent.click(button);
fireEvent.click(button);
fireEvent.click(button);
fireEvent.click(button);
expect(pet).toHaveAttribute('data-animation-state', 'failed');
```

Add these exact behavioral cases:

- pointer cancel after pointer down selects `failed` for 1.4 seconds;
- a mocked right-side cursor sample selects `data-look-direction="4"` after one poll;
- a stationary in-range cursor triggers `waiting` after 2.4 seconds for Xia and only once in that attention session;
- 90 seconds of out-of-range Xia inactivity selects `running`, then `review`, then idle;
- a click cancels an autonomous sequence;
- click-through still prevents click dialogue but does not prevent `data-look-direction`;
- idle frame 0 waits 280 ms before advancing and frame 5 waits 320 ms before wrapping;
- unmount clears reaction, autonomous, reply, animation, and gaze timers.

Use the existing `pointerEvent()` helper and add concrete tests in this form:

```tsx
it('shows failed after a cancelled pickup', () => {
  vi.useFakeTimers();
  render(<LocalCompanionOverlay clickThrough={false} />);
  const button = screen.getByRole('button', { name: '和夏以昼互动' });
  fireEvent(button, pointerEvent('pointerdown', 100, 100));
  fireEvent(button, pointerEvent('pointercancel', 100, 100));
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-animation-state', 'failed');
  act(() => vi.advanceTimersByTime(1_400));
  expect(screen.getByTestId('local-companion-pet')).not.toHaveAttribute('data-animation-state', 'failed');
});

it('looks right at a nearby global cursor even in click-through mode', async () => {
  vi.useFakeTimers();
  vi.mocked(invoke).mockImplementation((command) => {
    if (command === 'get_overlay_cursor_sample') {
      return Promise.resolve({ cursor_x: 300, cursor_y: 0, window_x: 0, window_y: 0, scale_factor: 1 });
    }
    return Promise.resolve(undefined);
  });
  render(<LocalCompanionOverlay clickThrough />);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-look-direction', '4');
  fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));
  expect(screen.queryByTestId('local-companion-bubble')).not.toBeInTheDocument();
});

it('shows waiting once for a stationary Xia attention session', async () => {
  vi.useFakeTimers();
  vi.mocked(invoke).mockResolvedValue({
    cursor_x: 300,
    cursor_y: 0,
    window_x: 0,
    window_y: 0,
    scale_factor: 1,
  });
  render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
  await act(async () => vi.advanceTimersByTimeAsync(2_560));
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-animation-state', 'waiting');
  await act(async () => vi.advanceTimersByTimeAsync(2_000));
  expect(screen.getByTestId('local-companion-pet')).not.toHaveAttribute('data-animation-state', 'waiting');
  await act(async () => vi.advanceTimersByTimeAsync(2_560));
  expect(screen.getByTestId('local-companion-pet')).not.toHaveAttribute('data-animation-state', 'waiting');
});

it('runs, reviews, and returns idle after Xia inactivity', async () => {
  vi.useFakeTimers();
  vi.mocked(invoke).mockResolvedValue({
    cursor_x: 2_000,
    cursor_y: 2_000,
    window_x: 0,
    window_y: 0,
    scale_factor: 1,
  });
  render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
  await act(async () => vi.advanceTimersByTimeAsync(90_000));
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-animation-state', 'running');
  await act(async () => vi.advanceTimersByTimeAsync(820));
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-animation-state', 'review');
  await act(async () => vi.advanceTimersByTimeAsync(1_030));
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-animation-state', 'idle');
});
```

Import `invoke` from `@tauri-apps/api/core`. Add the autonomous cancellation assertion exactly as follows; retain the existing scale/bubble/drag regression cases unchanged.

```tsx
it('cancels an autonomous sequence when clicked', async () => {
  vi.useFakeTimers();
  vi.mocked(invoke).mockResolvedValue({
    cursor_x: 2_000,
    cursor_y: 2_000,
    window_x: 0,
    window_y: 0,
    scale_factor: 1,
  });
  render(<LocalCompanionOverlay clickThrough={false} profileId="xia-yizhou" />);
  await act(async () => vi.advanceTimersByTimeAsync(90_000));
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-animation-state', 'running');
  fireEvent.click(screen.getByRole('button', { name: '和夏以昼互动' }));
  expect(screen.getByTestId('local-companion-pet')).toHaveAttribute('data-animation-state', 'waving');
});

it('uses the v2 idle frame durations instead of a fixed interval', () => {
  vi.useFakeTimers();
  render(<LocalCompanionOverlay clickThrough={false} />);
  const sprite = screen.getByTestId('local-companion-sprite-frame');
  expect(sprite).toHaveStyle({ backgroundPosition: '0px 0px' });
  act(() => vi.advanceTimersByTime(279));
  expect(sprite).toHaveStyle({ backgroundPosition: '0px 0px' });
  act(() => vi.advanceTimersByTime(1));
  expect(sprite).toHaveStyle({ backgroundPosition: '-192px 0px' });
  act(() => vi.advanceTimersByTime(500));
  expect(sprite).toHaveStyle({ backgroundPosition: '-960px 0px' });
  act(() => vi.advanceTimersByTime(319));
  expect(sprite).toHaveStyle({ backgroundPosition: '-960px 0px' });
  act(() => vi.advanceTimersByTime(1));
  expect(sprite).toHaveStyle({ backgroundPosition: '0px 0px' });
});
```

- [ ] **Step 2: Run the focused component test and observe failures**

Run: `pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/LocalCompanionOverlay.test.tsx`

Expected: FAIL because the overlay still exposes only the legacy five states, fixed 180 ms timing, and no gaze/waiting/autonomous orchestration.

- [ ] **Step 3: Replace the fixed interval with per-frame timeouts**

Use this pattern inside `LocalCompanionOverlay`:

```ts
const petButtonRef = useRef<HTMLButtonElement>(null);
const [reactionState, setReactionState] = useState<PetAnimationState | null>(null);
const [specialState, setSpecialState] = useState<PetAnimationState | null>(null);
const gaze = useGlobalCursorGaze(petButtonRef, true);

const mode = resolveCompanionPoseMode({
  drag: dragVisual,
  reaction: reactionState,
  special: specialState,
  lookDirection: gaze.directionIndex,
});
const animatedState = mode.kind === 'animation' ? mode.state : null;

useEffect(() => {
  setFrame(0);
}, [animatedState]);

useEffect(() => {
  if (!animatedState) return undefined;
  const timer = window.setTimeout(() => {
    setFrame((current) => (current + 1) % getAnimationFrameCount(animatedState));
  }, getAnimationFrameDuration(animatedState, frame));
  return () => window.clearTimeout(timer);
}, [animatedState, frame]);

const pose: PetPose = mode.kind === 'look'
  ? mode
  : { kind: 'animation', state: mode.state, frame };
```

Pass `pose={pose}` to `PetSprite` and keep existing scale/layout behavior unchanged.

- [ ] **Step 4: Implement direct reactions with one cancellable timer**

Replace the legacy animation timeout with `reactionState`, `reactionTimerRef`, and:

```ts
const reactionTimerRef = useRef<number | null>(null);

const startReaction = (state: PetAnimationState, durationMs: number) => {
  if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
  setReactionState(state);
  reactionTimerRef.current = window.setTimeout(() => {
    reactionTimerRef.current = null;
    setReactionState(null);
  }, durationMs);
};
```

Use `clickReactionForCount(count)` on click. Use `failed` for 1.4 seconds on `pointercancel`, but retain normal pointer-up drag release. Continue suppressing the synthetic click after a real drag.

The end of `handleClick()` becomes:

```ts
const category = categoryForInteraction({ now: new Date(nowMs), clickCount: count });
setReply(selectCompanionReply(category, nowMs, profile.id).text);
markActivity();
const reaction = clickReactionForCount(count);
startReaction(reaction.state, reaction.durationMs);
```

Make `setDragVisualState(next)` update only `dragVisual`; pose selection now belongs exclusively to `resolveCompanionPoseMode()`. Split pointer completion so cancellation has an explicit reaction:

```ts
const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
  handlePointerEnd(event);
  startReaction('failed', 1_400);
};
```

Wire `onPointerUp={handlePointerEnd}` and `onPointerCancel={handlePointerCancel}`.

- [ ] **Step 5: Add waiting and autonomous sequences**

Attach `petButtonRef` to the button and call `useGlobalCursorGaze(petButtonRef, true)`. Add these refs and waiting effect so one attention session produces at most one waiting loop:

```ts
const waitingUsedRef = useRef(false);
const outsideSinceRef = useRef<number | null>(null);
const specialTimerRef = useRef<number | null>(null);

useEffect(() => {
  const now = Date.now();
  if (!gaze.inAttentionRange) {
    outsideSinceRef.current ??= now;
    if (now - outsideSinceRef.current >= 2_000) waitingUsedRef.current = false;
    return;
  }
  outsideSinceRef.current = null;
  if (
    waitingUsedRef.current ||
    gaze.stationaryForMs < profile.cadence.waitingDwellMs ||
    dragVisual !== 'idle' ||
    reactionState !== null ||
    specialState !== null
  ) return;
  waitingUsedRef.current = true;
  setSpecialState('waiting');
  specialTimerRef.current = window.setTimeout(() => {
    specialTimerRef.current = null;
    setSpecialState(null);
  }, completeAnimationDuration('waiting'));
}, [
  dragVisual,
  gaze.inAttentionRange,
  gaze.stationaryForMs,
  profile.cadence.waitingDwellMs,
  reactionState,
  specialState,
]);
```

For autonomous behavior, add `activityEpoch` and `autonomousDelayMs`. `markActivity()` cancels current special motion and bumps the epoch; call it on click and drag start. The `gaze.inAttentionRange` dependency cancels autonomous behavior on cursor re-entry:

```ts
const [activityEpoch, setActivityEpoch] = useState(0);
const [autonomousDelayMs, setAutonomousDelayMs] = useState(profile.cadence.autonomousIdleMs);
const autonomousTimerRef = useRef<number | null>(null);

const markActivity = () => {
  if (specialTimerRef.current !== null) window.clearTimeout(specialTimerRef.current);
  specialTimerRef.current = null;
  setSpecialState(null);
  setAutonomousDelayMs(profile.cadence.autonomousIdleMs);
  setActivityEpoch((current) => current + 1);
};

useEffect(() => {
  if (gaze.inAttentionRange || dragVisual !== 'idle' || reactionState !== null) {
    if (autonomousTimerRef.current !== null) window.clearTimeout(autonomousTimerRef.current);
    autonomousTimerRef.current = null;
    if (specialTimerRef.current !== null) window.clearTimeout(specialTimerRef.current);
    specialTimerRef.current = null;
    setSpecialState(null);
    return undefined;
  }
  autonomousTimerRef.current = window.setTimeout(() => {
    autonomousTimerRef.current = null;
    setSpecialState('running');
    specialTimerRef.current = window.setTimeout(() => {
      setSpecialState('review');
      specialTimerRef.current = window.setTimeout(() => {
        specialTimerRef.current = null;
        setSpecialState(null);
        setAutonomousDelayMs(nextAutonomousDelayMs(Math.random()));
        setActivityEpoch((current) => current + 1);
      }, completeAnimationDuration('review'));
    }, completeAnimationDuration('running'));
  }, autonomousDelayMs);
  return () => {
    if (autonomousTimerRef.current !== null) window.clearTimeout(autonomousTimerRef.current);
    autonomousTimerRef.current = null;
  };
}, [activityEpoch, autonomousDelayMs, dragVisual, gaze.inAttentionRange, reactionState]);
```

Reset `autonomousDelayMs` when `profile.id` changes. Use one unmount cleanup effect to clear `reactionTimerRef`, `specialTimerRef`, and `autonomousTimerRef`.

`completeAnimationDuration(state)` already comes from Task 2. First autonomous delay uses `profile.cadence.autonomousIdleMs`; later delays use `nextAutonomousDelayMs()`. The direct interaction handlers call `markActivity()` before starting their drag or click reactions.

- [ ] **Step 6: Run focused tests until all current behavior and v2 behavior pass**

Run:

```bash
pnpm --filter @codexpet/desktop-tauri test -- src/components/companion/animation.test.ts src/components/companion/gaze.test.ts src/components/companion/stateMachine.test.ts src/components/companion/useGlobalCursorGaze.test.tsx src/components/companion/PetSprite.test.tsx src/components/companion/LocalCompanionOverlay.test.tsx
```

Expected: PASS, including all pre-existing layout, scaling, click-through, dialogue, and drag tests.

- [ ] **Step 7: Commit the integrated v2 behavior**

```bash
git add apps/desktop-tauri/src/components/companion/animation.ts apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.test.tsx
git commit -m "feat: enrich standalone companion states"
```

---

### Task 9: Bump version and harden dual-variant release packaging

**Files:**
- Modify: `apps/desktop-tauri/package.json`
- Modify: `apps/desktop-tauri/src/config/index.ts`
- Modify: `apps/desktop-tauri/src/components/settings/SettingsApp.test.tsx`
- Modify: `apps/desktop-tauri/src/test-setup.ts`
- Modify: `apps/desktop-tauri/src-tauri/tauri.conf.json`
- Modify: `apps/desktop-tauri/src-tauri/Cargo.toml`
- Modify: `apps/desktop-tauri/src-tauri/Cargo.lock`
- Modify: `scripts/check-release-readiness.mjs`
- Modify: `scripts/package-macos-dmg.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: completed v2 runtime and existing variant configs/build script.
- Produces: version 0.2.0 metadata, updated source gates, and verified Xia/Shen DMG discovery.

- [ ] **Step 1: Add failing release-readiness checks**

Add checks that require:

```js
const macPackagingSource = readText('scripts/package-macos-dmg.mjs');

check('release version', tauriConfig.version === '0.2.0', tauriConfig.version);
check(
  'global cursor command registered',
  tauriLibSource.includes('commands::debug::get_overlay_cursor_sample'),
  'src-tauri/src/lib.rs',
);
check(
  'mac packaging verifies both variants',
  macPackagingSource.includes("'xia-yizhou'") &&
    macPackagingSource.includes("'shen-xinghui'") &&
    macPackagingSource.includes('hdiutil') &&
    macPackagingSource.includes("'verify'"),
  'scripts/package-macos-dmg.mjs',
);
```

Define `macPackagingSource` by reading `scripts/package-macos-dmg.mjs`; Task 2 has already replaced the legacy four-frame jumping assertion with the full v2 row gate.

- [ ] **Step 2: Run release smoke and verify version/packaging checks fail**

Run: `pnpm qa:release-smoke`

Expected: FAIL for version 0.2.0 and dual-variant mac packaging before metadata/script updates.

- [ ] **Step 3: Update all runtime and bundle version sources**

Change every active `0.1.12` occurrence outside historical docs to `0.2.0` in:

```text
apps/desktop-tauri/package.json
apps/desktop-tauri/src/config/index.ts
apps/desktop-tauri/src/components/settings/SettingsApp.test.tsx
apps/desktop-tauri/src/test-setup.ts
apps/desktop-tauri/src-tauri/tauri.conf.json
apps/desktop-tauri/src-tauri/Cargo.toml
```

Run `cargo check` from `apps/desktop-tauri/src-tauri` to update only the local package entry in `Cargo.lock` to 0.2.0.

- [ ] **Step 4: Make the macOS packaging command verify both staged DMGs**

Replace the default-product packaging flow with a script that:

```js
const variants = [
  { id: 'xia-yizhou', productName: 'CodexPet Nest Xia Yizhou' },
  { id: 'shen-xinghui', productName: 'CodexPet Nest Shen Xinghui' },
];

run('pnpm', ['tauri:build']);

for (const variant of variants) {
  const dmgDir = join(bundleRoot, variant.id, 'dmg');
  const dmgName = `${variant.productName}_${version}_${archLabel}.dmg`;
  const dmgPath = join(dmgDir, dmgName);
  if (!existsSync(dmgPath)) {
    console.error(`Expected variant DMG was not created: ${dmgPath}`);
    process.exit(1);
  }
  run('hdiutil', ['verify', dmgPath]);
  console.log(`Verified Mac DMG: ${dmgPath}`);
}
```

Keep the existing platform guard and `run()` failure behavior. Ensure root `package.json` keeps `tauri:build:mac:dmg` pointing to this script.

- [ ] **Step 5: Run release smoke and version searches**

Run:

```bash
pnpm qa:release-smoke
rg -n "0\.1\.12" . --glob '!apps/desktop-tauri/src-tauri/target/**' --glob '!node_modules/**' --glob '!docs/**' --glob '!.git/**'
```

Expected: smoke PASS; the version search returns no active source occurrence.

- [ ] **Step 6: Commit metadata and packaging changes**

```bash
git add apps/desktop-tauri/package.json apps/desktop-tauri/src/config/index.ts apps/desktop-tauri/src/components/settings/SettingsApp.test.tsx apps/desktop-tauri/src/test-setup.ts apps/desktop-tauri/src-tauri/tauri.conf.json apps/desktop-tauri/src-tauri/Cargo.toml apps/desktop-tauri/src-tauri/Cargo.lock scripts/check-release-readiness.mjs scripts/package-macos-dmg.mjs package.json
git commit -m "build: package standalone companions v0.2.0"
```

---

### Task 10: Run the complete quality gate and create all release artifacts

**Files:**
- Create: `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/RELEASE-NOTES-zh-CN.md`
- Create: `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/QA-REPORT.md`
- Create: `/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/SHA256SUMS.txt`
- Copy: built macOS and Windows bundle artifacts into the delivery folder.

**Interfaces:**
- Consumes: all prior task commits, existing personal fork `yukilain007/codexpet-nest`, and Windows workflow `windows-build.yml`.
- Produces: two DMGs, two EXE installers, two MSI backups, release notes, QA evidence, and checksums.

- [ ] **Step 1: Verify the worktree scope before the full gate**

Run:

```bash
git status --short
git diff --check
```

Expected: `pnpm-workspace.yaml` remains modified and unstaged as the user's pre-existing change; the approved spec/plan may be untracked or committed separately; no unrelated file is staged.

- [ ] **Step 2: Run all frontend, Rust, asset, and release gates**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm qa:release-smoke
cargo fmt --all --check
cargo clippy --all-targets -- -D warnings
cargo test
```

Run the Cargo commands from `apps/desktop-tauri/src-tauri`.

Expected: every command exits 0. Record test counts and validator results for `QA-REPORT.md`.

- [ ] **Step 3: Build and verify both macOS DMGs**

Run: `pnpm tauri:build:mac:dmg`

Expected:

```text
apps/desktop-tauri/src-tauri/target/release/bundle/xia-yizhou/dmg/CodexPet Nest Xia Yizhou_0.2.0_aarch64.dmg
apps/desktop-tauri/src-tauri/target/release/bundle/shen-xinghui/dmg/CodexPet Nest Shen Xinghui_0.2.0_aarch64.dmg
```

Launch each staged `.app` from its variant `macos/` folder, confirm the correct character and app identity, then manually exercise click, repeated click, drag left/right, waiting, autonomous sequence, and at least the four cardinal gaze directions. Record outcomes without claiming unobserved Windows GUI behavior.

- [ ] **Step 4: Review intentional commits and push only the feature branch state to the personal fork**

Run:

```bash
git log --oneline myfork/main..HEAD
git diff --name-only myfork/main..HEAD
git status --short
git push myfork main
```

Expected: push succeeds to `yukilain007/codexpet-nest`; `pnpm-workspace.yaml` is not included because it was never staged or committed.

- [ ] **Step 5: Wait for the Windows workflow and download the successful artifact**

Run:

```bash
gh run list -R yukilain007/codexpet-nest --workflow windows-build.yml --limit 1
gh run watch --exit-status -R yukilain007/codexpet-nest $(gh run list -R yukilain007/codexpet-nest --workflow windows-build.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run download -R yukilain007/codexpet-nest $(gh run list -R yukilain007/codexpet-nest --workflow windows-build.yml --limit 1 --json databaseId --jq '.[0].databaseId') --name codexpet-nest-windows-bundle --dir /tmp/codexpet-nest-windows-v0.2.0
```

Expected: workflow conclusion `success`; downloaded artifact contains separate `xia-yizhou` and `shen-xinghui` folders with NSIS EXE and MSI outputs.

- [ ] **Step 6: Stage the final delivery folder**

Create the exact directory tree and copy:

```text
/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/
  mac/
    CodexPet Nest Xia Yizhou_0.2.0_aarch64.dmg
    CodexPet Nest Shen Xinghui_0.2.0_aarch64.dmg
  windows/xia-yizhou/
    CodexPet Nest Xia Yizhou_0.2.0_x64-setup.exe
    CodexPet Nest Xia Yizhou_0.2.0_x64_en-US.msi
  windows/shen-xinghui/
    CodexPet Nest Shen Xinghui_0.2.0_x64-setup.exe
    CodexPet Nest Shen Xinghui_0.2.0_x64_en-US.msi
```

Write `RELEASE-NOTES-zh-CN.md` with: separate installation, v2 assets, 16-direction gaze, waiting/running/review/failed states, macOS/Windows support floor, and the honest Windows GUI verification limitation.

Write `QA-REPORT.md` with: source hashes, v2 validator outcomes, all command outcomes, macOS manual observations, Windows workflow URL/conclusion, and `Windows GUI not manually verified`.

- [ ] **Step 7: Generate and verify final checksums**

From the delivery folder run:

```bash
find mac windows -type f -print0 | sort -z | xargs -0 shasum -a 256 > SHA256SUMS.txt
shasum -a 256 -c SHA256SUMS.txt
```

Expected: every artifact reports `OK`.

- [ ] **Step 8: Final integrity review**

Run:

```bash
find /Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716 -maxdepth 4 -type f -print | sort
git status --short
```

Expected: all six installers plus three documentation/checksum files exist; the source worktree contains no unexpected change, and the user's `pnpm-workspace.yaml` modification remains preserved.

---

## Completion Checklist

- [ ] Approved Xia and Shen v2 assets are byte-identical in the standalone app.
- [ ] All nine standard rows and all sixteen look cells are runtime-reachable.
- [ ] Gaze uses global cursor position without an input hook or new permission.
- [ ] Retina, Windows DPI, deadzone, attention radius, hysteresis, and exit grace are covered by tests.
- [ ] Direct click, repeated click, drag, cancellation, waiting, autonomous, dialogue, scaling, and click-through behavior pass regression tests.
- [ ] Both apps report version 0.2.0 and preserve distinct identifiers.
- [ ] Two macOS DMGs, two Windows EXEs, and two Windows MSIs are delivered.
- [ ] Release notes, QA evidence, and SHA-256 checksums are present.
- [ ] Windows build evidence is reported separately from Windows GUI evidence.
- [ ] Codex-installed pets and the user's `pnpm-workspace.yaml` change remain untouched.
