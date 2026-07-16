# Standalone V2 Companions Design

Date: 2026-07-16  
Status: Approved in conversation; awaiting written-spec review  
Target version: 0.2.0

## Summary

Upgrade the existing standalone Xia Yizhou and Shen Xinghui desktop companions from the legacy 8x9 atlas runtime to the approved Codex-compatible v2 8x11 atlas runtime. Keep the companions as two separately installed local applications and produce macOS and Windows packages for each character.

The standalone applications remain local-only. They do not read Codex state, do not depend on Codex Desktop, do not use network services, and do not install a system-wide mouse hook. They use Tauri's cross-platform cursor-position API to let the character look toward the global cursor while it is within an attention radius.

## Confirmed Product Decisions

- Xia Yizhou and Shen Xinghui remain separate applications with separate application identifiers, icons, names, assets, dialogue profiles, and installers.
- The final delivery has four primary products:
  - Xia Yizhou for macOS.
  - Xia Yizhou for Windows.
  - Shen Xinghui for macOS.
  - Shen Xinghui for Windows.
- macOS follows the previous delivery target: macOS 14 or later on Apple Silicon.
- Windows follows the previous delivery target: Windows 10 or 11 on x64.
- Each Windows product provides an EXE installer as the recommended installer and an MSI as a backup.
- The global cursor is followed only while it is close enough to the pet. The pet returns to idle after the cursor leaves the attention radius.
- The installed Codex pets under `/Users/yuki/.codex/pets` are source assets only and must not be modified by this work.
- The existing uncommitted `pnpm-workspace.yaml` change is user-owned and must not be included in the implementation commit.

## Current Gap

The standalone project already contains two build variants and a working macOS/Windows packaging path, but its embedded companion atlases are legacy 1536x1872 files and the runtime exposes only five animation states:

- idle
- running-right
- running-left
- waving
- jumping

The approved current character atlases are 1536x2288 v2 files with eleven rows. The standalone runtime therefore cannot currently display failed, waiting, running/task-work, review, or any of the sixteen look directions.

## Approved Source Assets

### Xia Yizhou

- Source: `/Users/yuki/.codex/pets/xia-yizhou/spritesheet.webp`
- Required dimensions: 1536x2288
- SHA-256: `32c0d8e5222b731c6ca1e6ae74e1bdd141dfdb249afd45a276655924c0d44e08`
- Standalone destination: `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp`

### Shen Xinghui

- Source: `/Users/yuki/.codex/pets/shen-xinghui-cat/spritesheet.webp`
- Required dimensions: 1536x2288
- SHA-256: `e8f95384a3d3e3569a52bbf142993ff908cab20a15d0d65b41f23b7c5ff1c3b0`
- Standalone destination: `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp`

Both copied assets must pass the hatch-pet v2 validator before application packaging. The copied standalone files must have the same hashes as the approved sources.

## Runtime Architecture

### Shared Engine, Separate Profiles

Both products use one shared runtime implementation. Build-time profile selection continues to choose either `xia-yizhou` or `shen-xinghui`, while each profile owns:

- display and interaction name
- spritesheet URL
- dialogue banks
- application icon and identifier
- waiting dwell time
- autonomous-action cadence

The state engine and cursor geometry remain shared so macOS and Windows behave consistently.

### Native Cursor Bridge

Add a small Tauri command that returns the current global cursor position using Tauri's existing `cursor_position()` API. This provides physical screen coordinates on both macOS and Windows without installing an operating-system event hook.

The frontend combines:

- global cursor physical coordinates
- overlay window outer position in physical coordinates
- overlay scale factor
- the pet anchor's browser bounding box in logical coordinates

The frontend converts the cursor into overlay-local logical coordinates before calculating distance and angle from the pet's visual head/upper-body attention anchor. All direction math operates in logical pixels so Retina and Windows display scaling do not change the attention behavior.

