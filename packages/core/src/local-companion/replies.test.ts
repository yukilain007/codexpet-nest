import { describe, expect, it } from 'vitest';
import {
  COMPANION_PROFILES,
  DEFAULT_COMPANION_PROFILE_ID,
  XIA_YIZHOU_REPLIES,
  categoryForInteraction,
  getCompanionProfile,
  selectCompanionReply,
} from './replies';

describe('local companion replies', () => {
  it('selects a stable click reply by seed', () => {
    const reply = selectCompanionReply('click', 0);

    expect(reply).toEqual({ category: 'click', text: XIA_YIZHOU_REPLIES.click[0] });
  });

  it('wraps seeded selection within the category list', () => {
    const reply = selectCompanionReply('secret', 999);

    expect(reply.category).toBe('secret');
    expect(XIA_YIZHOU_REPLIES.secret).toContain(reply.text);
  });

  it('uses secret mode for repeated clicks', () => {
    expect(
      categoryForInteraction({
        now: new Date(2026, 5, 30, 12, 0),
        clickCount: 4,
      }),
    ).toBe('secret');
  });

  it('uses night mode late at night before ordinary click replies', () => {
    expect(
      categoryForInteraction({
        now: new Date(2026, 5, 30, 23, 30),
        clickCount: 1,
      }),
    ).toBe('night');
  });

  it('uses click mode during daytime ordinary clicks', () => {
    expect(
      categoryForInteraction({
        now: new Date(2026, 5, 30, 15, 30),
        clickCount: 1,
      }),
    ).toBe('click');
  });

  it('exposes the Shen Xinghui companion profile with its bundled sprite path', () => {
    const profile = getCompanionProfile('shen-xinghui');

    expect(profile).toBe(COMPANION_PROFILES['shen-xinghui']);
    expect(profile.displayName).toBe('沈星回猫猫');
    expect(profile.interactionLabel).toBe('和沈星回互动');
    expect(profile.spritesheetUrl).toBe('/pets/shen-xinghui/spritesheet.webp');
  });

  it('keeps Xia Yizhou replies available separately from Shen Xinghui replies', () => {
    const xiaReply = selectCompanionReply('click', 0, 'xia-yizhou');
    const shenReply = selectCompanionReply('click', 0, 'shen-xinghui');

    expect(xiaReply.text).toBe('我在。');
    expect(shenReply.text).toBe('真的被看扁了。');
  });

  it('defaults companion profile lookup to Shen Xinghui for this QA pass', () => {
    expect(DEFAULT_COMPANION_PROFILE_ID).toBe('shen-xinghui');
    expect(getCompanionProfile().id).toBe(DEFAULT_COMPANION_PROFILE_ID);
  });
});
