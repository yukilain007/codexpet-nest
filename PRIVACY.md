# Privacy

CodexPet Nest is designed to be transparent about what it reads and sends.

## Local files read

| File | Reason |
| --- | --- |
| `~/.codex/.codex-global-state.json` | Detect whether the Codex pet is open and its position. Used only to follow the pet with the nest overlay. |
| `~/.codex/logs_2.sqlite`, `logs_1.sqlite` | Read the latest `codex.rate_limits` event to show usage indicators. Only cached local logs are read; no network requests or auth tokens are used. |
| `~/Library/Application Support/CodexPet Nest/settings.json` | App settings. Created and managed by the app itself. |

## Local files written

| File / Directory | Reason |
| --- | --- |
| `~/Library/Application Support/CodexPet Nest/settings.json` | Persist user preferences (nest position, theme, widget settings, timer state). |
| `${CODEX_HOME:-$HOME/.codex}/pets/` | Install and remove pet packages. These contain only static assets (images/JSON) and do not execute code. |
| `~/Library/Application Support/CodexPet Nest/nests/` | Install and remove nest skin packages. These are static resource packs (images/JSON) that do not execute code or scripts. |
| `~/Library/Application Support/CodexPet Nest/tmp/` | Temporary directory for package extraction and validation. |

## Network

CodexPet Nest connects to `codexpet.xyz` for:
- Browsing pets and nests (read-only)
- Downloading and verifying packages (triggered by user "Install" action)
- Uploading user-created pet packages (explicit user action only)

## What CodexPet Nest does NOT do

- Read your source code, repositories, or project files.
- Read your Codex prompts, sessions, or conversation history.
- Read any files outside the paths listed above.
- Upload any file without explicit user confirmation.
- Store or transmit your passwords.
- Modify Codex Desktop or its app bundle.
