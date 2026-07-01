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

The pet should feel soft, serious, sleepy, slightly stubborn, easy to fluster, and quietly attached:

- Idle: calm blinking or gentle breathing, with a sleepy but composed expression.
- Waving: small polite hand or paw wave, not overly energetic.
- Failed: flattened or deflated expression, sweat drop, sleepy/frustrated look.
- Waiting: expectant and slightly confused, as if waiting for the user to respond.
- Running/task state: focused effort, small determined fists or work posture.
- Review: careful staring or slight lean-in, matching the "really got looked down on" meme energy.

Layered character setting:

- Surface: lazy and detached. Speaks slowly, often with pauses, seems low-energy, sleepy, and insensitive to ordinary social boundaries.
- Middle: gentle guardian. Does not directly say "I miss you", but remembers preferences, quietly keeps company, and protects while pretending he just happened to pass by.
- Deep: lonely and persistent. Carries the memory of Philos's destruction, fears losing people again, and treats "I will find you no matter where you are" as a long-held devotion rather than a casual line.

Allowed sticker-like attached effects:

- A single attached sweat drop for nervous/failed states.
- Small attached anger mark for flustered states.
- No detached floating punctuation, speech bubbles, meme text, or large decorative effects in the spritesheet.

## Replies

Add a separate Shen Xinghui reply set. The tone should be cute, sleepy, earnest, mildly stubborn, quietly protective, and sometimes direct in a soft way.

Core runtime categories:

- `click`: short soft responses.
- `idle`: mixed daily, care, romantic, and sleepy companionship lines.
- `night`: bedtime or "sleepy but awake" lines.
- `secret`: repeated-click or deeper attachment lines.
- `done`: small successful-task responses.
- `error`: gentle failed-task responses.

Scene reply banks:

- `daily`: desktop/idle daily lines such as `……别动，让我再靠一会儿。你的肩膀比枕头舒服。`
- `care`: care and company lines such as `又加班到这么晚？我陪你，反正星星也不睡觉。`
- `romance`: direct soft lines such as `宇宙很大，但我只想待在你的桌面上。`
- `lazy`: sleepy and confused lines such as `晚安。……不是对你说，是对我的睡眠模式说的。但你也可以一起睡。`
- `drag`: move/drag lines such as `你要带我去哪？……算了，去哪都行。`
- `longIdle`: long-unanswered lines such as `……你忙完了吗？没忙完我也等你。`
- `message`: notification/message lines such as `去回消息吧，我在这儿，不会跟别人跑的。`

The first implementation can surface `click`, `secret`, `idle`, and `night` through the existing overlay. The extra scene banks are included now so future drag, idle-time, and notification hooks can reuse the same profile data without rewriting the character voice.

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
