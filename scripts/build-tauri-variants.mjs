import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const desktopDir = join(root, 'apps/desktop-tauri');
const bundleDir = join(root, 'apps/desktop-tauri/src-tauri/target/release/bundle');
const stagingDir = join(root, 'apps/desktop-tauri/src-tauri/target/release/variant-bundles');
const tauriBin = join(
  desktopDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tauri.cmd' : 'tauri',
);

const variants = [
  {
    id: 'xia-yizhou',
    label: 'Xia Yizhou',
    profileId: 'xia-yizhou',
    config: 'src-tauri/tauri.xia-yizhou.conf.json',
  },
  {
    id: 'shen-xinghui',
    label: 'Shen Xinghui',
    profileId: 'shen-xinghui',
    config: 'src-tauri/tauri.shen-xinghui.conf.json',
  },
];

rmSync(bundleDir, { recursive: true, force: true });
rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(stagingDir, { recursive: true });

for (const variant of variants) {
  console.log(`Building ${variant.label} package...`);
  rmSync(bundleDir, { recursive: true, force: true });

  run(tauriBin, ['build', '--config', variant.config], {
    VITE_COMPANION_PROFILE_ID: variant.profileId,
  });

  if (!existsSync(bundleDir)) {
    throw new Error(`Tauri build did not create ${bundleDir}`);
  }

  const variantBundleDir = join(stagingDir, variant.id);
  mkdirSync(variantBundleDir, { recursive: true });
  cpSync(bundleDir, variantBundleDir, { recursive: true });
}

rmSync(bundleDir, { recursive: true, force: true });
mkdirSync(bundleDir, { recursive: true });

for (const variant of variants) {
  cpSync(join(stagingDir, variant.id), join(bundleDir, variant.id), { recursive: true });
}

writeFileSync(
  join(bundleDir, 'variant-manifest.json'),
  `${JSON.stringify(
    {
      variants: variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        profileId: variant.profileId,
        path: relative(bundleDir, join(bundleDir, variant.id)),
      })),
    },
    null,
    2,
  )}\n`,
);

console.log(`Combined variant bundles staged in ${bundleDir}`);

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: desktopDir,
    env: {
      ...process.env,
      ...extraEnv,
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
