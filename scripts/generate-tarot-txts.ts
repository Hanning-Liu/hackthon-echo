/**
 * 为 public/tarot cards 下每张图片生成同名 UTF-8 介绍 txt，内容来自 src/lib/tarotData.ts。
 *
 * 文件名规则：`{序号}{中文牌名}.jpg`。序号仅用于排序；牌意通过去掉数字前缀后的中文匹配到 tarotData（与
 * 当前资源命名一致：大牌含「女皇/女祭司」顺序；小牌为 宝剑→权杖→圣杯→星币）。
 * 无法解析时在 tarot-txt-overrides.json 中按「不含扩展名的文件名」→ 牌 id 覆盖。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FULL_TAROT_DECK, type TarotCard } from "../src/lib/tarotData";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TAROT_CARDS_DIR = path.join(__dirname, "..", "public", "tarot cards");
const OVERRIDES_PATH = path.join(__dirname, "tarot-txt-overrides.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);

/** 去掉文件名数字前缀后的中文 → 大阿卡纳 id（与 tarotData 牌序一致） */
const MAJOR_ZH_TO_ID: Record<string, string> = {
  愚人: "M00",
  魔术师: "M01",
  女祭司: "M02",
  皇后: "M03",
  女皇: "M03",
  皇帝: "M04",
  教皇: "M05",
  恋人: "M06",
  战车: "M07",
  力量: "M08",
  隐士: "M09",
  命运之轮: "M10",
  正义: "M11",
  倒吊人: "M12",
  死神: "M13",
  节制: "M14",
  恶魔: "M15",
  高塔: "M16",
  星星: "M17",
  月亮: "M18",
  太阳: "M19",
  审判: "M20",
  世界: "M21",
};

const SUIT_ZH: Record<string, "wands" | "cups" | "swords" | "pentacles"> = {
  权杖: "wands",
  圣杯: "cups",
  宝剑: "swords",
  星币: "pentacles",
};

function loadOverrides(): Record<string, string> {
  try {
    const raw = fs.readFileSync(OVERRIDES_PATH, "utf8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function findCardById(id: string): TarotCard | undefined {
  return FULL_TAROT_DECK.find((c) => c.id === id);
}

function formatTxt(card: TarotCard): string {
  const cat = card.category === "major" ? "大阿卡纳" : "小阿卡纳";
  return [
    card.name,
    cat,
    "",
    "【正位】",
    card.upright.meaning,
    card.upright.guidance,
    "",
    "【逆位】",
    card.reversed.meaning,
    card.reversed.guidance,
    "",
  ].join("\n");
}

function parseMinorRank(rest: string): string | null {
  if (rest === "王牌") return "Ace";
  if (rest === "侍者") return "Page";
  if (rest === "骑士") return "Knight";
  if (rest === "女王") return "Queen";
  if (rest === "国王") return "King";
  if (/^(?:[2-9]|10)$/.test(rest)) return rest;
  return null;
}

function semanticToMinorId(semantic: string): string | null {
  const suitKeys = Object.keys(SUIT_ZH).sort((a, b) => b.length - a.length);
  for (const sk of suitKeys) {
    if (!semantic.startsWith(sk)) continue;
    const rest = semantic.slice(sk.length);
    const rank = parseMinorRank(rest);
    if (!rank) return null;
    return `Min_${SUIT_ZH[sk]}_${rank}`;
  }
  return null;
}

function resolveCard(baseName: string, overrides: Record<string, string>): TarotCard | null {
  const overrideId = overrides[baseName];
  if (overrideId) {
    const c = findCardById(overrideId);
    if (!c) console.warn(`[overrides] 未知牌 id: ${overrideId}（${baseName}）`);
    return c ?? null;
  }

  const semantic = baseName.replace(/^\d+/, "");
  if (!semantic) return null;

  const majorId = MAJOR_ZH_TO_ID[semantic];
  if (majorId) {
    return findCardById(majorId) ?? null;
  }

  const minorId = semanticToMinorId(semantic);
  if (minorId) {
    return findCardById(minorId) ?? null;
  }

  return null;
}

function main(): void {
  if (!fs.existsSync(TAROT_CARDS_DIR)) {
    console.error("目录不存在:", TAROT_CARDS_DIR);
    process.exit(1);
  }

  const overrides = loadOverrides();
  const entries = fs.readdirSync(TAROT_CARDS_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile());

  let written = 0;
  const skipped: string[] = [];

  for (const f of files) {
    const ext = path.extname(f.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;

    const baseName = path.basename(f.name, ext);
    const card = resolveCard(baseName, overrides);
    if (!card) {
      skipped.push(f.name);
      continue;
    }

    const txtPath = path.join(TAROT_CARDS_DIR, `${baseName}.txt`);
    fs.writeFileSync(txtPath, formatTxt(card), "utf8");
    written++;
  }

  console.log(`已写入 ${written} 个 txt（目录: ${TAROT_CARDS_DIR}）`);
  if (skipped.length) {
    console.warn("未匹配到牌、已跳过（可加入 tarot-txt-overrides.json）：");
    skipped.forEach((n) => console.warn(`  - ${n}`));
  }
}

main();
