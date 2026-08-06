import type { ReactElement, ReactNode } from "react";
import type { ProgramV3, ShareCardPayloadV3 } from "@/data/v3/types";
import { deadlineState } from "./format.ts";
import {
  SHARE_CARD_BRAND_LINE,
  SHARE_CARD_MAX_METRICS,
} from "./share-card.ts";
import {
  SHARE_CARD_COLORS,
  SHARE_CARD_OG,
  SHARE_CARD_OG_TYPE,
  SHARE_CARD_PORTRAIT,
  SHARE_CARD_PORTRAIT_TYPE,
  SHARE_CARD_RADIUS,
} from "./share-card-tokens.ts";

/**
 * §2.3 分享卡与 OG 图的**元素树**(satori 输入),与实际出图分开:
 * 出图在 `share-card-image.tsx`,那里要网络取字体、要 wasm;这里是纯函数,
 * 可以在 `node --test` 里直接断言结构与文案。
 *
 * 视觉:过渡方案,沿用 T3 Web Card 的视觉语言(白底、同一套灰阶与圆角、
 * 同样的截止角标),不执行 §2.3 的深蓝 + 暖金品牌色 —— 见
 * `share-card-tokens.ts` 顶部说明与移交文档。
 *
 * 内容顺序按 §2.3 冻结,自上而下:
 *   1 品牌行 · 2 中文校名(大) · 3 专业+学位 · 4 ≤3 指标 · 5 核实戳+域名+二维码
 *
 * §2.3 明令禁止且这里在结构上就没有位置放的东西:学校介绍、排名、校友、
 * 多图、>3 指标、任何「难度星级」评分、`editorial_notes`。这棵树只读
 * `ShareCardPayloadV3`,而那个类型里根本没有承载它们的字段。
 */

/**
 * 截止角标(§2.3「截止角标沿用 T3 的样式」)。
 *
 * 判定逻辑直接用 T3 的 `deadlineState()`,措辞与配色对齐
 * `components/program/v3/DeadlineBadge.tsx` 的三态。那个组件是 `"use client"`
 * 且把文案写在 JSX 里,没法直接 import 到图片管线;所以文案在这里重述,
 * 并由 `sc:D2` 扫描 DeadlineBadge 源码断言三句文案仍然一字不差地存在于
 * 该文件里 —— 任何一边改了措辞,测试就会失败。
 *
 * `now` 显式传入:静态出图没有「用户的时钟」,构建时刻就是这张图的时刻。
 */
export interface ShareCardChip {
  text: string;
  background: string;
  color: string;
}

export function shareCardDeadlineChip(
  program: ProgramV3,
  now: Date = new Date(),
): ShareCardChip | null {
  const state = deadlineState(program.application.application_deadline, now);
  if (!state) return null;
  if (state.kind === "closed") {
    return {
      text: "本季已截止,查看下季",
      background: SHARE_CARD_COLORS.ink100,
      color: SHARE_CARD_COLORS.ink400,
    };
  }
  if (state.kind === "closing") {
    return {
      text: `距截止 ${state.days} 天`,
      background: SHARE_CARD_COLORS.red50,
      color: SHARE_CARD_COLORS.red600,
    };
  }
  return {
    text: "开放中",
    background: SHARE_CARD_COLORS.brand50,
    color: SHARE_CARD_COLORS.brand700,
  };
}

function Chip({ chip, fontSize }: { chip: ShareCardChip; fontSize: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        // T3 的角标是 `rounded-full`,这里同样走全圆角。
        borderRadius: 999,
        padding: `${Math.round(fontSize * 0.4)}px ${Math.round(fontSize * 0.8)}px`,
        fontSize,
        fontWeight: 700,
        background: chip.background,
        color: chip.color,
      }}
    >
      {chip.text}
    </div>
  );
}

