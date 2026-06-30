export type CompanionReplyCategory = 'click' | 'idle' | 'night' | 'secret' | 'done' | 'error';

export interface CompanionReply {
  category: CompanionReplyCategory;
  text: string;
}

export const XIA_YIZHOU_REPLIES: Record<CompanionReplyCategory, string[]> = {
  click: ['我在。', '怎么了？慢慢说。', '如果有什么心事，可以悄悄告诉我。'],
  idle: [
    '晒太阳是很舒服的事，身上会充满阳光的味道。',
    '最近没休息好？正好该午休了，和我一起补会觉。',
    '过几天会有一个太阳天，一起出去逛逛？',
    '现在已经错过朝霞了，不过晚上还有晚霞，到时候带你飞去天上看。',
  ],
  night: [
    '我不睡，是有报告要批，你不睡是准备埋伏流浪体？',
    '我回来后，你休息得比之前更好吗，还是更差？',
    '今天的床似乎对你的吸引力不够大。',
  ],
  secret: [
    '嘴巴都张开了，怎么又闭上了？记住，无论是什么事，都不要瞒着我。',
    '关于你的，我全都知道。',
    '妹妹。',
  ],
  done: ['好了，看看结果。', '不管什么身份，我都是那个能让你依靠的夏以昼。'],
  error: ['没关系，再试一次。', '这里出了点小问题。'],
};

export function selectCompanionReply(
  category: CompanionReplyCategory,
  seed = Date.now(),
): CompanionReply {
  const replies = XIA_YIZHOU_REPLIES[category];
  const index = positiveModulo(Math.floor(seed), replies.length);
  return { category, text: replies[index] ?? replies[0] ?? '' };
}

export function categoryForInteraction(input: {
  now: Date;
  clickCount: number;
}): CompanionReplyCategory {
  if (input.clickCount >= 4) return 'secret';
  const hour = input.now.getHours();
  if (hour >= 22 || hour < 6) return 'night';
  return 'click';
}

function positiveModulo(value: number, divisor: number): number {
  if (divisor <= 0) return 0;
  return ((value % divisor) + divisor) % divisor;
}
