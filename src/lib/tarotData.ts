import { ReactNode } from "react";

export type AudioCategory = "healing" | "energetic" | "meditation" | "melancholic";

export interface TarotCard {
  id: string;
  name: string;
  category: "major" | "minor";
  audioCategory: AudioCategory;
  upright: {
    meaning: string;
    guidance: string;
  };
  reversed: {
    meaning: string;
    guidance: string;
  };
}

// 稳定免费占位音频 URLs
export const AUDIO_TRACKS: Record<AudioCategory, string> = {
  healing: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  energetic: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  meditation: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  melancholic: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
};

// 构造 22 张大阿卡纳
const majorArcana: TarotCard[] = [
  { id: "M00", name: "0. 愚者 (The Fool)", category: "major", audioCategory: "energetic", upright: { meaning: "无限可能，随心而动", guidance: "带着轻盈的心去尝试新事物，不要害怕犯错。" }, reversed: { meaning: "鲁莽冲动，方向迷失", guidance: "停下来深呼吸，确认落脚点再起跳。" } },
  { id: "M01", name: "I. 魔术师 (The Magician)", category: "major", audioCategory: "energetic", upright: { meaning: "展现才华，掌控资源", guidance: "你拥有成功所需的一切，现在是你表现的时机。" }, reversed: { meaning: "才华受阻，信心不足", guidance: "相信自己内在的光芒，不要被暂时的阴霾遮挡。" } },
  { id: "M02", name: "II. 女祭司 (The High Priestess)", category: "major", audioCategory: "meditation", upright: { meaning: "直觉敏锐，静待花开", guidance: "倾听内心的声音，答案已经在你的感受里。" }, reversed: { meaning: "忽视直觉，表面焦虑", guidance: "给自己一点独处的时间，静坐去体会真实的自己。" } },
  { id: "M03", name: "III. 皇后 (The Empress)", category: "major", audioCategory: "healing", upright: { meaning: "丰盛，孕育，被爱包围", guidance: "拥抱当下的温暖，你完全值得被温柔对待。" }, reversed: { meaning: "过度付出，情绪匮乏", guidance: "把照顾他人的精力分给自己一点，先滋养你自己的心。" } },
  { id: "M04", name: "IV. 皇帝 (The Emperor)", category: "major", audioCategory: "meditation", upright: { meaning: "秩序，保护，建立规则", guidance: "建立起生活的节奏感，用理性的力量去守护你珍视的人事物。" }, reversed: { meaning: "固执己见，压力过载", guidance: "试着放下完美的执念，偶尔的柔软并非软弱。" } },
  { id: "M05", name: "V. 教皇 (The Hierophant)", category: "major", audioCategory: "meditation", upright: { meaning: "传统，信仰，指路明灯", guidance: "遵循前人的智慧，或寻找能带给你共鸣的引导者。" }, reversed: { meaning: "打破教条，墨守成规", guidance: "勇敢地表达与众不同的观点，你是自由的。" } },
  { id: "M06", name: "VI. 恋人 (The Lovers)", category: "major", audioCategory: "healing", upright: { meaning: "共鸣，选择，纯粹的爱", guidance: "遵从内心的喜爱去做选择，哪怕这条路暂时看不清结果。" }, reversed: { meaning: "关系内耗，犹豫不决", guidance: "与其讨好世界，不如先讨好那个在镜子里的自己。" } },
  { id: "M07", name: "VII. 战车 (The Chariot)", category: "major", audioCategory: "energetic", upright: { meaning: "勇往直前，自我掌控", guidance: "带着你的信念全速前进吧，哪怕带着些许伤痛。" }, reversed: { meaning: "冲突加剧，方向失控", guidance: "休息一下，不需要为了证明什么而耗尽自己。" } },
  { id: "M08", name: "VIII. 力量 (Strength)", category: "major", audioCategory: "healing", upright: { meaning: "似水柔情，克服恐惧", guidance: "温柔是最强大的力量，用包容去化解眼前的难题。" }, reversed: { meaning: "内在怀疑，自我否定", guidance: "允许自己有软弱的时刻，不必时刻假装坚强。" } },
  { id: "M09", name: "IX. 隐士 (The Hermit)", category: "major", audioCategory: "meditation", upright: { meaning: "向内探索，智慧光芒", guidance: "这正是你沉淀发光的好时光，不要害怕孤独。" }, reversed: { meaning: "社交孤立，困于迷局", guidance: "试着走出房门感受风的温度，向信任的人倾诉。" } },
  { id: "M10", name: "X. 命运之轮 (Wheel of Fortune)", category: "major", audioCategory: "energetic", upright: { meaning: "转变降临，顺势而为", guidance: "好运正在悄然转向你，接纳一切随机的发生。" }, reversed: { meaning: "抗拒变化，运气停滞", guidance: "低谷期是用来积蓄能量的，黑夜之后就是黎明。" } },
  { id: "M11", name: "XI. 正义 (Justice)", category: "major", audioCategory: "meditation", upright: { meaning: "平衡，公平，理性裁决", guidance: "理清当下的头绪，你的每一份努力都会得到公正的回报。" }, reversed: { meaning: "失衡，偏见，委屈埋怨", guidance: "不要陷入“为什么是我”的受害者陷阱中跳脱出来看一看全局吧~" } },
  { id: "M12", name: "XII. 倒吊人 (The Hanged Man)", category: "major", audioCategory: "melancholic", upright: { meaning: "换个视角，静静等待", guidance: "也许慢下来才是最快的方法，享受倒过来看世界的奇异感吧。" }, reversed: { meaning: "无谓牺牲，徒劳挣扎", guidance: "如果在一段关系或事情里感到消耗，是时候剪断绳索了。" } },
  { id: "M13", name: "XIII. 死神 (Death)", category: "major", audioCategory: "melancholic", upright: { meaning: "结束与新生，彻底改变", guidance: "勇敢告别旧的壳，你正在长出更美丽的翅膀。" }, reversed: { meaning: "恋恋不舍，拒绝结束", guidance: "紧抓住枯叶不放，春天的嫩芽又怎能长出呢？" } },
  { id: "M14", name: "XIV. 节制 (Temperance)", category: "major", audioCategory: "meditation", upright: { meaning: "调和，疗愈，内心的炼金术", guidance: "把不同的情绪和元素融合，你会找到那首属于你的平静之歌。" }, reversed: { meaning: "情绪失调，走向极端", guidance: "给自己泡杯茶，闭上眼睛听十分钟喜欢的音乐吧。" } },
  { id: "M15", name: "XV. 恶魔 (The Devil)", category: "major", audioCategory: "melancholic", upright: { meaning: "诱惑，束缚，物质欲望", guidance: "看看困住你的那条锁链，也许它根本没有锁上。" }, reversed: { meaning: "挣脱枷锁，重获自由", guidance: "恭喜你正在觉醒，你比想象中拥有更多的选择权。" } },
  { id: "M16", name: "XVI. 高塔 (The Tower)", category: "major", audioCategory: "melancholic", upright: { meaning: "突如其来的崩塌，打破幻象", guidance: "不用害怕闪电，它是为了照亮你重建真实的地基。" }, reversed: { meaning: "隐患未除，内心危机感", guidance: "与其提心吊胆等待暴风雨，不如主动打开窗户吹吹风。" } },
  { id: "M17", name: "XVII. 星星 (The Star)", category: "major", audioCategory: "healing", upright: { meaning: "希望，灵感，和平宁静", guidance: "黑夜里总有星光在为你闪烁，一切都会好起来的。" }, reversed: { meaning: "希望落空，灵感干涸", guidance: "不要因为一朵云遮住了天空，就忘记了星空的存在。" } },
  { id: "M18", name: "XVIII. 月亮 (The Moon)", category: "major", audioCategory: "melancholic", upright: { meaning: "潜意识，梦境，潜藏的恐惧", guidance: "去拥抱潜意识里的阴影，你会找到那把金钥匙。" }, reversed: { meaning: "迷乱消散，逐渐清醒", guidance: "拨开云雾见月明，那些虚幻的恐惧正在离你远去。" } },
  { id: "M19", name: "XIX. 太阳 (The Sun)", category: "major", audioCategory: "energetic", upright: { meaning: "快乐，成功，充满活力", guidance: "像孩子一样去奔跑吧，今天的你无比耀眼。" }, reversed: { meaning: "快乐被遮挡，活力减弱", guidance: "太阳只是暂时落山，明天它依然会为你升起。" } },
  { id: "M20", name: "XX. 审判 (Judgement)", category: "major", audioCategory: "energetic", upright: { meaning: "觉醒，原谅，呼唤新生", guidance: "听从内心的召唤，去拥抱那个重获新生的自己吧。" }, reversed: { meaning: "自我谴责，拒绝改变", guidance: "原谅过去的自己，你已经做得足够好了。" } },
  { id: "M21", name: "XXI. 世界 (The World)", category: "major", audioCategory: "healing", upright: { meaning: "圆满，完成，踏上新起点", guidance: "为过去的阶段画上圆满句号，准备迎接更广阔的天地。" }, reversed: { meaning: "停滞不前，缺乏收尾", guidance: "还差最后一点点努力，去把那个不完美的句号画圆吧。" } },
];