function BrandRow({
  chip,
  fontSize,
}: {
  chip: ShareCardChip | null;
  fontSize: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize,
          fontWeight: 700,
          color: SHARE_CARD_COLORS.brand600,
          // T3 marketing token `tracking-stage-eyebrow` 的同一手法:品牌行
          // 是标识不是正文,字距拉开。
          letterSpacing: "0.08em",
        }}
      >
        {SHARE_CARD_BRAND_LINE}
      </div>
      {chip ? <Chip chip={chip} fontSize={Math.round(fontSize * 0.9)} /> : null}
    </div>
  );
}

/**
 * 英文校名只在与中文校名不同的时候出现 —— 中文缺失时 `name_zh` 已经回退成
 * 英文名(核心原则 6),再画一遍就是同一行字印两次。
 */
function englishNameLine(payload: ShareCardPayloadV3): string | null {
  return payload.name_zh === payload.name_en ? null : payload.name_en;
}

/**
 * 字符宽度估算:中日韩字符 1em,拉丁字母按 0.62em。
 *
 * 0.62 是**偏保守**的取值 —— 实测 Noto Sans SC Bold 的一段德文平均约 0.51em,
 * 取大意味着算出来的行比实际略窄:宁可提前换行/提前截断,也不要算得太乐观
 * 让省略号被排到下一行、再被固定高度盒子裁掉(那就成了没有提示的截断)。
 */
const LATIN_EM = 0.62;

/** 拉丁词之间的空格宽度。`approximateEmWidth` 与 `layoutLines` 必须用同一个
 * 值,否则「量一行有多宽」和「往行里塞多少」会得出两个不同的答案。 */
const SPACE_EM = 0.3;

export function approximateEmWidth(text: string): number {
  return Array.from(text).reduce((sum, char) => {
    if (char === " ") return sum + SPACE_EM;
    return sum + (char.charCodeAt(0) > 0x2e7f ? 1 : LATIN_EM);
  }, 0);
}

const isWideChar = (char: string) => char.charCodeAt(0) > 0x2e7f;

/**
 * 把一段文本切成排版意义上的「不可断开单元」:
 * 中日韩字符每个自成一格(可以在任意两字之间换行),拉丁词整体不拆。
 * 这是 satori 实际的断行方式,也是下面 `layoutLines` 能贴近真实排版的原因。
 */
function tokenize(text: string): { text: string; wide: boolean }[] {
  const tokens: { text: string; wide: boolean }[] = [];
  let latin = "";
  const flush = () => {
    if (latin) {
      tokens.push({ text: latin, wide: false });
      latin = "";
    }
  };
  for (const char of Array.from(text)) {
    if (char === " ") {
      flush();
    } else if (isWideChar(char)) {
      flush();
      tokens.push({ text: char, wide: true });
    } else {
      latin += char;
    }
  }
  flush();
  return tokens;
}

/** 截断那一趟额外留的余量:估宽再保守也有偏差,省略号必须落在允许的行内。 */
const TRUNCATION_SAFETY = 0.95;

/**
 * 贪心断行:按 `emPerLine` 的行宽把 token 逐个塞进行里,塞不下就换行 ——
 * 与 satori 的断行规则同构。
 *
 * 之所以要真的模拟一遍而不是「总宽 ÷ 行宽」:后者把行尾放不下的半个词
 * 也算进容量里,病态用例上会多算出小半行。实测那半行让省略号被排到第三行,
 * 而第三行正好被固定高度盒子裁掉 —— 图上看到的是一句没有省略号的断句,
 * 也就是「悄悄截断」,恰恰是要避免的东西。
 */
