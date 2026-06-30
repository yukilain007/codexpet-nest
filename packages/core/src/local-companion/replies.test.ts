import { describe, expect, it } from 'vitest';
import { XIA_YIZHOU_REPLIES, categoryForInteraction, selectCompanionReply } from './replies';

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
        now: new Date('2026-06-30T12:00:00+08:00'),
        clickCount: 4,
      }),
    ).toBe('secret');
  });

  it('uses night mode late at night before ordinary click replies', () => {
    expect(
      categoryForInteraction({
        now: new Date('2026-06-30T23:30:00+08:00'),
        clickCount: 1,
      }),
    ).toBe('night');
  });

  it('uses click mode during daytime ordinary clicks', () => {
    expect(
      categoryForInteraction({
        now: new Date('2026-06-30T15:30:00+08:00'),
        clickCount: 1,
      }),
    ).toBe('click');
  });
});