// 生成 56 张小阿卡纳
const generateMinorArcana = (): TarotCard[] => {
  const suits = [
    { name: "权杖 (Wands)", suitStr: "wands" as const, audio: "energetic" as AudioCategory, theme: "行动与热情" },
    { name: "圣杯 (Cups)", suitStr: "cups" as const, audio: "healing" as AudioCategory, theme: "情感与爱" },
    { name: "宝剑 (Swords)", suitStr: "swords" as const, audio: "melancholic" as AudioCategory, theme: "理智与反思" },
    { name: "星币 (Pentacles)", suitStr: "pentacles" as const, audio: "meditation" as AudioCategory, theme: "物质与沉稳" },
  ];
  
  const cards: TarotCard[] = [];
  
  suits.forEach((suit) => {
    const ranks = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"];
    ranks.forEach((rank) => {
      cards.push({
        id: `Min_${suit.suitStr}_${rank}`,
        name: `${suit.name} ${rank}`,
        category: "minor",
        audioCategory: suit.audio,
        upright: {
          meaning: `顺畅的${suit.theme}`,
          guidance: `围绕着${suit.theme}，现在的能量正在稳步流动，保持相信的姿态。`
        },
        reversed: {
          meaning: `受阻的${suit.theme}`,
          guidance: `这方面的能量暂时打了个结，没关系，慢慢理顺它，不用急着证明什么。`
        }
      });
    });
  });
  return cards;
};

