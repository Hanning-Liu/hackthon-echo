import { AUDIO_TRACKS } from './tarotData';

/** 每盘磁带独立试听地址（SoundHelix 官方示例 1–17；后三盘使用独立样例文件） */
const soundHelix = (n: number) =>
  `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

const TAPE_EXTRA_AUDIO = [
  'https://filesamples.com/samples/audio/mp3/sample1.mp3',
  'https://filesamples.com/samples/audio/mp3/sample2.mp3',
  'https://filesamples.com/samples/audio/mp3/sample3.mp3',
] as const;

/** 完成页裁剪发布后，广场 BGM 仅在区间内循环（秒） */
export type TapePlaybackTrim = { startSec: number; endSec: number };

export interface TapeReview {
  id: string;
  title: string;
  director?: string;
  movie: string;
  snippet: string;
  content: string;
  colorTheme: string;
  tapeStyle: 'style1' | 'style2' | 'style3';
  audioCategory?: 'healing' | 'energetic' | 'meditation' | 'melancholic';
  /** 该磁带专属试听；缺省时仍按 audioCategory 回退（兼容旧版本地收藏） */
  audioUrl?: string;
  /** 有值且区间短于整轨时，主界面 BGM 只在该窗口内循环 */
  playbackTrim?: TapePlaybackTrim;
}

/** 解析磁带播放地址：优先专属链接，否则按 mood 分类占位曲 */
export function resolveTapeAudioUrl(tape: TapeReview): string {
  if (tape.audioUrl) return tape.audioUrl;
  return AUDIO_TRACKS[tape.audioCategory || 'healing'];
}

export const TAPE_REVIEWS: TapeReview[] = [
  { id: 'tape_01', title: '关于遗忘与存在的温柔交响', movie: '《寻梦环游记》', snippet: '"死亡不是生命的终点，遗忘才是。"', content: '在这个用万寿菊铺满的死亡之地...只要记忆还在，爱就在。', colorTheme: 'from-[#FFB6A3] to-[#FFD5A1]', tapeStyle: 'style1', audioCategory: 'healing', audioUrl: soundHelix(1) },
  { id: 'tape_02', title: '被嫌弃后的救赎与自我和解', movie: '《被嫌弃的松子的一生》', snippet: '"生而为人，我很抱歉？不，生而为人，勇敢去爱。"', content: '松子的一生充满跌宕和卑微...你本身就该是被珍惜的花。', colorTheme: 'from-[#A1C4FF] to-[#D5E1FF]', tapeStyle: 'style2', audioCategory: 'melancholic', audioUrl: soundHelix(2) },
  { id: 'tape_03', title: '漫行于宇宙的浪漫主义', movie: '《星际穿越》', snippet: '"爱是唯一能够超越时间与空间的事物。"', content: '在浩瀚的宇宙尺度下，人类显得如此渺小且短暂...这也是关于人性的极致礼赞。', colorTheme: 'from-[#E1C6FF] to-[#F2E5FF]', tapeStyle: 'style3', audioCategory: 'meditation', audioUrl: soundHelix(3) },
  { id: 'tape_04', title: '在绿皮火车上的时光慢递', movie: '《小森林》', snippet: '"逃避本身没有错，但最终还是要积蓄力量回去。"', content: '市子的生活没有大起大落...找到脚踏实地的安心。', colorTheme: 'from-[#C1ECC4] to-[#E3F6E5]', tapeStyle: 'style1', audioCategory: 'healing', audioUrl: soundHelix(4) },
  { id: 'tape_05', title: '雨中曲与无处安放的灵魂', movie: '《言叶之庭》', snippet: '"隐约雷鸣，阴霾天空...能留你在此。"', content: '躲雨的亭子，成为两个孤独灵魂的避风港...哪怕前路依旧泥泞。', colorTheme: 'from-[#B2EBF2] to-[#E0F7FA]', tapeStyle: 'style2', audioCategory: 'melancholic', audioUrl: soundHelix(5) },
  { id: 'tape_06', title: '一封寄往情书的纯白告别', movie: '《情书》', snippet: '"你好吗？我很好。"', content: '大雪纷飞的北海道...那些纯粹的情感永远鲜活。', colorTheme: 'from-[#FFF0EE] to-[#FFE0DB]', tapeStyle: 'style3', audioCategory: 'healing', audioUrl: soundHelix(6) },
  { id: 'tape_07', title: '缝隙里的微光', movie: '《天使爱美丽》', snippet: '"没有你，良辰美景可与何人说？"', content: '那些不起眼的琐碎小事...一定有另一个人爱着你的不同。', colorTheme: 'from-[#FDE0A4] to-[#FFF4D9]', tapeStyle: 'style1', audioCategory: 'energetic', audioUrl: soundHelix(7) },
  { id: 'tape_08', title: '时间荒野上的相逢', movie: '《爱在黎明破晓前》', snippet: '"如果世界上有什么奇迹，那就是尽力理解另一个人。"', content: '一辆火车，相视一笑...以此证明我们真正地活过。', colorTheme: 'from-[#FAD6E1] to-[#FFEBF1]', tapeStyle: 'style2', audioCategory: 'meditation', audioUrl: soundHelix(8) },
  { id: 'tape_09', title: '温柔的反击', movie: '《白日梦想家》', snippet: '"开拓视野，冲破艰险，看见世界。"', content: '当生活陷入僵局，或许只需要一次冲动。从冰岛的滑板到喜马拉雅的山巅，找回遗忘的勇气。', colorTheme: 'from-[#93C5FD] to-[#DBEAFE]', tapeStyle: 'style3', audioCategory: 'energetic', audioUrl: soundHelix(9) },
  { id: 'tape_10', title: '给自己的情书', movie: '《百元之恋》', snippet: '"好想赢一次，就哪怕一次也好。"', content: '人生有时候就像一发无法预测的直拳。不是为了惊天动地，只是为了告诉自己，我也能挥出有力量的一击。', colorTheme: 'from-[#FCA5A5] to-[#FEE2E2]', tapeStyle: 'style1', audioCategory: 'energetic', audioUrl: soundHelix(10) },
  { id: 'tape_11', title: '放逐与归途', movie: '《海街日记》', snippet: '"活着的东西都是很费功夫的。"', content: '镰仓的梅酒，窗外的蝉鸣。四个女孩在琐碎的日常中互相治愈。生活的真谛，或许就在一蔬一饭之间。', colorTheme: 'from-[#A7F3D0] to-[#ECFDF5]', tapeStyle: 'style2', audioCategory: 'healing', audioUrl: soundHelix(11) },
  { id: 'tape_12', title: '荒诞中的真情', movie: '《楚门的世界》', snippet: '"如果再也不能见到你，祝你早安，午安，晚安。"', content: '当我们意识到自己生活在一个巨大的幻象中，是否有勇气推开那扇走向真实世界的门？真实也许残酷，但毕竟自由。', colorTheme: 'from-[#FDE68A] to-[#FEF3C7]', tapeStyle: 'style3', audioCategory: 'meditation', audioUrl: soundHelix(12) },
  { id: 'tape_13', title: '跨越次元的羁绊', movie: '《头脑特工队》', snippet: '"哭泣能让我停下来，感受失去的重量。"', content: '接纳悲伤，也是成长的重要一环。并不是每时每刻都需要保持积极，学会拥抱不完美的自己。', colorTheme: 'from-[#FBCFE8] to-[#FDF2F8]', tapeStyle: 'style1', audioCategory: 'healing', audioUrl: soundHelix(13) },
  { id: 'tape_14', title: '孤岛的相拥', movie: '《荒岛余生》', snippet: '"明天太阳依然会升起，谁知道潮水会带来什么？"', content: '当文明剥落，只剩下最原始的求生欲。面对极致的孤独，心中的执念成为唯一的灯塔。', colorTheme: 'from-[#D8B4FE] to-[#F3E8FF]', tapeStyle: 'style2', audioCategory: 'melancholic', audioUrl: soundHelix(14) },
  { id: 'tape_15', title: '记忆的出路', movie: '《美丽心灵的永恒阳光》', snippet: '"你可以把一个人从记忆中抹去，但要想从心里抹去，那又是另外一回事了。"', content: '如果重来一次，我们是否还是会相爱，然后互相折磨？即便知道结局，依然想要再次牵起你的手。', colorTheme: 'from-[#99F6E4] to-[#CCFBF1]', tapeStyle: 'style3', audioCategory: 'meditation', audioUrl: soundHelix(15) },
  { id: 'tape_16', title: '平凡的奇迹', movie: '《步履不停》', snippet: '"人生就是不断地错过。"', content: '夏末的阳光，摇晃的电车。我们在不知不觉中与家人越走越远，但那些看似漫不经心的对话，却构成了生命最坚实的底色。', colorTheme: 'from-[#E9D5FF] to-[#FAF5FF]', tapeStyle: 'style1', audioCategory: 'healing', audioUrl: soundHelix(16) },
  { id: 'tape_17', title: '重拾初心的旅程', movie: '《千与千寻》', snippet: '"不要回头，一直向前走吧。"', content: '在这个光怪陆离的汤屋里，千寻找回了自己的名字。无论世界多么复杂，请努力记住自己最初的模样。', colorTheme: 'from-[#FED7AA] to-[#FFF7ED]', tapeStyle: 'style2', audioCategory: 'energetic', audioUrl: soundHelix(17) },
  { id: 'tape_18', title: '灵魂的共振', movie: '《海上钢琴师》', snippet: '"键盘有始有终，你确切知道88个键就在那儿。"', content: '陆地太大，像一艘没有尽头的大船。在有限的琴键中弹奏无限的音乐，这或许就是他对这个拒绝妥协的世界最优美的反击。', colorTheme: 'from-[#BFDBFE] to-[#EFF6FF]', tapeStyle: 'style3', audioCategory: 'melancholic', audioUrl: TAPE_EXTRA_AUDIO[0] },
  { id: 'tape_19', title: '无声的告别', movie: '《入殓师》', snippet: '"死可能是一道门，逝去并不是终结，而是超越，走向下一程。"', content: '以温柔的双手送别亡者，既是对生命的敬畏，也是与自己内心的和解。死亡并非黑白色，它也可以充满庄严的美感。', colorTheme: 'from-[#DDD6FE] to-[#F5F3FF]', tapeStyle: 'style1', audioCategory: 'meditation', audioUrl: TAPE_EXTRA_AUDIO[1] },
  { id: 'tape_20', title: '绿洲的回响', movie: '《海蒂和爷爷》', snippet: '"如果生活中有什么让你快乐，那就去做吧，不要管别人怎么说。"', content: '阿尔卑斯山的风能吹散所有的阴霾。善良与纯真是治愈世间一切冷漠的最好解药。', colorTheme: 'from-[#BBF7D0] to-[#F0FDF4]', tapeStyle: 'style2', audioCategory: 'healing', audioUrl: TAPE_EXTRA_AUDIO[2] }
];

export const getShuffledTapes = (): TapeReview[] => {
  const shuffled = [...TAPE_REVIEWS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
