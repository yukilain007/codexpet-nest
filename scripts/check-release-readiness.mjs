import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const packageJson = readJson('package.json');

const checks = [];

function pass(name, detail) {
  checks.push({ name, detail, ok: true });
}

function fail(name, detail) {
  checks.push({ name, detail, ok: false });
}

function check(name, condition, detail) {
  if (condition) {
    pass(name, detail);
  } else {
    fail(name, detail);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function readText(path) {
  return readFileSync(join(root, path), 'utf8');
}

function iconSetExists(icons) {
  return (
    Array.isArray(icons) &&
    icons.length === 5 &&
    icons.every((icon) => existsSync(join(root, 'apps/desktop-tauri/src-tauri', icon)))
  );
}

const tauriConfig = readJson('apps/desktop-tauri/src-tauri/tauri.conf.json');
const xiaYizhouTauriConfig = readJson('apps/desktop-tauri/src-tauri/tauri.xia-yizhou.conf.json');
const shenXinghuiTauriConfig = readJson(
  'apps/desktop-tauri/src-tauri/tauri.shen-xinghui.conf.json',
);
const overlaySource = readText('apps/desktop-tauri/src/components/overlay/OverlayApp.tsx');
const settingsSource = readText('apps/desktop-tauri/src/components/settings/SettingsApp.tsx');
const traySource = readText('apps/desktop-tauri/src-tauri/src/tray/builder.rs');
const windowSource = readText('apps/desktop-tauri/src-tauri/src/windows/setup.rs');
const platformMacosSource = readText('apps/desktop-tauri/src-tauri/src/platform/macos.rs');
const actionsSource = readText('apps/desktop-tauri/src-tauri/src/commands/actions.rs');
const configCommandsSource = readText('apps/desktop-tauri/src-tauri/src/commands/config.rs');
const tauriLibSource = readText('apps/desktop-tauri/src-tauri/src/lib.rs');
const defaultCapability = readText('apps/desktop-tauri/src-tauri/capabilities/default.json');
const windowsBuildWorkflowPath = '.github/workflows/windows-build.yml';
const windowsBuildWorkflowExists = existsSync(join(root, windowsBuildWorkflowPath));
const windowsBuildWorkflow = windowsBuildWorkflowExists ? readText(windowsBuildWorkflowPath) : '';
const variantBuildScriptPath = 'scripts/build-tauri-variants.mjs';
const variantBuildScriptExists = existsSync(join(root, variantBuildScriptPath));
const variantBuildScript = variantBuildScriptExists ? readText(variantBuildScriptPath) : '';
const localCompanionSource = readText(
  'apps/desktop-tauri/src/components/companion/LocalCompanionOverlay.tsx',
);
const companionAnimationSource = readText(
  'apps/desktop-tauri/src/components/companion/animation.ts',
);

check('product name', tauriConfig.productName === 'CodexPet Nest', tauriConfig.productName);
check('bundle identifier', tauriConfig.identifier === 'xyz.codexpet.nest', tauriConfig.identifier);
check(
  'Xia Yizhou product name',
  xiaYizhouTauriConfig.productName === 'CodexPet Nest Xia Yizhou',
  xiaYizhouTauriConfig.productName,
);
check(
  'Xia Yizhou bundle identifier',
  xiaYizhouTauriConfig.identifier === 'xyz.codexpet.nest.xiayizhou',
  xiaYizhouTauriConfig.identifier,
);
check(
  'Shen Xinghui product name',
  shenXinghuiTauriConfig.productName === 'CodexPet Nest Shen Xinghui',
  shenXinghuiTauriConfig.productName,
);
check(
  'Shen Xinghui bundle identifier',
  shenXinghuiTauriConfig.identifier === 'xyz.codexpet.nest.shenxinghui',
  shenXinghuiTauriConfig.identifier,
);
check(
  'release frontend dist',
  tauriConfig.build?.frontendDist === '../dist',
  tauriConfig.build?.frontendDist,
);
check(
  'release build command',
  tauriConfig.build?.beforeBuildCommand === 'pnpm build',
  tauriConfig.build?.beforeBuildCommand,
);
check(
  'dev server isolated to devUrl',
  typeof tauriConfig.build?.devUrl === 'string',
  tauriConfig.build?.devUrl,
);
check(
  'macOS private API enabled',
  tauriConfig.app?.macOSPrivateApi === true,
  String(tauriConfig.app?.macOSPrivateApi),
);
check(
  'no static tauri windows in config',
  Array.isArray(tauriConfig.app?.windows) && tauriConfig.app.windows.length === 0,
  JSON.stringify(tauriConfig.app?.windows),
);

for (const icon of tauriConfig.bundle?.icon ?? []) {
  check(
    `bundle icon exists: ${icon}`,
    existsSync(join(root, 'apps/desktop-tauri/src-tauri', icon)),
    icon,
  );
}

check(
  'Xia Yizhou uses distinct role icon set',
  iconSetExists(xiaYizhouTauriConfig.bundle?.icon) &&
    xiaYizhouTauriConfig.bundle.icon.every((icon) => icon.startsWith('icons/xia-yizhou/')),
  JSON.stringify(xiaYizhouTauriConfig.bundle?.icon),
);
check(
  'Shen Xinghui uses distinct role icon set',
  iconSetExists(shenXinghuiTauriConfig.bundle?.icon) &&
    shenXinghuiTauriConfig.bundle.icon.every((icon) => icon.startsWith('icons/shen-xinghui/')),
  JSON.stringify(shenXinghuiTauriConfig.bundle?.icon),
);
check(
  'role icon sets are not shared',
  JSON.stringify(xiaYizhouTauriConfig.bundle?.icon) !==
    JSON.stringify(shenXinghuiTauriConfig.bundle?.icon),
  'variant icon paths',
);

check(
  'tray embeds menu-bar icon',
  traySource.includes('include_bytes!("../../icons/32x32.png")'),
  'tray/builder.rs',
);
check('tray show overlay menu item', traySource.includes('Show Overlay'), 'tray/builder.rs');
check('tray hide overlay menu item', traySource.includes('Hide Overlay'), 'tray/builder.rs');
check('tray open settings menu item', traySource.includes('Open Settings'), 'tray/builder.rs');
check(
  'settings close-to-hide registered',
  windowSource.includes('CloseRequested') && windowSource.includes('prevent_close'),
  'windows/setup.rs',
);
check(
  'release overlay size configured',
  windowSource.includes('RELEASE_OVERLAY_WIDTH: f64 = 360.0') &&
    windowSource.includes('RELEASE_OVERLAY_HEIGHT: f64 = 280.0'),
  'windows/setup.rs',
);
check(
  'debug overlay gated by backend config',
  overlaySource.includes('const isDevOverlay = config.isDebug === true'),
  'OverlayApp.tsx',
);
check(
  'overlay does not use Vite dev flag for debug UI',
  !overlaySource.includes('import.meta.env.DEV'),
  'OverlayApp.tsx',
);
check(
  'pet overlay hides quick actions and visible drag controls',
  !overlaySource.includes('data-testid="quick-actions"') &&
    !overlaySource.includes('overlay-interaction-disabled') &&
    !overlaySource.includes('Click-through is on') &&
    !overlaySource.includes('>Drag<') &&
    !overlaySource.includes('execute_quick_action'),
  'OverlayApp.tsx',
);
check(
  'pet body drag moves overlay',
  overlaySource.includes('onPetDragStart={handlePetDragPointerDown}') &&
    overlaySource.includes('onPetDragMove={handleDragPointerMove}') &&
    overlaySource.includes('onPetDragEnd={stopManualDrag}'),
  'OverlayApp.tsx',
);
check(
  'pet body drag suppresses accidental click dialogue',
  localCompanionSource.includes('suppressNextClickRef') &&
    localCompanionSource.includes('data-drag-visual') &&
    localCompanionSource.includes("setCompanionAnimation('jumping')"),
  'LocalCompanionOverlay.tsx',
);
check(
  'pet drag direction animations configured',
  companionAnimationSource.includes("'running-right': { row: 1, frames: 8 }") &&
    companionAnimationSource.includes("'running-left': { row: 2, frames: 8 }") &&
    companionAnimationSource.includes('jumping: { row: 4, frames: 4 }'),
  'animation.ts',
);
check(
  'production missing asset feedback is gentle',
  overlaySource.includes('Some local nest assets are unavailable.'),
  'OverlayApp.tsx',
);
check(
  'development diagnostics present',
  settingsSource.includes('Development Diagnostics'),
  'SettingsApp.tsx',
);
check(
  'follow diagnostics refresh interval',
  settingsSource.includes('setInterval(refreshFollowDiagnostics, 1_000)'),
  'SettingsApp.tsx',
);
check('local snapshot UI present', settingsSource.includes('Local Snapshot'), 'SettingsApp.tsx');
check(
  'local snapshot export command registered',
  tauriLibSource.includes('commands::config::export_local_snapshot'),
  'src-tauri/src/lib.rs',
);
check(
  'local snapshot import command registered',
  tauriLibSource.includes('commands::config::import_local_snapshot'),
  'src-tauri/src/lib.rs',
);
check(
  'local snapshot notes do not copy package assets',
  configCommandsSource.includes('package asset folders are not copied'),
  'commands/config.rs',
);
check(
  'Windows click-through explicitly unimplemented',
  platformMacosSource.includes('Windows click-through is not implemented yet') &&
    platformMacosSource.includes('Err(WINDOWS_CLICK_THROUGH_NOT_IMPLEMENTED.to_string())'),
  'platform/macos.rs',
);
check(
  'action capabilities keep shell disabled',
  actionsSource.includes('shell_execution_enabled: false'),
  'commands/actions.rs',
);
check(
  'Tauri shell capability absent',
  !defaultCapability.includes('shell:'),
  'capabilities/default.json',
);
check('Windows CI workflow exists', windowsBuildWorkflowExists, windowsBuildWorkflowPath);
check(
  'Windows CI source targets windows runner',
  windowsBuildWorkflow.includes('windows-latest'),
  windowsBuildWorkflowPath,
);
check(
  'Windows CI source runs usable Tauri build command',
  windowsBuildWorkflow.includes('pnpm tauri:build'),
  windowsBuildWorkflowPath,
);
check(
  'Windows CI source does not use unavailable root tauri binary',
  !windowsBuildWorkflow.includes('pnpm tauri build'),
  windowsBuildWorkflowPath,
);
check(
  'Windows CI uploads artifacts',
  windowsBuildWorkflow.includes('actions/upload-artifact') &&
    windowsBuildWorkflow.includes('codexpet-nest-windows-bundle'),
  windowsBuildWorkflowPath,
);
check(
  'root tauri build runs variant script',
  packageJson.scripts?.['tauri:build'] === 'node scripts/build-tauri-variants.mjs',
  packageJson.scripts?.['tauri:build'],
);
check('variant build script exists', variantBuildScriptExists, variantBuildScriptPath);
check(
  'variant build script builds Xia Yizhou package',
  variantBuildScript.includes("profileId: 'xia-yizhou'") &&
    variantBuildScript.includes('tauri.xia-yizhou.conf.json'),
  variantBuildScriptPath,
);
check(
  'variant build script builds Shen Xinghui package',
  variantBuildScript.includes("profileId: 'shen-xinghui'") &&
    variantBuildScript.includes('tauri.shen-xinghui.conf.json'),
  variantBuildScriptPath,
);
check(
  'variant build script stages separate variant folders',
  variantBuildScript.includes('join(bundleDir, variant.id)') &&
    variantBuildScript.includes('variant-manifest.json'),
  variantBuildScriptPath,
);
check(
  'variant build script calls package Tauri CLI directly with Windows command shell support',
  variantBuildScript.includes("'.bin'") &&
    variantBuildScript.includes("'tauri.cmd'") &&
    variantBuildScript.includes("shell: process.platform === 'win32'") &&
    !variantBuildScript.includes("'--filter', '@codexpet/desktop-tauri'"),
  variantBuildScriptPath,
);
check(
  'Windows CI workflow unchanged for token without workflow scope',
  !windowsBuildWorkflow.includes('tauri.xia-yizhou.conf.json') &&
    !windowsBuildWorkflow.includes('tauri.shen-xinghui.conf.json'),
  windowsBuildWorkflowPath,
);

for (const result of checks) {
  const prefix = result.ok ? 'PASS' : 'FAIL';
  console.log(`${prefix} ${result.name}: ${result.detail}`);
}

const failed = checks.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`Release readiness smoke failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`Release readiness smoke passed: ${checks.length} checks.`);
