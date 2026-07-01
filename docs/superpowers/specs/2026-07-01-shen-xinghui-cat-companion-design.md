# Shen Xinghui Cat Companion Design

## Goal

Add a second local-only desktop companion pet for Shen Xinghui, based on the provided cat-ear sticker references. This pet must be added alongside the existing Xia Yizhou pet and must not overwrite or remove Xia Yizhou.

## Source References

Use the user-provided sticker images under `/Users/yuki/Downloads` as visual references:

- `008rFKTBly1hz6dy1ehi3j30wi0whafr.jpg`
- `008rFKTBly1hz6dy3e1ooj30u00u0tbl.jpg`
- `u=3794904872,212971452&fm=253&app=138&f=JPEG.jpeg`
- `008rFKTBly1hz6dy2tix6j30u00u0whh.jpg`
- `008rFKTBly1hz6dy1qk91j30wi0wd0y3.jpg`
- `008rFKTBly1hz6dy16879j30wi0wd43h.jpg`
- `008rFKTBly1hz6dy32x9vj30u00u0tc6.jpg`
- `008rFKTBly1hz6dy1z3i5j30wi0wgjwx.jpg`
- `008rFKTBly1hz6dy0t2wzj30u00u0wh3.jpg`

## Visual Identity

The pet should read as a chibi Shen Xinghui cat companion, closely matching the sticker style:

- Large pale silver-white hair mass with soft gray shadows.
- Tall cat ears with pale pink inner ears and darker gray-brown ear tips.
- Rounded pale face, small blue dot eyes, tiny red mouth, soft pink cheeks.
- Gray-brown hand-drawn outline with slightly uneven sticker-like line quality.
- Curved cat tail with darker tip and small stripe accents.
- Small, compact body proportions that remain readable in a `192x208` sprite cell.

Do not change the outfit color palette:

- Deep navy-blue jacket.
- Black lapel or collar area.
- White shirt and white trousers.
- Blue bow tie or chest accent.
- Keep the same cute formal outfit feeling from the sticker references.

## Personality And Expressions

The pet should feel soft, serious, sleepy, slightly stubborn, and easy to fluster:

- Idle: calm blinking or gentle breathing, with a sleepy but composed expression.
- Waving: small polite hand or paw wave, not overly energetic.
- Failed: flattened or deflated expression, sweat drop, sleepy/frustrated look.
- Waiting: expectant and slightly confused, as if waiting for the user to respond.
- Running/task state: focused effort, small determined fists or work posture.
- Review: careful staring or slight lean-in, matching the "really got looked down on" meme energy.

Allowed sticker-like attached effects:

- A single attached sweat drop for nervous/failed states.
- Small attached anger mark for flustered states.
- No detached floating punctuation, speech bubbles, meme text, or large decorative effects in the spritesheet.

## Replies

Add a separate Shen Xinghui reply set. The tone should be cute, sleepy, earnest, and mildly stubborn, using the sticker references as style cues.

Initial categories:

- `click`: short soft responses.
- `idle`: sleepy or quiet companionship lines.
- `night`: bedtime or "sleepy but awake" lines.
- `secret`: repeated-click flustered lines.
- `done`: small successful-task responses.
- `error`: gentle failed-task responses.

Candidate lines:

- `真的被看扁了。`
- `那我扁扁地走开。`
- `今天一定要努力工作。`
- `虽然什么都没干，但今天也真是辛苦我了呢。`
- `差不多星了。`
- `嗯嗯好的。`
- `你少看扁我。`
- `如果你惹毛了我，那我就毛茸茸地走开。`
- `吃又吃不饱，睡又睡不醒。`

## Technical Design

Create a new pet resource and keep the existing companion code reusable:

- Generate/package a new pet atlas as `shen-xinghui-cat`.
- Store the app-bundled spritesheet at `apps/desktop-tauri/public/pets/shen-xinghui/spritesheet.webp`.
- Add data-driven companion profiles so the app can choose between Xia Yizhou and Shen Xinghui without duplicating UI logic.
- Keep the current local-only behavior: no AI call, no token, no API key, no network dependency at runtime.
- The first implementation may default the overlay to Shen Xinghui for QA, as long as Xia Yizhou remains available in code and assets.

## Hatch Pet Requirements

Use the hatch-pet atlas contract:

- WebP or PNG atlas, `1536x1872`.
- 8 columns x 9 rows.
- Each cell is `192x208`.
- Transparent background.
- Unused cells are fully transparent.
- Rows follow the existing state contract: `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, `review`.

The generated pet must pass deterministic atlas validation plus visual QA:

- Same face, hair, ears, outfit palette, tail, and sticker outline style across all rows.
- No text copied from the sticker images into the spritesheet.
- No white rectangular sticker background in final cells.
- No cropped ears, tail, or body parts.
- No outfit recoloring away from the reference navy/black/white/blue palette.

## Tests

Add focused tests for the app integration:

- Shen Xinghui profile exists and points to `/pets/shen-xinghui/spritesheet.webp`.
- Companion UI can render the selected profile name in the accessible interaction label.
- Shen Xinghui local replies are selected separately from Xia Yizhou replies.
- Existing Xia Yizhou behavior remains covered.

Run at minimum:

- `pnpm --filter @codexpet/core test`
- `pnpm --filter @codexpet/desktop-tauri test`
- `pnpm typecheck`
- `pnpm lint`

## Out Of Scope

- Runtime AI chat.
- Token or API key handling.
- Editable in-app pet switcher settings for this first pass.
- Replacing Xia Yizhou.
- Copying the meme image text into the actual sprite cells.

## Acceptance Criteria

- A new Shen Xinghui cat pet exists as its own bundled app asset.
- The pet visually preserves the sticker reference details and outfit colors.
- The app can render Shen Xinghui without removing Xia Yizhou.
- Local fixed replies match Shen Xinghui's sleepy, cute, slightly stubborn tone.
- Tests pass locally.
- The generated atlas passes hatch-pet validation and visual QA.
