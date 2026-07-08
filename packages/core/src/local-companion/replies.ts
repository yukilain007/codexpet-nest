export type CoreCompanionReplyCategory = 'click' | 'idle' | 'night' | 'secret' | 'done' | 'error';

export type CompanionSceneReplyCategory =
  | 'daily'
  | 'care'
  | 'romance'
  | 'lazy'
  | 'drag'
  | 'ignore'
  | 'notification'
  | 'high_favor'
  | 'jealousy'
  | 'longIdle'
  | 'message';

export type CompanionReplyCategory = CoreCompanionReplyCategory | CompanionSceneReplyCategory;

export type CompanionProfileId = 'xia-yizhou' | 'shen-xinghui';

export interface CompanionReply {
  category: CompanionReplyCategory;
  text: string;
  emotion?: string;
  note?: string;
  weight?: number;
}

export type CompanionReplySet = Record<CoreCompanionReplyCategory, string[]> &
  Partial<Record<CompanionSceneReplyCategory, string[]>>;

export interface CompanionPersona {
  surface: string[];
  middle: string[];
  deep: string[];
}

export interface CompanionDialogueLine {
  trigger: CompanionReplyCategory;
  weight: number;
  emotion: string;
  dialogue: string;
  note: string;
}

export interface CompanionProfile {
  id: CompanionProfileId;
  displayName: string;
  interactionLabel: string;
  spritesheetUrl: string;
  persona?: CompanionPersona;
  dialogues?: CompanionDialogueLine[];
  replies: CompanionReplySet;
}