export function layoutLines(text: string, emPerLine: number): string[] {
  if (emPerLine <= 0) return [text];
  const lines: string[] = [];
  let current = "";
  let currentWidth = 0;

  const push = () => {
    lines.push(current);
    current = "";
    currentWidth = 0;
  };

  for (const token of tokenize(text)) {
    const width = approximateEmWidth(token.text);
    const needsSpace = current !== "" && !token.wide && !current.endsWith(" ");
    const gap = needsSpace ? SPACE_EM : 0;

    // 单个 token 自己就比一行还宽(裁决 T5-R2 / Codex 第二轮 #1):拉丁词是「不可断开单元」
    // 只在它放得下的时候成立。`"A".repeat(300)`、德语复合词、连字符长词、
    // 拉丁化机构全名都会撞上这条。此时按**字符**强制断开 —— 排版引擎也是这么
    // 做的;不这么做的话它会被当成"一行放得下",既漏判行数也漏判截断。
    if (width > emPerLine) {
      if (current !== "") push();
      let chunk = "";
      let chunkWidth = 0;
      for (const char of Array.from(token.text)) {
        const charWidth = approximateEmWidth(char);
        if (chunk !== "" && chunkWidth + charWidth > emPerLine) {
          lines.push(chunk);
          chunk = char;
          chunkWidth = charWidth;
        } else {
          chunk += char;
          chunkWidth += charWidth;
        }
      }
      current = chunk;
      currentWidth = chunkWidth;
      continue;
    }

    if (current !== "" && currentWidth + gap + width > emPerLine) {
      push();
      current = token.text;
      currentWidth = width;
    } else {
      current = needsSpace ? `${current} ${token.text}` : current + token.text;
      currentWidth += gap + width;
    }
  }
  if (current !== "") lines.push(current);
  return lines.length > 0 ? lines : [""];
}

/**
 * 校名的**三级溢出保护**(T5-R1 第 1 条)。
 *
 * 版式是固定画布,校名长度不固定:中文校名十四字以上很常见
 * (「曼海姆国立音乐与表演艺术大学」),中文缺失时还会回退到
 * 「Universität für Musik und darstellende Kunst Wien」这种四十多字的欧陆
 * 全称。**只降字号不够**:降到下限仍放不下时会多出一行,而多出来的那一行会
 * 把指标和页脚整体下推、顶出画布(实测:14 字中文校名换行后,二维码有 24px
 * 被裁在画布外 —— `sc:R2` 就是抓这个的)。
 *
 * 所以按顺序做三件事,每一级只在上一级不够用时才生效:
 *
 * 1. **降字号**,同时受两个约束:宽度(maxLines 行装得下)与**高度**
 *    (`heightBudget`,即画布减去品牌行/英文名/专业/指标/页脚之后真正剩给
 *    校名的那点高度);
 * 2. **仍放不下 → 减行**:字号已到下限,行数按剩余高度算,最少 1 行;
 * 3. **仍放不下 → 截断加省略号**:逐字截到「当前字号 × 当前行数」装得下为止,
 *    末尾接 `…`。截断发生在**文本层**,不是靠 CSS 裁掉,所以读者看到的是一个
 *    明确的「还有」信号,而不是被切掉一半的字。
 *
 * 三级之后校名块的高度恒等于 `lines × 行高 × 字号` 且不超过 `heightBudget`,
 * 与校名长度无关 —— 这是页脚永远不被挤压的依据,由 `sc:R2`/`sc:R3` 用**真实
 * 渲染的像素**验证,不是靠这里的算术自证。
 *
 * 纯函数、无随机、与渲染环境无关:同一个校名永远得到同一组结果。
 */
export const SCHOOL_NAME_MIN_FONT_SIZE = 44;

/** 竖版页脚二维码边长。预算函数与模板共用同一个常量,改大改小两边同步。
 * 从 180 收到 160 是为了给换行校名腾出竖向预算(见 `schoolNameHeightBudget`);
 * 160px 在 200px 缩略图下仍约 36px,扫码不受影响。 */
export const PORTRAIT_QR_SIZE = 160;

/** 校名行高。satori 里 Noto Sans SC 的 ascent+descent 约 1.4em,低于这个值
 * 字形会溢出行盒(实测:1.15 时 96px 中文校名压在下一行英文名上)。 */
export const SCHOOL_NAME_LINE_HEIGHT = 1.4;

