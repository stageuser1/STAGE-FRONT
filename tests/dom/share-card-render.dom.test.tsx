// @vitest-environment node

/**
 * T5 分享卡的**真实渲染**断言(T5-R1 第 1 条要求:不能只断言字号下限,
 * 必须断言渲染出来之后不溢出、不挤压页脚)。
 *
 * 这个文件真的把 PNG 画出来,再逐像素检查:
 *
 * - `sc:R1` 画布尺寸就是 3:4 的 900×1200;
 * - `sc:R2` 画布外框 24px 内没有任何深色像素 —— 有就是内容溢出到了边缘;
 * - `sc:R3` 底部页脚带里左右两侧都有深色像素(左=域名文字,右=二维码)——
 *   页脚被顶出画布或被压扁,这条就会失败;
 * - `sc:R4` 校名与下方文字之间存在整行空白 —— 当初 `lineHeight: 1.15` +
 *   flex 收缩导致的「校名压在英文名上」正是**没有**这条空白,而当时的
 *   元素树断言全部通过。这条是那类静默重叠的哨兵。
 *
 * 三个用例专门覆盖 P1 指出的极长校名:十五字中文全称、四十多字德文全称,
 * 以及一个八十字的病态输入。
 *
 * **两个刻意的选择**:
 *
 * 1. `@vitest-environment node`(文件名仍是 `.dom.test.tsx`,因为 runner 的
 *    include 只认这个后缀):`next/og` 要跑 wasm 与 Node 的流,jsdom 的全局
 *    覆盖会让它拿不到需要的东西。这个文件也确实不需要 document。
 * 2. 字体走**离线固定子集**(`tests/fixtures/fonts/`),不是生产那条构建期
 *    联网取子集的路径。让测试联网会引入网络/配额脆弱性,CI 会无故变红 ——
 *    与 T5-R1 第 4 条不让测试连生产 旧 CMS 是同一个理由。代价是子集只覆盖
 *    `charset.txt` 里的字形,所以每个用例先断言「要渲染的字符都在 charset 里」,
 *    漏字是显式失败,不是静默的豆腐块。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { beforeAll, describe, expect, test } from "vitest";

import type { ProgramV3, ShareCardPayloadV3 } from "@/data/v3/types";
import { mockProgramsV3 } from "@/data/v3/mock-programs";
import jsQR from "jsqr";
import { qrDataUri } from "@/lib/program-v3/qr";
import { buildShareCardPayload } from "@/lib/program-v3/share-card";
import {
  SHARE_CARD_PORTRAIT,
  SHARE_CARD_RADIUS,
} from "@/lib/program-v3/share-card-tokens";
import {
  collectElementText,
  PORTRAIT_QR_SIZE,
  ShareCardPortrait,
  shareCardDeadlineChip,
} from "@/lib/program-v3/share-card-template";

const FONT_DIR = path.join(process.cwd(), "tests/fixtures/fonts");
const CHARSET = new Set(
  Array.from(readFileSync(path.join(FONT_DIR, "charset.txt"), "utf8")),
);
const FONTS = [400, 700].map((weight) => ({
  name: "Noto Sans SC",
  data: readFileSync(path.join(FONT_DIR, `NotoSansSC-subset-${weight}.ttf`)),
  weight: weight as 400 | 700,
  style: "normal" as const,
}));

const { width: WIDTH, height: HEIGHT } = SHARE_CARD_PORTRAIT;
/** 深色 = 有文字/二维码。用于「这里应该有东西」这一侧的断言。 */
const DARK_LUMINANCE = 200;
/**
 * 「这里不该有任何东西」那一侧改用**偏离底色**判定(T5-R2 #5):只查深色会
 * 放过浅色内容 —— 浅灰分隔线、`brand-50` 的角标底、`ink-100` 的已截止角标底
 * 都比阈值亮,溢出到边缘也不会被发现。容差 6/255 只用来吸收 PNG 量化误差。
 */
const SURFACE_RGB = [255, 255, 255];
const SURFACE_TOLERANCE = 6;

interface Bitmap {
  dark: (x: number, y: number) => boolean;
  darkCountIn: (x0: number, y0: number, x1: number, y1: number) => number;
  offSurfaceCountIn: (x0: number, y0: number, x1: number, y1: number) => number;
  rowIsBlank: (y: number) => boolean;
}