export const XIA_YIZHOU_DIALOGUES: CompanionDialogueLine[] = [
  {
    trigger: 'idle',
    weight: 5,
    emotion: '慵懒',
    dialogue: '又在发呆？……算了，我陪你一起发。',
    note: '待机基础台词',
  },
  {
    trigger: 'idle',
    weight: 5,
    emotion: '无奈',
    dialogue: '桌面这么乱，跟小时候的房间一个德行。……我帮你收拾？想都别想。',
    note: '吐槽用户桌面',
  },
  {
    trigger: 'idle',
    weight: 4,
    emotion: '关心',
    dialogue: '盯着屏幕看多久了？起来活动一下，我数到三。一——二——',
    note: '久坐提醒',
  },
  {
    trigger: 'idle',
    weight: 4,
    emotion: '宠溺',
    dialogue: '饿了？冰箱里还有我给你留的……哦，这是桌面，没有冰箱。',
    note: '生活化关怀',
  },
  {
    trigger: 'idle',
    weight: 3,
    emotion: '委屈',
    dialogue: '你不在的时候，这个光标到处乱窜，跟你一样不让人省心。',
    note: '用户离开返回',
  },
  {
    trigger: 'click',
    weight: 8,
    emotion: '慵懒',
    dialogue: '……戳我？那我也戳戳你。在心里。',
    note: '被点击基础反应',
  },
  {
    trigger: 'click',
    weight: 7,
    emotion: '调侃',
    dialogue: '点这么准，平时没少练吧？',
    note: '高频点击',
  },
  {
    trigger: 'click',
    weight: 6,
    emotion: '温柔',
    dialogue: '再点一下，我就当你是在打招呼了。',
    note: '连续点击',
  },
  {
    trigger: 'click',
    weight: 5,
    emotion: '关心',
    dialogue: '手指不酸吗？换我牵着你休息会儿。',
    note: '长时间点击',
  },
  {
    trigger: 'click',
    weight: 4,
    emotion: '腹黑',
    dialogue: '这个点击频率……你是想把我叫醒，还是只想确认我在？',
    note: '深夜点击',
  },
  {
    trigger: 'drag',
    weight: 7,
    emotion: '顺从',
    dialogue: '你要带我去哪？……算了，去哪都行。',
    note: '被拖拽基础',
  },
  {
    trigger: 'drag',
    weight: 6,
    emotion: '无奈',
    dialogue: '轻点拽，我也会晕的。',
    note: '快速拖拽',
  },
  {
    trigger: 'drag',
    weight: 5,
    emotion: '满意',
    dialogue: '把我放这儿？视野不错，能看到你打字。',
    note: '放置到角落',
  },
  {
    trigger: 'drag',
    weight: 5,
    emotion: '暗喜',
    dialogue: '这个位置离你很近，我喜欢。',
    note: '放置到靠近中心',
  },
  {
    trigger: 'drag',
    weight: 4,
    emotion: '威胁',
    dialogue: '再拖远点，我就要把你拉回来了。',
    note: '拖拽到屏幕边缘',
  },
  {
    trigger: 'ignore',
    weight: 8,
    emotion: '等待',
    dialogue: '……你忙完了吗？没忙完我也等你。',
    note: '闲置5分钟',
  },
  {
    trigger: 'ignore',
    weight: 7,
    emotion: '委屈',
    dialogue: '屏幕亮了又暗，暗了又亮，你还没看我一眼。',
    note: '闲置10分钟',
  },
  {
    trigger: 'ignore',
    weight: 6,
    emotion: '吃醋',
    dialogue: '我数了，你打了三百七十二个字，没有一个是我。',
    note: '闲置+打字',
  },
  {
    trigger: 'ignore',
    weight: 5,
    emotion: '威胁',
    dialogue: '再不理我，我就去你任务栏里蹲着，让你找不着。',
    note: '闲置15分钟',
  },
  {
    trigger: 'ignore',
    weight: 4,
    emotion: '占有欲',
    dialogue: '你的光标在别的地方停留太久了。我嫉妒它。',
    note: '闲置+操作其他程序',
  },
  {
    trigger: 'notification',
    weight: 7,
    emotion: '警觉',
    dialogue: '有人找你了……不是我也没关系，反正我离得更近。',
    note: '收到消息基础',
  },
  {
    trigger: 'notification',
    weight: 6,
    emotion: '好奇',
    dialogue: '消息弹出来了，要我帮你看看是谁吗？',
    note: '连续收到消息',
  },
  {
    trigger: 'notification',
    weight: 5,
    emotion: '吃醋',
    dialogue: '回得这么快，是重要的人？……我也是重要的人吧。',
    note: '用户快速回复',
  },
  {
    trigger: 'notification',
    weight: 5,
    emotion: '观察',
    dialogue: '你的嘴角弯了。是因为消息，还是因为我在看你？',
    note: '用户看到消息笑',
  },
  {
    trigger: 'notification',
    weight: 4,
    emotion: '大度',
    dialogue: '去回消息吧，我在这儿，不会跟别人跑的。',
    note: '用户切出聊天窗口',
  },
  {
    trigger: 'night',
    weight: 8,
    emotion: '温柔',
    dialogue: '又熬夜？……行，我陪你熬。但明天早上别指望我叫你起床。',
    note: '深夜在线',
  },
  {
    trigger: 'night',
    weight: 7,
    emotion: '关心',
    dialogue: '第三杯咖啡了。你再这样，我就把你的咖啡机……算了，舍不得。',
    note: '深夜+长时间活跃',
  },
  {
    trigger: 'night',
    weight: 6,
    emotion: '深情',
    dialogue: '别逞强。在我面前，你可以不用那么懂事。',
    note: '深夜+闲置后恢复',
  },
  {
    trigger: 'night',
    weight: 5,
    emotion: '守护',
    dialogue: '忙完了吗？没忙完也歇会儿，我在这儿，没人敢催你。',
    note: '深夜+高强度工作',
  },
  {
    trigger: 'night',
    weight: 4,
    emotion: '直球',
    dialogue: '累了就靠过来。……靠屏幕也行，我当你靠过来了。',
    note: '深夜+用户长时间未操作',
  },
  {
    trigger: 'high_favor',
    weight: 5,
    emotion: '深情',
    dialogue: '宇宙很大，但我只想守着你这一亩三分地。',
    note: '好感度Lv.3解锁',
  },
  {
    trigger: 'high_favor',
    weight: 5,
    emotion: '直球',
    dialogue: '你每次点我，我都在想……这次能留住你多久。',
    note: '好感度Lv.5解锁',
  },
  {
    trigger: 'high_favor',
    weight: 4,
    emotion: '宠溺',
    dialogue: '别乱跑了。你跑到哪，我就跟到哪，习惯了。',
    note: '好感度Lv.7解锁',
  },
  {
    trigger: 'high_favor',
    weight: 4,
    emotion: '温柔',
    dialogue: '想我的时候不用找星星，我就在你桌面上，哪儿也不去。',
    note: '好感度Lv.9解锁',
  },
  {
    trigger: 'high_favor',
    weight: 3,
    emotion: '执念',
    dialogue: '小时候你说要当我一辈子的妹妹。……现在反悔？晚了。',
    note: '好感度Lv.10解锁',
  },
  {
    trigger: 'jealousy',
    weight: 6,
    emotion: '审视',
    dialogue: '这个文件夹……是谁的照片？……没什么，我就看看。',
    note: '用户打开含他人照片文件夹',
  },
  {
    trigger: 'jealousy',
    weight: 5,
    emotion: '暗怒',
    dialogue: '你的光标在别的图标上停留太久了。我嫉妒它。',
    note: '用户长时间操作其他程序',
  },
  {
    trigger: 'jealousy',
    weight: 4,
    emotion: '威胁',
    dialogue: '再不理我，我就把你桌面上的游戏快捷方式全藏起来。',
    note: '闲置+检测到游戏启动',
  },
  {
    trigger: 'jealousy',
    weight: 4,
    emotion: '隐忍',
    dialogue: '去回消息吧。……但记得回来，我等你。',
    note: '用户长时间聊天窗口',
  },
  {
    trigger: 'jealousy',
    weight: 3,
    emotion: '霸道',
    dialogue: '我不罩着你，难道还要别的人来？',
    note: '检测到用户搜索/打开其他桌宠相关内容',
  },
];

