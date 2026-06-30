# Xia Yizhou Local Companion MVP Design

## Goal

Build a first local-only desktop companion MVP using the existing `xia-yizhou` Codex pet atlas. The app should run without AI, tokens, API keys, accounts, or network calls.

## Existing Context

- Repository: `/Users/yuki/codexpet-nest`.
- Shell: Tauri v2 + React + TypeScript monorepo.
- Existing overlay window already supports transparent rendering, drag handling, click-through control, follow-Codex mode, standalone fixed mode, tray/menu controls, macOS bundle config, and Windows bundle config.
- Existing pet source: `/Users/yuki/.codex/pets/xia-yizhou/spritesheet.webp`.
- Existing pet atlas contract: `1536x1872` WebP RGBA, 8 columns x 9 rows, 192x208 cells.

## MVP Scope

The MVP adds a local companion overlay experience:

1. Use the existing Xia Yizhou spritesheet, copied into the app bundle assets.
2. Render a transparent floating pet from the atlas.
3. Play idle animation by default.
4. On click, show a speech bubble and briefly switch to the waving animation.
5. If the user clicks repeatedly, sometimes show the hidden stronger/black-bellied line set.
6. While idle, occasionally show a warm line.
7. Use only local fixed replies in code or bundled JSON. No AI model, no token usage, no API key.
8. Preserve existing overlay movement behavior and settings window.

## Personality And Replies

The visible personality is warm, sunny, steady, and protective. The hidden personality is more forceful, perceptive, and possessive, but still restrained.

Initial reply categories:

- `click`: warm default interaction.
- `idle`: soft companionship and rest reminders.
- `night`: late-night rest guidance with stronger tone.
- `secret`: repeated-click hidden lines.
- `done`: calm completion lines for future task hooks.
- `error`: gentle retry lines for future failure hooks.

Approved initial lines include:

- `我在。`
- `怎么了？慢慢说。`
- `如果有什么心事，可以悄悄告诉我。`
- `晒太阳是很舒服的事，身上会充满阳光的味道。`
- `最近没休息好？正好该午休了，和我一起补会觉。`
- `现在已经错过朝霞了，不过晚上还有晚霞，到时候带你飞去天上看。`
- `我不睡，是有报告要批，你不睡是准备埋伏流浪体？`
- `嘴巴都张开了，怎么又闭上了？记住，无论是什么事，都不要瞒着我。`
- `关于你的，我全都知道。`
- `妹妹。`

## UX Behavior

- The overlay should feel like a desktop pet, not a dashboard.
- Pet size should fit inside the current overlay window without cropping.
- Speech bubble should sit near the pet, avoid covering the face, and disappear after a short timeout.
- Click handling must not interfere with drag handling more than necessary.
- If click-through is enabled, the companion should visually remain but should not intercept clicks.
- Debug overlay text remains debug-only.

## Technical Design

Use a small local-companion module rather than rewriting the existing nest system.

Core logic:

- `packages/core/src/local-companion/replies.ts`
  - Owns reply categories, reply selection, hour-based category choice, and click-streak category choice.
  - Pure TypeScript, no browser or Tauri dependency.

Renderer/app UI:

- `apps/desktop-tauri/public/pets/xia-yizhou/spritesheet.webp`
  - Bundled copy of the existing local pet atlas.
- `apps/desktop-tauri/src/components/companion/PetSprite.tsx`
  - Renders atlas cells as a CSS background-position animation.
- `apps/desktop-tauri/src/components/companion/SpeechBubble.tsx`
  - Renders local speech text.
- `apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx`
  - Coordinates click, idle timer, selected animation state, and speech bubble.
- `apps/desktop-tauri/src/components/overlay/OverlayApp.tsx`
  - Renders `LocalCompanionOverlay` in the existing overlay window while preserving drag, follow, click-through, diagnostics, and fallback status handling.

## Testing

Add focused tests:

- Core reply selection tests:
  - returns a click line by default
  - uses night lines during late-night hours
  - uses secret lines for repeated clicks
  - never returns an empty reply for known categories
- Component tests:
  - pet sprite uses the bundled atlas path and expected cell dimensions
  - click shows a speech bubble
  - repeated clicks can show secret-category text
  - click-through mode disables companion click interactions

Run at minimum:

- `pnpm --filter @codexpet/core test`
- `pnpm --filter @codexpet/desktop-tauri test`
- `pnpm --filter @codexpet/desktop-tauri build`

## Out Of Scope

- AI chat.
- API key management.
- Server backend.
- Editable settings UI for replies.
- Windows build execution on this Mac. The repo can keep Windows build configuration, but the actual Windows installer should be built on Windows or CI.
- Replacing the existing package registry or nest system.

## Acceptance Criteria

- The overlay displays the Xia Yizhou pet atlas as the primary visible companion.
- Clicking the pet displays a local Chinese line in a speech bubble.
- Repeated clicks can trigger hidden lines.
- Idle timer can display warm idle lines.
- No OpenAI API calls, no tokens, no secrets, and no network dependency are introduced.
- Existing tests pass after updates.
- The app still builds through the existing desktop Tauri build path.