Cursor polling runs every 80 ms only while the overlay is active. A failed or stale cursor read silently disables gaze and falls back to the normal state engine. It must never crash the app, interrupt click/drag interactions, or display a technical error bubble.

### Render Model

Replace the legacy single animation-state model with two explicit pose kinds:

```text
AnimatedPose(state, frame)
LookPose(directionIndex)
```

`AnimatedPose` addresses standard rows 0-8 and advances according to the row's per-frame duration table. `LookPose` addresses exactly one cell in rows 9-10 and remains static until the quantized cursor direction changes.

This separation prevents look cells from being played as a looping animation and makes the neutral deadzone fall back to the normal idle animation.

## V2 Atlas Contract

The renderer uses eight columns of 192x208 cells. Standard-state durations are:

| Row | State | Frames | Frame durations in milliseconds |
| --- | --- | ---: | --- |
| 0 | idle | 6 | 280, 110, 110, 140, 140, 320 |
| 1 | running-right | 8 | 120, 120, 120, 120, 120, 120, 120, 220 |
| 2 | running-left | 8 | 120, 120, 120, 120, 120, 120, 120, 220 |
| 3 | waving | 4 | 140, 140, 140, 280 |
| 4 | jumping | 5 | 140, 140, 140, 140, 280 |
| 5 | failed | 8 | 140, 140, 140, 140, 140, 140, 140, 240 |
| 6 | waiting | 6 | 150, 150, 150, 150, 150, 260 |
| 7 | running | 6 | 120, 120, 120, 120, 120, 220 |
| 8 | review | 6 | 150, 150, 150, 150, 150, 280 |

Look direction order is fixed:

```text
row 9:  000, 022.5, 045, 067.5, 090, 112.5, 135, 157.5
row 10: 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5
```

`000` is up. Angles increase clockwise in screen coordinates. A neutral/front look is represented by idle, not by a look cell.

## Gaze Geometry

- Cursor polling interval: 80 ms.
- Neutral deadzone radius: 28 logical pixels around the pet attention anchor.
- Attention radius: 640 logical pixels.
- Exit grace period: 600 ms before gaze returns to idle.
- Direction sectors: sixteen equal 22.5-degree sectors.
- Sector hysteresis: retain the current sector until the cursor crosses the next boundary by 4 degrees.
- Cursor positions inside the deadzone use idle.
- Cursor positions outside the attention radius use idle after the exit grace period.
- Cursor positions between those radii select one of the sixteen look cells.

Hysteresis and exit grace are required to prevent eye/head flicker at sector and distance boundaries.

## State Priority And Behavior

The state engine resolves only one visible state at a time in this priority order:

1. active drag
2. click or cancellation reaction
3. waiting or autonomous special action
4. cursor gaze
5. idle

### Direct Interaction

- Pointer down on the pet: play `jumping` as the picked-up pose.
- Drag right beyond the existing movement threshold: play `running-right`.
- Drag left beyond the existing movement threshold: play `running-left`.
- Normal pointer release after a drag: resolve immediately to gaze if the cursor is still in range, otherwise idle.
- Pointer cancellation or an interrupted drag: play `failed` for 1.4 seconds, then resolve to gaze or idle.
- One click: play `waving` for 0.9 seconds and show a normal click reply.
- Two or three clicks inside the existing 2.2-second streak window: play `jumping` for 1.1 seconds and show the matching active reply.
- Four or more clicks inside the streak window: play `failed` for 1.4 seconds and show the profile's hidden stronger reply.
- A real drag suppresses the click that browsers may emit after pointer release.

### Waiting State

When the cursor stays inside the attention radius without clicking or dragging and moves less than 12 logical pixels per poll window, the pet may show one waiting reaction per attention session:

- Xia Yizhou waiting dwell: 2.4 seconds before triggering.
- Shen Xinghui waiting dwell: 3.0 seconds before triggering.
- Waiting animation duration: one complete loop, then resolve back to gaze.
- The session resets only after the cursor has remained outside the attention radius for at least 2 seconds.

