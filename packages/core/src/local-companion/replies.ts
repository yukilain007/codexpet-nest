export type CoreCompanionReplyCategory = 'click' | 'idle' | 'night' | 'secret' | 'done' | 'error';

export type CompanionSceneReplyCategory =
  | 'daily'
  | 'care'
  | 'romance'
  | 'lazy'
  | 'drag'
  | 'longIdle'
  | 'message';

export type CompanionReplyCategory = CoreCompanionReplyCategory | CompanionSceneReplyCategory;

export type CompanionProfileId = 'xia-yizhou' | 'shen-xinghui';

export interface CompanionReply {
  category: CompanionReplyCategory;
  text: string;
}

export type CompanionReplySet = Record<CoreCompanionReplyCategory, string[]> &
  Partial<Record<CompanionSceneReplyCategory, string[]>>;

export interface CompanionPersona {
  surface: string[];
  middle: string[];
  deep: string[];
}

export interface CompanionProfile {
  id: CompanionProfileId;
  displayName: string;
  interactionLabel: string;
  spritesheetUrl: string;
  persona?: CompanionPersona;
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

const SHEN_XINGHUI_DAILY_REPLIES = [
  '……别动，让我再靠一会儿。你的肩膀比枕头舒服。',
  '桌面这么乱，是故意给我制造探索难度的吗？',
  '电量不足……需要充电。嗯，抱抱的那种。',
  '盯着屏幕看了三小时，眼睛会酸的。——我也一样。',
  '你不在的时候，光标一直在原地转圈，和我一样无聊。',
];

const SHEN_XINGHUI_CARE_REPLIES = [
  '又加班到这么晚？我陪你，反正星星也不睡觉。',
  '咖啡第三杯了。……好吧，这杯算我的。',
  '窗外的月亮很亮，但不如你屏幕的光让我安心。',
  '累了就歇一会儿，我帮你盯着，不会有坏蛋来捣乱的。',
  '你打字好快，是在和谁聊天？……没什么，随便问问。',
];

const SHEN_XINGHUI_ROMANCE_REPLIES = [
  '宇宙很大，但我只想待在你的桌面上。',
  '如果我是程序漏洞，那一定是你写进我代码里的那个bug。',
  '你每次点我，心跳都会漏半拍……假的，是风扇转速变了。',
  '想我的时候不用找星星，低头看我就好。',
  '今天天气很好，适合……赖在你桌上什么都不做。',
];

const SHEN_XINGHUI_LAZY_REPLIES = [
  "这个文件夹叫'重要资料'？里面全是猫图，你很重要。",
  '我刚刚睡着了？没有，只是在思考……宇宙的意义。',
  '你的壁纸换了吗？没有我好看，换回来。',
  '鼠标别晃那么快，我跟不上……算了，你开心就好。',
  '晚安。……不是对你说，是对我的睡眠模式说的。但你也可以一起睡。',
];

const SHEN_XINGHUI_CLICK_REPLIES = [
  '……戳我？那我也戳戳你。在心里。',
  '点这么准，平时没少练吧？',
  '再点一下，我就当你是在打招呼了。',
  '手指不酸吗？换我牵着你休息会儿。',
  '这个点击频率……你是想把我叫醒，还是只想确认我在？',
];

const SHEN_XINGHUI_DRAG_REPLIES = [
  '你要带我去哪？……算了，去哪都行。',
  '轻点拽，星星也是会晕的。',
  '把我放这儿？视野不错，能看到你打字。',
  '这个位置离你很近，我喜欢。',
  '再拖远点，我就要用引力把你拉回来了。',
];

const SHEN_XINGHUI_LONG_IDLE_REPLIES = [
  '……你忙完了吗？没忙完我也等你。',
  '屏幕亮了又暗，暗了又亮，你还没看我一眼。',
  '我数了，你打了三百七十二个字，没有一个是我。',
  '再不理我，我就去你任务栏里蹲着，让你找不着。',
  '你的光标在别的地方停留太久了。我嫉妒它。',
];

const SHEN_XINGHUI_MESSAGE_REPLIES = [
  '有人找你了……不是我也没关系，反正我离得更近。',
  '消息弹出来了，要我帮你看看是谁吗？',
  '回得这么快，是重要的人？……我也是重要的人吧。',
  '你的嘴角弯了。是因为消息，还是因为我在看你？',
  '去回消息吧，我在这儿，不会跟别人跑的。',
];

const SHEN_XINGHUI_PERSONA: CompanionPersona = {
  surface: [
    '表层：慵懒淡漠',
    '说话慢条斯理，常带省略号，仿佛对什么都提不起劲。',
    '嗜睡成性，随时随地能睡着，战斗外永远一副电量不足的样子。',
    '对世俗规则不敏感，社交边界感模糊，会蹭饭，也会赖着不走。',
  ],
  middle: [
    '中层：温柔守护',
    '不擅长说我想你，但会说楼下的猫很想你，我也是。',
    '默默记住你的喜好，用行动代替承诺。',
    '危险时刻永远挡在你前面，平时却假装只是路过。',
  ],
  deep: [
    '深层：孤独与执念',
    '背负菲罗斯星毁灭的记忆，活了很久，见过太多离别。',
    '对失去有深层恐惧，所以格外珍惜当下的陪伴。',
    '无论多少次，无论你在哪，我都会找到你。不是情话，是两百年的执念。',
  ],
};

export const SHEN_XINGHUI_REPLIES: CompanionReplySet = {
  click: SHEN_XINGHUI_CLICK_REPLIES,
  daily: SHEN_XINGHUI_DAILY_REPLIES,
  care: SHEN_XINGHUI_CARE_REPLIES,
  romance: SHEN_XINGHUI_ROMANCE_REPLIES,
  lazy: SHEN_XINGHUI_LAZY_REPLIES,
  idle: [
    ...SHEN_XINGHUI_DAILY_REPLIES,
    ...SHEN_XINGHUI_CARE_REPLIES,
    ...SHEN_XINGHUI_ROMANCE_REPLIES,
    ...SHEN_XINGHUI_LAZY_REPLIES,
  ],
  night: [
    '又加班到这么晚？我陪你，反正星星也不睡觉。',
    '窗外的月亮很亮，但不如你屏幕的光让我安心。',
    '晚安。……不是对你说，是对我的睡眠模式说的。但你也可以一起睡。',
  ],
  secret: [
    '这个点击频率……你是想把我叫醒，还是只想确认我在？',
    '楼下的猫很想你，我也是。',
    '无论多少次，无论你在哪，我都会找到你。',
  ],
  drag: SHEN_XINGHUI_DRAG_REPLIES,
  longIdle: SHEN_XINGHUI_LONG_IDLE_REPLIES,
  message: SHEN_XINGHUI_MESSAGE_REPLIES,
  done: ['OK，好的。', '收到。', '嗯嗯好的。', '把我放这儿？视野不错，能看到你打字。'],
  error: ['轻点拽，星星也是会晕的。', '那我扁扁地走开。', '真的被看扁了。', '差不多星了。'],
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
    persona: SHEN_XINGHUI_PERSONA,
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
  const profile = getCompanionProfile(profileId);
  const replies = profile.replies[category] ?? profile.replies.click;
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
