import { afterEach, describe, expect, it, vi } from 'vitest';

describe('build companion profile', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses Xia Yizhou by default', async () => {
    vi.resetModules();

    const { getBuildCompanionProfileId } = await import('./buildProfile');

    expect(getBuildCompanionProfileId()).toBe('xia-yizhou');
  });

  it('uses Shen Xinghui when selected for the build', async () => {
    vi.stubEnv('VITE_COMPANION_PROFILE_ID', 'shen-xinghui');
    vi.resetModules();

    const { getBuildCompanionProfileId, getBuildOverlayMode } = await import('./buildProfile');

    expect(getBuildCompanionProfileId()).toBe('shen-xinghui');
    expect(getBuildOverlayMode('follow-codex')).toBe('standalone-fixed');
  });

  it('falls back to Xia Yizhou for invalid build profile values', async () => {
    vi.stubEnv('VITE_COMPANION_PROFILE_ID', 'unknown-profile');
    vi.resetModules();

    const { getBuildCompanionProfileId } = await import('./buildProfile');

    expect(getBuildCompanionProfileId()).toBe('xia-yizhou');
  });

  it('keeps generic development builds configurable', async () => {
    vi.resetModules();

    const { getBuildOverlayMode } = await import('./buildProfile');

    expect(getBuildOverlayMode('follow-codex')).toBe('follow-codex');
  });
});
