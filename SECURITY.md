# Security

## Package Verification (Implemented)

CodexPet Nest enforces strict security checks during package installation:

- **Integrity**: Verifies `sha256` hashes against signed metadata from `codexpet.xyz`.
- **Validation**: Validates `codexpet-package.json` and `nest.json` structures.
- **Sandboxing**: Uses `SafeZipReader` to prevent path traversal (`../`) and symbolic link attacks.
- **Content Filtering**: Rejects packages containing executable files (`.sh`, `.js`, `.py`, `.exe`, `.bin`, etc.).
- **Static Only**: Nest skins are strictly static (images and JSON); no code execution is possible.

## Authentication (Implemented)

For creator workflows (Phase 4+):

- **Device Flow**: Uses device-code OAuth flow — no passwords are ever entered in or stored by the app.
- **Secure Storage**: Access tokens are stored exclusively in the macOS System Keychain.
- **Encryption**: Sensitive local identifiers are kept in Keychain, not in plaintext settings files.

## Local Security

- **Permissions**: Settings and library data are stored under `~/Library/Application Support/CodexPet Nest/` with standard user file permissions.
- **Non-Invasive**: The app does not require elevated (root) privileges and does not modify the Codex Desktop app bundle.
- **Read-Only Codex Access**: Access to Codex logs and state files is strictly read-only.

## Reporting

Report security issues via GitHub issues or email. We take security reports seriously and will respond promptly.