The waiting state must not repeatedly restart while the cursor remains still.

### Autonomous State

Autonomous actions run only when there is no direct interaction, no cursor in the attention radius, and no visible reply that needs an interaction reaction.

- Xia Yizhou first autonomous sequence: after 90 seconds of inactivity.
- Shen Xinghui first autonomous sequence: after 105 seconds of inactivity.
- Sequence: `running` for one complete loop, then `review` for one complete loop, then idle.
- Later sequences use a deterministic jittered delay between 120 and 180 seconds so tests can inject a predictable random source.
- Autonomous actions do not claim that a real task is running and do not display task-progress text.
- Any click, drag, or cursor re-entry cancels the autonomous sequence immediately.

### Existing Dialogue Behavior

Existing profile-specific dialogue remains local and intact. The idle dialogue timer may continue to show a bubble, but it must not override a higher-priority interaction animation. Xia Yizhou and Shen Xinghui keep separate reply banks and different cadence values.

### Click-Through Mode

Click-through continues to disable click and drag interaction. Gaze and autonomous animations may continue because they do not capture pointer events. This preserves the visual companion behavior while respecting click-through.

## Components And File Responsibilities

Expected implementation boundaries:

- `apps/desktop-tauri/src/components/companion/animation.ts`
  - v2 row metadata and duration arrays
  - standard-pose and look-pose addressing helpers
- `apps/desktop-tauri/src/components/companion/gaze.ts`
  - pure cursor distance, angle, quantization, deadzone, and hysteresis functions
- `apps/desktop-tauri/src/components/companion/stateMachine.ts`
  - pure priority and timed-transition decisions
- `apps/desktop-tauri/src/components/companion/PetSprite.tsx`
  - render either a standard animation frame or one look cell
- `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`
  - pointer gestures, timers, cursor polling, dialogue, and orchestration
- `apps/desktop-tauri/src-tauri/src/commands/`
  - a small read-only global-cursor-position command
- `packages/core/src/local-companion/replies.ts`
  - character-specific cadence metadata and dialogue selection only
- `scripts/build-tauri-variants.mjs`
  - retain two separate application variants and stage both bundles
- macOS packaging script
  - package both variant `.app` bundles into separate DMGs rather than rebuilding the default product

Names may be adjusted to fit the repository's existing module conventions, but the pure geometry and state logic must remain separately testable from React and Tauri.

## Error Handling And Performance

- Cursor API failure: record no user-visible error and fall back to gaze unavailable.
- Window-position or scale-factor failure: fall back to local pointer behavior when available, otherwise idle.
- Invalid direction index: clamp or reject in a pure helper; never render outside rows 9-10.
- Missing or wrong-size embedded atlas: fail release-readiness validation before packaging.
- State timeout after component unmount: cancel all timers and pending polling requests.
- Do not allow overlapping cursor requests; a new poll waits until the prior native call completes.
- Paused or hidden overlay windows do not need active high-frequency cursor polling.
- No system-wide input hook, Accessibility permission, network permission, or Codex state permission is introduced.

## Versioning And Packaging

Update the application and Rust package versions from 0.1.12 to 0.2.0. Preserve the existing application identifiers:

- `xyz.codexpet.nest.xiayizhou`
- `xyz.codexpet.nest.shenxinghui`

Expected primary artifacts:

```text
mac/CodexPet Nest Xia Yizhou_0.2.0_aarch64.dmg
mac/CodexPet Nest Shen Xinghui_0.2.0_aarch64.dmg
windows/xia-yizhou/CodexPet Nest Xia Yizhou_0.2.0_x64-setup.exe
windows/shen-xinghui/CodexPet Nest Shen Xinghui_0.2.0_x64-setup.exe
```

Expected backup Windows artifacts:

```text
windows/xia-yizhou/CodexPet Nest Xia Yizhou_0.2.0_x64_en-US.msi
windows/shen-xinghui/CodexPet Nest Shen Xinghui_0.2.0_x64_en-US.msi
```

The macOS artifacts are built locally. The Windows artifacts are built by the existing Windows workflow in `yukilain007/codexpet-nest`. The intentional implementation commit is pushed to that fork's `main` branch to trigger the build. After the workflow passes, its variant bundle is downloaded and staged locally.

Final delivery folder:

```text
/Users/yuki/Downloads/CodexPet-Nest-Standalone-v0.2.0-20260716/
```

The folder contains:

- `mac/`
- `windows/`
- `RELEASE-NOTES-zh-CN.md`
- `QA-REPORT.md`
- `SHA256SUMS.txt`

## Test Strategy

### Pure Unit Tests

- all v2 row numbers, frame counts, and exact duration arrays
- direction-index mapping across the row-9/row-10 boundary
- up, right, down, left, and representative diagonal quantization
- neutral deadzone and attention-radius behavior
- 4-degree hysteresis at sector boundaries
- exit grace behavior
- state priority for drag, click, waiting, gaze, autonomous, and idle
- single, repeated, and secret click-streak transitions
- drag cancel to failed, normal drag release to gaze/idle
- per-profile waiting and autonomous cadence

### React Component Tests

- correct sprite asset for each build profile
- one look cell rendered without loop advancement
- standard animations advance with per-frame timing
- cursor polling starts, does not overlap, and cleans up
- click-through prevents click/drag but retains gaze
- waiting triggers once per attention session
- autonomous running-to-review sequence and cancellation
- current bubble placement and pixel-stable scaling remain intact

### Rust And Release Tests

- cursor command returns a serializable physical position or a controlled error
- Tauri command registration is present
- both variant identifiers and icons remain distinct
- both embedded spritesheets are 1536x2288 and hash-match their approved sources
- hatch-pet v2 validation passes for both embedded assets
- frontend typecheck, lint, formatting, and all tests pass
- Rust formatting, clippy, and tests pass
- release-readiness smoke checks pass

### Package QA

- Build both macOS variant apps and both DMGs.
- Launch each macOS app separately and confirm its correct character, icon, dialogue, click, drag, waiting, autonomous, and gaze behavior.
- Verify the two app identifiers coexist without overwriting each other's settings.
- Push the isolated implementation commit to the personal fork and require a successful Windows workflow run.
- Download the Windows variant bundle and verify both EXE and MSI products, filenames, sizes, and hashes.
- Windows source/build success does not by itself claim real-device GUI verification. The QA report states the evidence honestly.

## Acceptance Criteria

- Both standalone embedded atlases are byte-identical to the approved v2 sources and validate as 1536x2288 v2 atlases.
- All nine standard animation rows are reachable through real interaction or autonomous behavior.
- All sixteen look directions are reachable from global cursor positions and use the fixed clockwise mapping.
- Neutral, far-away, stale, and failed cursor reads return safely to idle.
- Direction changes do not visibly flicker at boundaries.
- Existing click, repeated-click, drag, bubble, scale, click-through, and per-character dialogue behavior remains intact.
- Xia Yizhou and Shen Xinghui remain separately installable with distinct application identifiers and settings.
- The Codex-installed pets remain unchanged.
- Every automated frontend, Rust, asset, and release-readiness check passes.
- Two macOS DMGs, two Windows EXE installers, and two Windows MSI backups are staged in the final delivery folder with release notes, QA evidence, and SHA-256 checksums.

## Out Of Scope

- Combining both characters into one selector application.
- Reading Codex task state or following the Codex pet window.
- Cloud sync, AI chat, remote APIs, analytics, or network access.
- System-wide input hooks or new operating-system permissions.
- Intel macOS or Windows ARM packages.
- New character art generation or changes to the already approved v2 atlases.
- Claiming Windows GUI parity without a real Windows manual test.