/** 其余文字块的行高估算。
 *
 * 用 1.4 而不是 satori 名义上的默认值 1.2:卡面上除英文校名外几乎全是中文,
 * 而 Noto Sans SC 的实际行盒就是 ~1.4em。实测按 1.25 估算时预算多算了约 29px,
 * 结果 14 字中文校名换行后把页脚压出画布(`sc:R2` 抓到)。估多了只会让校名
 * 小一点,估少了会溢出 —— 所以往保守一侧取。 */
const ESTIMATED_LINE_HEIGHT = 1.4;

export interface FittedSchoolName {
  /** 实际画出来的文本,可能带省略号。 */
  text: string;
  fontSize: number;
  /** 实际占用的行数(1…maxLines)。校名块的高度 = lines × 行高 × 字号。 */
  lines: number;
  /** 是否发生了截断(第三级是否触发)。 */
  truncated: boolean;
}

function estimateLines(
  text: string,
  fontSize: number,
  availableWidth: number,
): number {
  return layoutLines(text, availableWidth / fontSize).length;
}

export function fitSchoolName(
  name: string,
  baseSize: number,
  availableWidth: number,
  maxLines = 2,
  heightBudget = Number.POSITIVE_INFINITY,
): FittedSchoolName {
  const em = approximateEmWidth(name);
  if (em === 0) {
    return { text: name, fontSize: baseSize, lines: 1, truncated: false };
  }

  const linesAt = (size: number) =>
    Math.min(maxLines, estimateLines(name, size, availableWidth));
  const blockHeight = (size: number, lines: number) =>
    size * SCHOOL_NAME_LINE_HEIGHT * lines;

  // 第 1 级:降字号。**优先不截断** —— 先找最大的、能把全名完整排进
  // maxLines 行且高度预算容得下的字号;找不到才退而求其次,取高度预算容得下
  // 的最大字号(此时第 3 级会截断)。
  //
  // 顺序不能反:若只按「高度装得下」挑最大字号,一条只有一个指标、预算宽裕的
  // 卡会用 96px 排两行、把 49 字的德文全称截成「Universität für Musik…」,
  // 而同样的预算本来足够用 60px 把全名排完。宁可字小,不可无谓截断。
  const fitsWhole = (size: number) =>
    estimateLines(name, size, availableWidth) <= maxLines &&
    blockHeight(size, linesAt(size)) <= heightBudget;

  let fontSize = 0;
  for (let size = Math.floor(baseSize); size >= SCHOOL_NAME_MIN_FONT_SIZE; size -= 1) {
    if (fitsWhole(size)) {
      fontSize = size;
      break;
    }
  }
  if (fontSize === 0) {
    for (let size = Math.floor(baseSize); size >= SCHOOL_NAME_MIN_FONT_SIZE; size -= 1) {
      if (blockHeight(size, linesAt(size)) <= heightBudget) {
        fontSize = size;
        break;
      }
    }
  }
  if (fontSize === 0) fontSize = SCHOOL_NAME_MIN_FONT_SIZE;
  let lines = linesAt(fontSize);

  // 第 2 级:下限字号下高度仍不够 → 按预算减行(至少 1 行)。
  if (blockHeight(fontSize, lines) > heightBudget) {
    lines = Math.max(
      1,
      Math.floor(heightBudget / (fontSize * SCHOOL_NAME_LINE_HEIGHT)),
    );
  }

  // 第 3 级:当前字号 × 当前行数仍排不下 → 截断 + 省略号。
  const emPerLine = availableWidth / fontSize;
  if (layoutLines(name, emPerLine).length <= lines) {
    return { text: name, fontSize, lines, truncated: false };
  }
  const safeEmPerLine = emPerLine * TRUNCATION_SAFETY;

  // 与 `layoutLines` 同一套贪心规则再走一遍,边排边记录用到第几行;排到
  // **最后一行**时把省略号的宽度预扣掉,保证省略号落在允许的行数之内 ——
  // 落到下一行就会被固定高度盒子裁掉,变成没有任何提示的截断。
  const ellipsis = "…";
  const ellipsisEm = approximateEmWidth(ellipsis);
  let out = "";
  let line = 1;
  let lineWidth = 0;
  // 与 `layoutLines` 同一条强制断字规则:超宽 token 先拆成单字符,否则
  // 「一个 300 字母的词」会被当成一个整体、既不换行也不截断。
  const units = tokenize(name).flatMap((token) =>
    approximateEmWidth(token.text) > safeEmPerLine
      ? Array.from(token.text).map((char) => ({ text: char, wide: false }))
      : [token],
  );
  for (const token of units) {
    const width = approximateEmWidth(token.text);
    const needsSpace =
      out !== "" && !token.wide && !isWideChar(out[out.length - 1]);
    const gap = needsSpace ? SPACE_EM : 0;
    const budget =
      line === lines ? safeEmPerLine - ellipsisEm : safeEmPerLine;
    if (lineWidth + gap + width > budget) {
      if (line >= lines) break;
      line += 1;
      lineWidth = width;
      // 断行处的空格保留在文本里:satori 会在换行时忽略它,但少了它
      // 「Musik und」会被拼成「Musikund」。
      out += needsSpace ? ` ${token.text}` : token.text;
      continue;
    }
    out += needsSpace ? ` ${token.text}` : token.text;
    lineWidth += gap + width;
  }
  return {
    text: `${out}${ellipsis}`,
    fontSize,
    lines,
    truncated: true,
  };
}