// 78张标准牌库
export const FULL_TAROT_DECK: TarotCard[] = [...majorArcana, ...generateMinorArcana()];

/** Basenames match image files in `public/tarot cards/` (same stems as the bundled .txt files). */
const MAJOR_IMAGE_BASENAMES: string[] = [
  "0愚人",
  "1魔术师",
  "3女祭司",
  "2女皇",
  "4皇帝",
  "5教皇",
  "6恋人",
  "7战车",
  "8力量",
  "9隐士",
  "10命运之轮",
  "11正义",
  "12倒吊人",
  "13死神",
  "14节制",
  "15恶魔",
  "16高塔",
  "17星星",
  "18月亮",
  "19太阳",
  "20审判",
  "21世界",
];

const MINOR_RANK_ORDER = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"] as const;

function minorRankFileSuffix(rank: string): string {
  if (rank === "Ace") return "王牌";
  if (rank === "Page") return "侍者";
  if (rank === "Knight") return "骑士";
  if (rank === "Queen") return "女王";
  if (rank === "King") return "国王";
  return rank;
}

/** File numbering in `tarot cards/`: 宝剑 22–35, 权杖 36–49, 圣杯 50–63, 星币 64–77 */
const MINOR_SUIT_FILE: Record<string, { start: number; cn: string }> = {
  wands: { start: 36, cn: "权杖" },
  cups: { start: 50, cn: "圣杯" },
  swords: { start: 22, cn: "宝剑" },
  pentacles: { start: 64, cn: "星币" },
};

