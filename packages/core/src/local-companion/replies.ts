export type CompanionReplyCategory = 'click' | 'idle' | 'night' | 'secret' | 'done' | 'error';

export type CompanionProfileId = 'xia-yizhou' | 'shen-xinghui';

export interface CompanionReply {
  category: CompanionReplyCategory;
  text: string;
}

export type CompanionReplySet = Record<CompanionReplyCategory, string[]>;

export interface CompanionProfile {
  id: CompanionProfileId;
  displayName: string;
  interactionLabel: string;
  spritesheetUrl: string;
  replies: CompanionReplySet;
}

export const XIA_YIZHOU_REPLIES: CompanionReplySet = {
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

export const SHEN_XINGHUI_REPLIES: CompanionReplySet = {
  click: ['真的被看扁了。', '嗯嗯好的。', '差不多星了。'],
  idle: [
    '虽然什么都没干，但今天也真是辛苦我了呢。',
    '今天一定要努力工作。',
    '吃又吃不饱，睡又睡不醒。',
  ],
  night: ['睡又睡不醒。', '今天的任务响应率可能只有0.7%。', '再不睡，我也要困扁了。'],
  secret: ['你少看扁我。', '那我扁扁地走开。', '如果你惹毛了我，那我就毛茸茸地走开。'],
  done: ['OK，好的。', '收到。', '嗯嗯好的。'],
  error: ['那我扁扁地走开。', '真的被看扁了。', '差不多星了。'],
};

export const DEFAULT_COMPANION_PROFILE_ID: CompanionProfileId = 'shen-xinghui';

export const COMPANION_PROFILES: Record<CompanionProfileId, CompanionProfile> = {
  'xia-yizhou': {
    id: 'xia-yizhou',
    displayName: '夏以昼',
    interactionLabel: '和夏以昼互动',
    spritesheetUrl: '/pets/xia-yizhou/spritesheet.webp',
    replies: XIA_YIZHOU_REPLIES,
  },
  'shen-xinghui': {
    id: 'shen-xinghui',
    displayName: '沈星回猫猫',
    interactionLabel: '和沈星回互动',
    spritesheetUrl: '/pets/shen-xinghui/spritesheet.webp',
    replies: SHEN_XINGHUI_REPLIES,
  },
};

export function getCompanionProfile(
  id: CompanionProfileId = DEFAULT_COMPANION_PROFILE_ID,
): CompanionProfile {
  return COMPANION_PROFILES[id];
}

export function selectCompanionReply(
  category: CompanionReplyCategory,
  seed = Date.now(),
  profileId: CompanionProfileId = 'xia-yizhou',
): CompanionReply {
  const replies = getCompanionProfile(profileId).replies[category];
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
