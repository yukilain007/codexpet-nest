import { describe, expect, it } from 'vitest';
import {
  COMPANION_PROFILES,
  DEFAULT_COMPANION_PROFILE_ID,
  SHEN_XINGHUI_REPLIES,
  XIA_YIZHOU_DIALOGUES,
  XIA_YIZHOU_REPLIES,
  categoryForInteraction,
  getCompanionProfile,
  selectCompanionReply,
} from './replies';

describe('local companion replies', () => {
  it('selects a stable click reply by seed', () => {
    const reply = selectCompanionReply('click', 0);

    expect(reply).toMatchObject({
      category: 'click',
      text: XIA_YIZHOU_REPLIES.click[0],
      emotion: '慵懒',
      note: '被点击基础反应',
      weight: 8,
    });
  });

  it('wraps seeded selection within the category list', () => {
    const reply = selectCompanionReply('high_favor', 999, 'xia-yizhou');

    expect(reply.category).toBe('high_favor');
    expect(XIA_YIZHOU_REPLIES.high_favor).toContain(reply.text);
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

    expect(xiaReply.text).toBe('……戳我？那我也戳戳你。在心里。');
    expect(shenReply.text).toBe('……戳我？那我也戳戳你。在心里。');
  });

  it('stores the requested Xia Yizhou scene dialogue metadata', () => {
    expect(XIA_YIZHOU_DIALOGUES).toHaveLength(40);
    expect(XIA_YIZHOU_DIALOGUES.every((line) => line.trigger && line.emotion && line.note)).toBe(
      true,
    );
    expect(XIA_YIZHOU_DIALOGUES).toContainEqual({
      trigger: 'idle',
      weight: 5,
      emotion: '慵懒',
      dialogue: '又在发呆？……算了，我陪你一起发。',
      note: '待机基础台词',
    });
    expect(XIA_YIZHOU_DIALOGUES).toContainEqual({
      trigger: 'jealousy',
      weight: 3,
      emotion: '霸道',
      dialogue: '我不罩着你，难道还要别的人来？',
      note: '检测到用户搜索/打开其他桌宠相关内容',
    });
  });

  it('selects Xia Yizhou scene replies by weight ranges', () => {
    expect(selectCompanionReply('click', 0, 'xia-yizhou')).toMatchObject({
      category: 'click',
      text: '……戳我？那我也戳戳你。在心里。',
      emotion: '慵懒',
    });
    expect(selectCompanionReply('click', 8, 'xia-yizhou')).toMatchObject({
      category: 'click',
      text: '点这么准，平时没少练吧？',
      emotion: '调侃',
    });
    expect(selectCompanionReply('notification', 13, 'xia-yizhou')).toMatchObject({
      category: 'notification',
      text: '回得这么快，是重要的人？……我也是重要的人吧。',
      emotion: '吃醋',
    });
  });

  it('defaults companion profile lookup to Xia Yizhou for the independent build', () => {
    expect(DEFAULT_COMPANION_PROFILE_ID).toBe('xia-yizhou');
    expect(getCompanionProfile().id).toBe(DEFAULT_COMPANION_PROFILE_ID);
  });

  it('stores Shen Xinghui layered character setting on the profile', () => {
    const profile = getCompanionProfile('shen-xinghui');

    expect(profile.persona?.surface).toContain('表层：慵懒淡漠');
    expect(profile.persona?.middle).toContain('中层：温柔守护');
    expect(profile.persona?.deep).toContain('深层：孤独与执念');
    expect(profile.persona?.deep).toContain(
      '无论多少次，无论你在哪，我都会找到你。不是情话，是两百年的执念。',
    );
  });

  it('includes the requested Shen Xinghui scene reply banks', () => {
    expect(SHEN_XINGHUI_REPLIES.daily).toContain('……别动，让我再靠一会儿。你的肩膀比枕头舒服。');
    expect(SHEN_XINGHUI_REPLIES.care).toContain('又加班到这么晚？我陪你，反正星星也不睡觉。');
    expect(SHEN_XINGHUI_REPLIES.romance).toContain('宇宙很大，但我只想待在你的桌面上。');
    expect(SHEN_XINGHUI_REPLIES.lazy).toContain(
      '晚安。……不是对你说，是对我的睡眠模式说的。但你也可以一起睡。',
    );
    expect(SHEN_XINGHUI_REPLIES.drag).toContain('你要带我去哪？……算了，去哪都行。');
    expect(SHEN_XINGHUI_REPLIES.longIdle).toContain('……你忙完了吗？没忙完我也等你。');
    expect(SHEN_XINGHUI_REPLIES.message).toContain('去回消息吧，我在这儿，不会跟别人跑的。');
  });

  it('selects future Shen Xinghui scene replies with the same seeded helper', () => {
    expect(selectCompanionReply('drag', 0, 'shen-xinghui')).toEqual({
      category: 'drag',
      text: '你要带我去哪？……算了，去哪都行。',
    });
    expect(selectCompanionReply('message', 4, 'shen-xinghui')).toEqual({
      category: 'message',
      text: '去回消息吧，我在这儿，不会跟别人跑的。',
    });
  });

  it('falls back to core click replies when a profile lacks an optional scene bank', () => {
    expect(selectCompanionReply('drag', 0, 'shen-xinghui')).toEqual({
      category: 'drag',
      text: '你要带我去哪？……算了，去哪都行。',
    });
  });
});
