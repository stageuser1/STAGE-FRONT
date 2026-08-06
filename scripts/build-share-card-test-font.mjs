/**
 * 生成 `tests/fixtures/fonts/` 下的测试用字体子集。
 *
 * 为什么需要它:`sc:R1–R4` 要断言**真实渲染出来的像素**没有溢出、没有把页脚
 * 顶出画布。satori 没有系统字体可用,必须喂字体二进制;而生产代码走的是
 * 构建期联网取子集(见 `lib/program-v3/share-card-font.ts`)。让测试也去联网
 * 会引入网络脆弱性,CI 会无故变红 —— 所以测试用一份**离线的、固定的**子集,
 * 覆盖测试字符串里出现的全部字符。
 *
 * 字体:Noto Sans SC,SIL Open Font License 1.1(许可证原文见同目录 OFL.txt)。
 * 子集通过 Google Fonts 的 `css2?...&text=` 接口生成,只含下面 CHARSET 里的字形。
 *
 * 什么时候要重跑:测试里新增了 CHARSET 之外的字符时。测试本身会先断言
 * 「要渲染的每个字符都在 charset.txt 里」,所以漏字是显式失败,不是静默豆腐块。
 *
 *   node scripts/build-share-card-test-font.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT_DIR = fileURLToPath(
  new URL("../tests/fixtures/fonts/", import.meta.url),
);

/** 测试会渲染到的全部文本。改测试字符串时同步改这里,然后重跑本脚本。 */
const SOURCE_STRINGS = [
  // 品牌行、角标、核实戳、域名、省略号
  "先留学 · 不鸽,只先到",
  "开放中",
  "距截止 18 天",
  "本季已截止,查看下季",
  "官网核实 2026年7月",
  "官网内容有变更,信息更新中",
  "studyabroadfirst.cn",
  "…",
  // 指标标签与取值
  "语言要求",
  "预筛/试音",
  "截止日期",
  "总费用",
  "TOEFL 100 / IELTS 7.5",
  "需预筛 · 现场或录像试音",
  "无需预筛 · 多轮试音",
  "无需语言成绩",
  "2026年12月1日",
  "¥55–66 万元人民币",
  "USD 61,300/年（学费,不含生活费）",
  // 校名与专业(含 P1 要处理的极长中文校名与欧陆全称)
  "茱莉亚音乐学院",
  "The Juilliard School",
  "声乐 · BM",
  "曼海姆国立音乐与表演艺术大学",
  "Universität für Musik und darstellende Kunst Wien",
  "Gesang · MA",
  // 病态用例:由上面已有的汉字重复拼成,不引入新字形
  "音乐学院".repeat(20),
  // T5-R2 #1 的两个真实渲染回归用例
  "A".repeat(200),
  "上海音乐学院Shanghai-Conservatory-of-Music-International-Programme-Extended",
];

const CHARSET = Array.from(new Set(Array.from(SOURCE_STRINGS.join(""))))
  .sort()
  .join("");

const FAMILY = "Noto Sans SC";
const WEIGHTS = [400, 700];

const OFL_URL = "https://openfontlicense.org/open-font-license-official-text/";

async function fetchSubset(weight) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    FAMILY,
  )}:wght@${weight}&text=${encodeURIComponent(CHARSET)}`;
  const css = await (await fetch(cssUrl)).text();
  const match = /src:\s*url\((.+?)\)\s*format\('truetype'\)/.exec(css);
  if (!match) {
    throw new Error(`未能解析 truetype 子集 URL(weight ${weight}):\n${css}`);
  }
  return Buffer.from(await (await fetch(match[1])).arrayBuffer());
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(new URL("charset.txt", `file://${OUT_DIR}`), CHARSET, "utf8");
for (const weight of WEIGHTS) {
  const data = await fetchSubset(weight);
  writeFileSync(
    new URL(`NotoSansSC-subset-${weight}.ttf`, `file://${OUT_DIR}`),
    data,
  );
  console.log(`NotoSansSC-subset-${weight}.ttf  ${data.length} bytes`);
}
writeFileSync(
  new URL("README.md", `file://${OUT_DIR}`),
  [
    "# 测试用字体子集",
    "",
    "由 `scripts/build-share-card-test-font.mjs` 生成,只供",
    "`tests/dom/share-card-render.dom.test.tsx` 的真实渲染断言使用,",
    "**不参与生产出图**(生产走构建期联网取子集,见 `lib/program-v3/share-card-font.ts`)。",
    "",
    `字体:Noto Sans SC,SIL Open Font License 1.1(${OFL_URL})。`,
    "子集只含 `charset.txt` 里列出的字形。",
    "",
    `字符数:${Array.from(CHARSET).length}`,
    "",
    "测试字符串新增了 charset 之外的字符时重跑生成脚本;测试会先断言",
    "「要渲染的每个字符都在 charset.txt 里」,漏字是显式失败而不是静默豆腐块。",
    "",
  ].join("\n"),
  "utf8",
);
console.log(`charset ${Array.from(CHARSET).length} chars`);