/**
 * 校名块能用的高度 = 画布高 − 其余每一块的高度。
 *
 * 「其余每一块」是**算出来的**而不是拍脑袋的余量:指标条数、指标值会不会
 * 折行、英文名在不在、核实戳在不在,都会改变可用高度。这个函数与模板共用
 * 同一批 token 常量,所以改字号/间距时预算自动跟着变。
 *
 * 估算偏保守(行高按 1.25 而不是 satori 的 1.2),多算的部分只会让校名小一点;
 * 真正证明「没溢出」的是 `sc:R2`/`sc:R3` 的像素断言。
 */
export function schoolNameHeightBudget({
  payload,
  hasEnglishLine,
  canvasHeight,
  padding,
  availableWidth,
  type,
  qrSize,
  nameMarginTop,
  programMarginTop,
  metricsMarginTop,
  metricsLayout,
}: {
  payload: ShareCardPayloadV3;
  hasEnglishLine: boolean;
  canvasHeight: number;
  padding: number;
  availableWidth: number;
  type: typeof SHARE_CARD_PORTRAIT_TYPE | typeof SHARE_CARD_OG_TYPE;
  qrSize: number;
  nameMarginTop: number;
  programMarginTop: number;
  metricsMarginTop: number;
  metricsLayout: "column" | "row";
}): number {
  const line = (fontSize: number, lineCount = 1) =>
    Math.ceil(fontSize * ESTIMATED_LINE_HEIGHT) * lineCount;

  const chipFont = Math.round(type.brandLine * 0.9);
  const brandRow = Math.max(
    line(type.brandLine),
    line(chipFont) + Math.round(chipFont * 0.4) * 2,
  );

  const english = hasEnglishLine ? 16 + line(type.schoolNameEn) : 0;

  const programText = `${payload.program_zh} · ${payload.degree_abbr}`;
  const program =
    programMarginTop +
    line(type.program, estimateLines(programText, type.program, availableWidth));

  // 横排时三条指标等分宽度,每条的可用宽度是三分之一。
  const metricWidth =
    metricsLayout === "row"
      ? availableWidth / Math.max(1, payload.metrics.length)
      : availableWidth;
  const metrics =
    payload.metrics.length === 0
      ? 0
      : metricsMarginTop +
        payload.metrics.reduce((sum, metric) => {
          const verticalPadding =
            metricsLayout === "column"
              ? Math.round(type.metricValue * 0.2) * 2
              : 0;
          const hairline = metricsLayout === "column" ? 1 : 0;
          return (
            sum +
            verticalPadding +
            hairline +
            line(type.metricLabel) +
            Math.round(type.metricLabel * 0.35) +
            line(
              type.metricValue,
              estimateLines(metric.value, type.metricValue, metricWidth),
            )
          );
        }, 0);
  // 横排时三条指标并排,高度取最高的那条而不是三条相加。
  const metricsHeight =
    metricsLayout === "row" && payload.metrics.length > 0
      ? metricsMarginTop +
        Math.max(
          ...payload.metrics.map(
            (metric) =>
              line(type.metricLabel) +
              Math.round(type.metricLabel * 0.35) +
              line(
                type.metricValue,
                estimateLines(metric.value, type.metricValue, metricWidth),
              ),
          ),
        )
      : metrics;

  const footerText =
    (payload.verified_stamp ? line(type.stamp) + 10 : 0) + line(type.domain);
  const footer = 1 + 32 + Math.max(qrSize, footerText);

  return (
    canvasHeight -
    padding * 2 -
    brandRow -
    nameMarginTop -
    english -
    program -
    metricsHeight -
    footer
  );
}