export function getCardImageBasename(id: string): string {
  if (id.startsWith("M")) {
    const i = parseInt(id.slice(1), 10);
    if (i >= 0 && i < MAJOR_IMAGE_BASENAMES.length) return MAJOR_IMAGE_BASENAMES[i];
    return MAJOR_IMAGE_BASENAMES[0];
  }
  const parts = id.split("_");
  const suit = parts[1];
  const rank = parts[2];
  const conf = MINOR_SUIT_FILE[suit];
  const rankIdx = MINOR_RANK_ORDER.indexOf(rank as (typeof MINOR_RANK_ORDER)[number]);
  if (!conf || rankIdx < 0) return MAJOR_IMAGE_BASENAMES[0];
  const num = conf.start + rankIdx;
  return `${num}${conf.cn}${minorRankFileSuffix(rank)}`;
}

export function getCardImageUrl(id: string): string {
  const basename = getCardImageBasename(id);
  return `/tarot%20cards/${encodeURIComponent(basename)}.jpg`;
}

/** Minor suits in on-disk order: 宝剑 22–35, 权杖 36–49, 圣杯 50–63, 星币 64–77 */
const FAN_MINOR_SUITS_ORDER = ["swords", "wands", "cups", "pentacles"] as const;

function buildFullTarotDeckByFileSlot(): TarotCard[] {
  const byId = new Map(FULL_TAROT_DECK.map((c) => [c.id, c]));
  const out: TarotCard[] = [];
  for (let m = 0; m < 22; m++) {
    const id = `M${String(m).padStart(2, "0")}`;
    const c = byId.get(id);
    if (!c) throw new Error(`[tarot] missing major ${id}`);
    out.push(c);
  }
  for (const suit of FAN_MINOR_SUITS_ORDER) {
    for (const rank of MINOR_RANK_ORDER) {
      const id = `Min_${suit}_${rank}`;
      const c = byId.get(id);
      if (!c) throw new Error(`[tarot] missing minor ${id}`);
      out.push(c);
    }
  }
  if (out.length !== FULL_TAROT_DECK.length) {
    throw new Error(`[tarot] expected ${FULL_TAROT_DECK.length} file-slot cards, got ${out.length}`);
  }
  return out;
}

/** `public/tarot cards/` numbering 0愚人 … 77星币国王 — fan index `i` maps to this deck order. */
export const FULL_TAROT_DECK_BY_FILE_SLOT: readonly TarotCard[] = buildFullTarotDeckByFileSlot();

/** Standard deck / single-tarot fan slot count (78). Always equals `FULL_TAROT_DECK_BY_FILE_SLOT.length`. */
export const TAROT_FAN_SLOT_COUNT = FULL_TAROT_DECK_BY_FILE_SLOT.length;

export function getTarotCardForFanSlot(slotIndex: number): TarotCard {
  if (slotIndex < 0 || slotIndex >= FULL_TAROT_DECK_BY_FILE_SLOT.length) {
    return FULL_TAROT_DECK_BY_FILE_SLOT[0];
  }
  return FULL_TAROT_DECK_BY_FILE_SLOT[slotIndex];
}

/** Fisher–Yates shuffle: a permutation of 0..77 — `order[i]` is deck index at visual fan slot `i`. */
export function createShuffledFanOrder(): number[] {
  const a = Array.from({ length: TAROT_FAN_SLOT_COUNT }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Resolve which of the 78 file-order cards sits at visual slot `slotIndex` after shuffling. */
export function getTarotCardForFanOrderSlot(fanOrder: readonly number[], slotIndex: number): TarotCard {
  if (slotIndex < 0 || slotIndex >= fanOrder.length) {
    return FULL_TAROT_DECK_BY_FILE_SLOT[0];
  }
  const deckIdx = fanOrder[slotIndex];
  if (deckIdx === undefined || deckIdx < 0 || deckIdx >= FULL_TAROT_DECK_BY_FILE_SLOT.length) {
    return FULL_TAROT_DECK_BY_FILE_SLOT[0];
  }
  return FULL_TAROT_DECK_BY_FILE_SLOT[deckIdx];
}

// 获取不重复的一张牌
export const drawSingleCard = (excludedIds: Set<string>): { card: TarotCard, isReversed: boolean } => {
  const availableCards = FULL_TAROT_DECK.filter(c => !excludedIds.has(c.id));
  const pool = availableCards.length > 0 ? availableCards : FULL_TAROT_DECK; // 如果都抽完了就重置
  const card = pool[Math.floor(Math.random() * pool.length)];
  const isReversed = Math.random() > 0.5; // 50% 正逆位
  return { card, isReversed };
};
