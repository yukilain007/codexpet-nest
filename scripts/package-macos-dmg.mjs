import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tauriConfig = JSON.parse(
  readFileSync(join(root, 'apps/desktop-tauri/src-tauri/tauri.conf.json'), 'utf8'),
);
const version = tauriConfig.version;
const archLabel = process.arch === 'arm64' ? 'aarch64' : process.arch;
const bundleRoot = join(root, 'apps/desktop-tauri/src-tauri/target/release/bundle');
const variants = [
  { id: 'xia-yizhou', productName: 'CodexPet Nest Xia Yizhou' },
  { id: 'shen-xinghui', productName: 'CodexPet Nest Shen Xinghui' },
];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.platform !== 'darwin') {
  console.error('Mac DMG packaging must run on macOS.');
  process.exit(1);
}

run('pnpm', ['tauri:build']);

for (const variant of variants) {
  const dmgDir = join(bundleRoot, variant.id, 'dmg');
  const dmgName = `${variant.productName}_${version}_${archLabel}.dmg`;
  const dmgPath = join(dmgDir, dmgName);
  const dmgFiles = existsSync(dmgDir)
    ? readdirSync(dmgDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.dmg'))
        .map((entry) => entry.name)
    : [];

  if (!existsSync(dmgPath)) {
    console.error(`Expected variant DMG was not created: ${dmgPath}`);
    process.exit(1);
  }
  if (dmgFiles.length !== 1 || dmgFiles[0] !== basename(dmgPath)) {
    console.error(
      `Expected exactly ${dmgName} in ${dmgDir}, found: ${dmgFiles.join(', ') || 'none'}`,
    );
    process.exit(1);
  }

  run('hdiutil', ['verify', dmgPath]);
  console.log(`Verified Mac DMG: ${dmgPath}`);
}