async function renderPortrait(payload: ShareCardPayloadV3, program: ProgramV3) {
  const qr = await qrDataUri(payload.qr_url);
  const element = (
    <ShareCardPortrait
      chip={shareCardDeadlineChip(program, new Date("2026-08-03T09:00:00"))}
      payload={payload}
      // 真二维码,不是黑方块(T5-R2 #6):黑方块只能证明"页脚右侧有像素",
      // 证明不了那里真的是一个能扫的码。`sc:R3` 会把它从成品 PNG 里裁出来
      // 用 jsQR 解回 URL —— 与 `sc:D4` 的解码手法打通,只是起点从 SVG 换成
      // 了最终产物。
      qrDataUri={qr}
    />
  );

  // 漏字检查:子集之外的字符会被 satori 静默丢弃,断言就会失去意义。
  const missing = Array.from(
    new Set(Array.from(collectElementText(element))),
  ).filter((char) => !CHARSET.has(char));
  expect(
    missing,
    `这些字符不在测试字体子集里,请把它们加进 scripts/build-share-card-test-font.mjs 的 SOURCE_STRINGS 并重跑:${missing.join("")}`,
  ).toEqual([]);

  const png = Buffer.from(
    await new ImageResponse(element, {
      width: WIDTH,
      height: HEIGHT,
      fonts: FONTS,
    }).arrayBuffer(),
  );
  const { data, info } = await sharp(png)
    .flatten({ background: "#ffffff" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const isDark = (x: number, y: number) => {
    const i = (y * info.width + x) * channels;
    // 感知亮度足够了 —— 这里只区分「纸」和「墨」。
    const luminance =
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    return luminance < DARK_LUMINANCE;
  };

  const isOffSurface = (x: number, y: number) => {
    const i = (y * info.width + x) * channels;
    return (
      Math.abs(data[i] - SURFACE_RGB[0]) > SURFACE_TOLERANCE ||
      Math.abs(data[i + 1] - SURFACE_RGB[1]) > SURFACE_TOLERANCE ||
      Math.abs(data[i + 2] - SURFACE_RGB[2]) > SURFACE_TOLERANCE
    );
  };

  const bitmap: Bitmap = {
    dark: isDark,
    offSurfaceCountIn(x0, y0, x1, y1) {
      let count = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) if (isOffSurface(x, y)) count += 1;
      }
      return count;
    },
    darkCountIn(x0, y0, x1, y1) {
      let count = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) if (isDark(x, y)) count += 1;
      }
      return count;
    },
    rowIsBlank(y) {
      for (let x = 0; x < info.width; x += 1) if (isDark(x, y)) return false;
      return true;
    },
  };
  return { png, info, bitmap, payload };
}

/** 用真实 fixture 的结构,只替换校名 —— 其余字段保持真实数据形状。 */
function withSchoolName(name: string): {
  program: ProgramV3;
  payload: ShareCardPayloadV3;
} {
  const base = mockProgramsV3[0];
  const program: ProgramV3 = {
    ...base,
    school: { ...base.school, school_name_zh: name },
  };
  return { program, payload: buildShareCardPayload(program) };
}

const CASES = [
  { label: "常规中文校名(7 字)", name: "茱莉亚音乐学院" },
  { label: "长中文校名(14 字)", name: "曼海姆国立音乐与表演艺术大学" },
  {
    label: "欧陆英文/德文全称(49 字)",
    name: "Universität für Musik und darstellende Kunst Wien",
  },
  { label: "病态输入(80 字)", name: "音乐学院".repeat(20) },
  // T5-R2 #1:连续拉丁字符曾被当作不可断开的单个 token —— 这两条是那个缺陷
  // 的真实渲染回归。
  { label: "200 字全英文(单词无空格)", name: "A".repeat(200) },
  {
    label: "中英混排超长",
    name: "上海音乐学院Shanghai-Conservatory-of-Music-International-Programme-Extended",
  },
];