function Metrics({
  payload,
  labelSize,
  valueSize,
  layout,
}: {
  payload: ShareCardPayloadV3;
  labelSize: number;
  valueSize: number;
  layout: "column" | "row";
}) {
  if (payload.metrics.length === 0) return null;
  // 版式上限与数据层上限是同一个常量,不是两个各自写死的 3。
  const metrics = payload.metrics.slice(0, SHARE_CARD_MAX_METRICS);
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        flexDirection: layout === "column" ? "column" : "row",
        width: "100%",
        gap: layout === "column" ? 0 : 56,
      }}
    >
      {metrics.map((metric) => (
        <div
          key={metric.metric_key}
          style={{
            display: "flex",
            flexDirection: "column",
            // 竖排时每条指标顶一条发丝线,与 T3 三数字块的 `border-t
            // border-line-subtle` 同一处理。
            borderTop:
              layout === "column"
                ? `1px solid ${SHARE_CARD_COLORS.lineSubtle}`
                : "none",
            paddingTop: layout === "column" ? Math.round(valueSize * 0.2) : 0,
            paddingBottom: layout === "column" ? Math.round(valueSize * 0.2) : 0,
            // 横排时三条指标等分宽度并各自内部换行。不这么写的话,item 按
            // 内容撑开:一条长值(例如「EUR 1,500/学期(学费,不含生活费)」)
            // 会把后面的指标推出 1200px 画布外。
            ...(layout === "row"
              ? { flexGrow: 1, flexBasis: 0, minWidth: 0 }
              : {}),
            // 三条指标必须连同页脚一起装进 1200px。satori 的 flex item 默认
            // 可收缩,内容超高时它不会溢出、而是**压扁行盒**,文字仍按原字号
            // 画出来 —— 结果就是校名压在英文名上。所以竖版的每个直接子项都
            // 显式 flexShrink: 0,任何超高都会变成看得见的溢出而不是悄悄重叠。
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", fontSize: labelSize, color: SHARE_CARD_COLORS.ink500 }}>
            {metric.label}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: Math.round(labelSize * 0.35),
              fontSize: valueSize,
              fontWeight: 700,
              color: SHARE_CARD_COLORS.ink900,
            }}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer({
  payload,
  qrDataUri,
  stampSize,
  domainSize,
  qrSize,
}: {
  payload: ShareCardPayloadV3;
  qrDataUri: string | null;
  stampSize: number;
  domainSize: number;
  qrSize: number | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        alignItems: "flex-end",
        justifyContent: "space-between",
        width: "100%",
        borderTop: `1px solid ${SHARE_CARD_COLORS.line}`,
        paddingTop: 32,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {payload.verified_stamp ? (
          <div
            style={{
              display: "flex",
              fontSize: stampSize,
              color: SHARE_CARD_COLORS.ink500,
            }}
          >
            {payload.verified_stamp}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            marginTop: payload.verified_stamp ? 10 : 0,
            fontSize: domainSize,
            fontWeight: 700,
            color: SHARE_CARD_COLORS.ink900,
          }}
        >
          {payload.qr_domain}
        </div>
      </div>
      {qrDataUri && qrSize ? (
        // eslint-disable-next-line @next/next/no-img-element -- satori 只认 <img>
        <img alt="" height={qrSize} src={qrDataUri} width={qrSize} />
      ) : null}
    </div>
  );
}

/**
 * 竖版 3:4 分享卡。尺寸由调用方给(`SHARE_CARD_PORTRAIT`),这里只负责版式。
 */
export function ShareCardPortrait({
  payload,
  chip,
  qrDataUri,
}: {
  payload: ShareCardPayloadV3;
  chip: ShareCardChip | null;
  qrDataUri: string | null;
}): ReactElement {
  const type = SHARE_CARD_PORTRAIT_TYPE;
  const nameEn = englishNameLine(payload);
  // 900 - 64×2 padding = 772 的可用宽度。
  const availableWidth = SHARE_CARD_PORTRAIT.width - 128;
  const name = fitSchoolName(
    payload.name_zh,
    type.schoolNameZh,
    availableWidth,
    2,
    schoolNameHeightBudget({
      payload,
      hasEnglishLine: nameEn !== null,
      canvasHeight: SHARE_CARD_PORTRAIT.height,
      padding: 64,
      availableWidth,
      type,
      qrSize: PORTRAIT_QR_SIZE,
      nameMarginTop: 40,
      programMarginTop: 28,
      metricsMarginTop: 32,
      metricsLayout: "column",
    }),
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        // satori 的默认盒模型是 content-box:`height: 100%` + `padding` 会让
        // 内容总高 = 画布高 + 上下内边距,底部因此被推出画布 —— 实测
        // (`sc:R2`)二维码有 24px 落在画布外被裁掉。border-box 让内边距算在
        // 画布高度之内。
        boxSizing: "border-box",
        background: SHARE_CARD_COLORS.surface,
        // T3 卡片是 `border border-line rounded-xl`;整图即卡面,所以描边
        // 走内边框(satori 不做圆角裁切外部背景)。
        border: `1px solid ${SHARE_CARD_COLORS.line}`,
        borderRadius: SHARE_CARD_RADIUS,
        padding: 64,
        fontFamily: "Noto Sans SC",
      }}
    >
      <BrandRow chip={chip} fontSize={type.brandLine} />

      {/* 校名块的高度**恒等于** maxLines × 行高 × 字号,与校名长度无关
          (`fitSchoolName` 已在文本层降字号/截断)。`height` + `overflow`
          是最后一道结构性保险:即使估宽算错一两个字,多出来的行也只会被
          裁掉,绝不会把指标与页脚推出画布。 */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 40,
          height: Math.round(
            name.fontSize * SCHOOL_NAME_LINE_HEIGHT * name.lines,
          ),
          overflow: "hidden",
          fontSize: name.fontSize,
          fontWeight: 700,
          lineHeight: SCHOOL_NAME_LINE_HEIGHT,
          color: SHARE_CARD_COLORS.ink900,
        }}
      >
        {name.text}
      </div>
      {nameEn ? (
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            marginTop: 16,
            fontSize: type.schoolNameEn,
            color: SHARE_CARD_COLORS.ink400,
          }}
        >
          {nameEn}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 28,
          fontSize: type.program,
          fontWeight: 700,
          color: SHARE_CARD_COLORS.ink700,
        }}
      >
        {`${payload.program_zh} · ${payload.degree_abbr}`}
      </div>

      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 32,
          width: "100%",
        }}
      >
        <Metrics
          labelSize={type.metricLabel}
          layout="column"
          payload={payload}
          valueSize={type.metricValue}
        />
      </div>

      {/* 撑开:核实戳与二维码永远贴底,指标多少不影响页脚位置。 */}
      <div style={{ display: "flex", flexGrow: 1 }} />

      <Footer
        domainSize={type.domain}
        payload={payload}
        qrDataUri={qrDataUri}
        qrSize={PORTRAIT_QR_SIZE}
        stampSize={type.stamp}
      />
    </div>
  );
}