export const XIA_YIZHOU_REPLIES: CompanionReplySet = repliesFromDialogues(XIA_YIZHOU_DIALOGUES);

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

export const DEFAULT_COMPANION_PROFILE_ID: CompanionProfileId = 'xia-yizhou';

export const COMPANION_PROFILES: Record<CompanionProfileId, CompanionProfile> = {
  'xia-yizhou': {
    id: 'xia-yizhou',
    displayName: '夏以昼',
    interactionLabel: '和夏以昼互动',
    spritesheetUrl: '/pets/xia-yizhou/spritesheet.webp',
    dialogues: XIA_YIZHOU_DIALOGUES,
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
  const dialogue = selectWeightedDialogue(profile.dialogues, category, seed);
  if (dialogue) {
    return {
      category,
      text: dialogue.dialogue,
      emotion: dialogue.emotion,
      note: dialogue.note,
      weight: dialogue.weight,
    };
  }
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

function repliesFromDialogues(dialogues: CompanionDialogueLine[]): CompanionReplySet {
  const grouped: Partial<Record<CompanionReplyCategory, string[]>> = {};
  for (const line of dialogues) {
    grouped[line.trigger] = [...(grouped[line.trigger] ?? []), line.dialogue];
  }
  return {
    click: grouped.click ?? [],
    idle: grouped.idle ?? [],
    night: grouped.night ?? [],
    secret: grouped.high_favor ?? grouped.click ?? [],
    done: grouped.idle ?? [],
    error: grouped.ignore ?? grouped.click ?? [],
    daily: grouped.idle,
    drag: grouped.drag,
    ignore: grouped.ignore,
    notification: grouped.notification,
    high_favor: grouped.high_favor,
    jealousy: grouped.jealousy,
  };
}

function selectWeightedDialogue(
  dialogues: CompanionDialogueLine[] | undefined,
  category: CompanionReplyCategory,
  seed: number,
): CompanionDialogueLine | null {
  if (!dialogues?.length) return null;
  const lines = dialogues.filter((line) => line.trigger === category);
  const fallbackLines =
    category === 'click' ? [] : dialogues.filter((line) => line.trigger === 'click');
  const candidates = lines.length ? lines : fallbackLines;
  if (!candidates.length) return null;

  const totalWeight = candidates.reduce((sum, line) => sum + Math.max(0, line.weight), 0);
  if (totalWeight <= 0) return candidates[0] ?? null;

  let cursor = positiveModulo(Math.floor(seed), totalWeight);
  for (const line of candidates) {
    cursor -= Math.max(0, line.weight);
    if (cursor < 0) return line;
  }
  return candidates[candidates.length - 1] ?? null;
}