describe("R. 真实渲染:溢出与页脚保护(T5-R1 #1)", () => {
  const rendered = new Map<string, Awaited<ReturnType<typeof renderPortrait>>>();

  beforeAll(async () => {
    for (const testCase of CASES) {
      const { program, payload } = withSchoolName(testCase.name);
      rendered.set(testCase.label, await renderPortrait(payload, program));
    }
  }, 120_000);

  test("sc:R1 四个用例都渲染成 900×1200(3:4)", () => {
    for (const testCase of CASES) {
      const { info } = rendered.get(testCase.label)!;
      expect([info.width, info.height], testCase.label).toEqual([WIDTH, HEIGHT]);
    }
  });

  test("sc:R2 画布外框内没有任何偏离底色的像素(不只是深色)", () => {
    // 两处刻意排除,都是卡面本身而不是内容:
    // - 最外一圈是卡片的 `border`(T3 卡面语言),本来就该贴边;
    // - 四角是 `borderRadius: 12` 的圆角描边,它会向内弯进来若干像素,
    //   所以沿边扫描时跳过角上 radius+4 的方块。
    const border = 2;
    const corner = SHARE_CARD_RADIUS + 4;
    const margin = 24;
    for (const testCase of CASES) {
      const { bitmap } = rendered.get(testCase.label)!;
      const top = bitmap.offSurfaceCountIn(corner, border, WIDTH - corner, margin);
      const bottom = bitmap.offSurfaceCountIn(
        corner,
        HEIGHT - margin,
        WIDTH - corner,
        HEIGHT - border,
      );
      const left = bitmap.offSurfaceCountIn(border, corner, margin, HEIGHT - corner);
      const right = bitmap.offSurfaceCountIn(
        WIDTH - margin,
        corner,
        WIDTH - border,
        HEIGHT - corner,
      );
      expect(
        { top, bottom, left, right },
        `${testCase.label}:内容画到了画布边缘`,
      ).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
    }
  });

  test("sc:R3 页脚仍在画布内:左侧有域名文字,右侧的二维码能从成品 PNG 里扫出来", async () => {
    const bandTop = HEIGHT - 260;
    for (const testCase of CASES) {
      const { bitmap, png, payload } = rendered.get(testCase.label)!;
      const left = bitmap.darkCountIn(64, bandTop, WIDTH / 2, HEIGHT - 40);
      expect(left, `${testCase.label}:页脚左侧(域名)不见了`).toBeGreaterThan(200);

      // 右侧:不数像素,直接把二维码区域裁出来解码(T5-R2 #6)。
      // 解得回 URL,就同时证明了「它在画布内」「它是二维码」「它能扫」。
      const { data, info } = await sharp(png)
        .extract({
          left: WIDTH - 64 - PORTRAIT_QR_SIZE - 8,
          top: HEIGHT - 64 - PORTRAIT_QR_SIZE - 8,
          width: PORTRAIT_QR_SIZE + 16,
          height: PORTRAIT_QR_SIZE + 16,
        })
        .resize({ width: (PORTRAIT_QR_SIZE + 16) * 3, kernel: "nearest" })
        .flatten({ background: "#ffffff" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const decoded = jsQR(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
      );
      expect(
        decoded?.data,
        `${testCase.label}:成品 PNG 里的二维码没能解出来`,
      ).toBe(payload.qr_url);
    }
  }, 120_000);

  test("sc:R4 校名与下方文字之间有整行空白(重叠哨兵)", () => {
    // 校名块从 y≈64(padding)+ 品牌行 + 40(marginTop)开始,到指标区之前
    // 结束。取一个宽松的窗口,只问「这段里有没有把文字分开的空白行」。
    for (const testCase of CASES) {
      const { bitmap } = rendered.get(testCase.label)!;
      let runs = 0;
      let inRun = false;
      for (let y = 150; y < 620; y += 1) {
        const blank = bitmap.rowIsBlank(y);
        if (blank && !inRun) {
          inRun = true;
        } else if (!blank && inRun) {
          runs += 1;
          inRun = false;
        }
      }
      // 校名 / 英文名 / 专业+学位 三行文字之间至少要有两段空白把它们隔开。
      // 当年的重叠 bug 在这里只会数到 1 段。
      expect(runs, `${testCase.label}:文字行之间没有分隔空白,疑似重叠`)
        .toBeGreaterThanOrEqual(2);
    }
  });
});
