import { existsSync, mkdtempSync, rmSync, mkdirSync, symlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tauriConfig = JSON.parse(
  readFileSync(join(root, 'apps/desktop-tauri/src-tauri/tauri.conf.json'), 'utf8'),
);
const productName = tauriConfig.productName;
const version = tauriConfig.version;
const archLabel = process.arch === 'arm64' ? 'aarch64' : process.arch;
const bundleRoot = join(root, 'apps/desktop-tauri/src-tauri/target/release/bundle');
const appPath = join(bundleRoot, 'macos', `${productName}.app`);
const dmgPath = join(
  bundleRoot,
  'dmg',
  `${productName.replaceAll(' ', '-')}-${version}-${archLabel}.dmg`,
);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.platform !== 'darwin') {
  console.error('Mac DMG packaging must run on macOS.');
  process.exit(1);
}

run('pnpm', ['tauri:build:app']);

if (!existsSync(appPath)) {
  console.error(`Expected app bundle was not created: ${appPath}`);
  process.exit(1);
}

const stagingDir = mkdtempSync(join(tmpdir(), 'codexpet-dmg.'));
mkdirSync(dirname(dmgPath), { recursive: true });

try {
  run('ditto', [appPath, join(stagingDir, `${productName}.app`)]);
  symlinkSync('/Applications', join(stagingDir, 'Applications'));
  run('hdiutil', [
    'create',
    '-volname',
    productName,
    '-srcfolder',
    stagingDir,
    '-ov',
    '-format',
    'UDZO',
    dmgPath,
  ]);
  run('hdiutil', ['verify', dmgPath]);
  console.log(`Mac DMG created: ${dmgPath}`);
} finally {
  rmSync(stagingDir, { recursive: true, force: true });
}