/**
 * OG 横版变体(1200×630)。同一视觉语言,内容更精简:指标横排、不放二维码
 * —— 链接预览本身就是可点的,二维码在这个场景没有用途,占掉的位置反而挤压
 * 校名(§2.3「内容可比竖版更精简」)。
 */
export function ShareCardOg({
  payload,
  chip,
}: {
  payload: ShareCardPayloadV3;
  chip: ShareCardChip | null;
}): ReactElement {
  const type = SHARE_CARD_OG_TYPE;
  const nameEn = englishNameLine(payload);
  // 1200 - 56×2 padding = 1088 的可用宽度。
  const availableWidth = SHARE_CARD_OG.width - 112;
  const name = fitSchoolName(
    payload.name_zh,
    type.schoolNameZh,
    availableWidth,
    2,
    schoolNameHeightBudget({
      payload,
      hasEnglishLine: nameEn !== null,
      canvasHeight: SHARE_CARD_OG.height,
      padding: 56,
      availableWidth,
      type,
      // 横版不放二维码,页脚高度只由文字决定。
      qrSize: 0,
      nameMarginTop: 32,
      programMarginTop: 18,
      metricsMarginTop: 32,
      metricsLayout: "row",
    }),
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        // satori 的默认盒模型是 content-box:`height: 100%` + `padding` 会让
        // 内容总高 = 画布高 + 上下内边距,底部因此被推出画布 —— 实测
        // (`sc:R2`)二维码有 24px 落在画布外被裁掉。border-box 让内边距算在
        // 画布高度之内。
        boxSizing: "border-box",
        background: SHARE_CARD_COLORS.surface,
        border: `1px solid ${SHARE_CARD_COLORS.line}`,
        padding: 56,
        fontFamily: "Noto Sans SC",
      }}
    >
      <BrandRow chip={chip} fontSize={type.brandLine} />

      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 32,
          // 同竖版:固定高度 + 裁切,保证页脚不被顶出画布。
          height: Math.round(
            name.fontSize * SCHOOL_NAME_LINE_HEIGHT * name.lines,
          ),
          overflow: "hidden",
          fontSize: name.fontSize,
          fontWeight: 700,
          lineHeight: SCHOOL_NAME_LINE_HEIGHT,
          color: SHARE_CARD_COLORS.ink900,
        }}
      >
        {name.text}
      </div>
      {nameEn ? (
        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: type.schoolNameEn,
            color: SHARE_CARD_COLORS.ink400,
          }}
        >
          {nameEn}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          marginTop: 18,
          fontSize: type.program,
          fontWeight: 700,
          color: SHARE_CARD_COLORS.ink700,
        }}
      >
        {`${payload.program_zh} · ${payload.degree_abbr}`}
      </div>

      <div style={{ display: "flex", marginTop: 32, width: "100%" }}>
        <Metrics
          labelSize={type.metricLabel}
          layout="row"
          payload={payload}
          valueSize={type.metricValue}
        />
      </div>

      <div style={{ display: "flex", flexGrow: 1 }} />

      <Footer
        domainSize={type.domain}
        payload={payload}
        qrDataUri={null}
        qrSize={null}
        stampSize={type.stamp}
      />
    </div>
  );
}

/**
 * 把元素树里所有可见文字收集出来,用于字体子集请求。
 *
 * 走树而不是「把 payload 的字段手拼一遍」:手拼漏一段,漏掉的那段在图上
 * 就是豆腐块,而且不会有任何报错。走树意味着只要它被画出来,它的字形就
 * 一定被请求过。
 */
export function collectElementText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectElementText).join("");
  if (typeof node === "object" && "props" in node) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    const { type, props } = element;
    // 函数组件在这一步还没被调用,先展开再收集 —— 否则整张卡只会收集到
    // 最外层那几个字符串。
    if (typeof type === "function") {
      const rendered = (type as (p: unknown) => ReactNode)(props);
      return collectElementText(rendered);
    }
    return collectElementText(props?.children ?? null);
  }
  return "";
}
