/**
 * T5 分享卡**模板**测试(元素树层)。
 *
 * 这个文件放在 vitest 这一侧不是因为它需要 document —— 它一次也没碰
 * `render()`;而是因为模板是 `.tsx`,`node --test --experimental-strip-types`
 * 根本解析不了 JSX,也解析不了 `data/v3/mock-programs.ts` 的 `@/` 值导入。
 * 需要 JSX 转换与别名解析的断言只能在这个 runner 里跑。纯规则(payload、
 * 指标选取、二维码、微信文案)在 `tests/program_v3_share_card.test.mjs`。
 *
 * 断言对象是 satori 的输入(React 元素树)而不是 PNG 像素:出图这一步是
 * satori/resvg 的行为,重复测它等于测第三方库;而「这张图上写了什么字、
 * 有几条指标、有没有把编辑观点画上去」全部在元素树里就已经决定了。
 * 像素层面的判断(排版是否好看、缩略图是否可读)按蓝图 §4 归人工目检。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { mockProgramsV3 } from "@/data/v3/mock-programs";
import { previewProgramsV3 } from "@/data/v3/preview-registry";
import { realProgramsV3 } from "@/data/v3/real-programs";
import type { ProgramV3 } from "@/data/v3/types";
import {
  buildShareCardPayload,
  SHARE_CARD_BRAND_LINE,
  SHARE_CARD_MAX_METRICS,
} from "@/lib/program-v3/share-card";
import {
  SHARE_CARD_OG,
  SHARE_CARD_PORTRAIT,
} from "@/lib/program-v3/share-card-tokens";
import {
  approximateEmWidth,
  collectElementText,
  fitSchoolName,
  layoutLines,
  SCHOOL_NAME_LINE_HEIGHT,
  SCHOOL_NAME_MIN_FONT_SIZE,
  ShareCardOg,
  ShareCardPortrait,
  shareCardDeadlineChip,
} from "@/lib/program-v3/share-card-template";

const FIXED_NOW = new Date("2026-08-03T09:00:00");

/** 校名可能被截断,所以文本断言只用开头一小段。8 个字符足以唯一定位这
 * 13 个 fixture 里的任何一所学校,又短到不会碰上任何一级截断。 */
const namePrefix = (name: string) => Array.from(name).slice(0, 8).join("");

function portraitText(program: ProgramV3): string {
  const payload = buildShareCardPayload(program);
  return collectElementText(
    <ShareCardPortrait
      chip={shareCardDeadlineChip(program, FIXED_NOW)}
      payload={payload}
      qrDataUri="data:image/svg+xml;base64,PHN2Zy8+"
    />,
  );
}

function ogText(program: ProgramV3): string {
  const payload = buildShareCardPayload(program);
  return collectElementText(
    <ShareCardOg
      chip={shareCardDeadlineChip(program, FIXED_NOW)}
      payload={payload}
    />,
  );
}

describe("S. 分享卡模板(§2.3)", () => {
  /**
   * 2026-08-06:真实语料从 4 条扩到 1778 条,`previewProgramsV3` 因此变成
   * 9 mock + 1778 真实 = 1787。原来写死的 `toBe(13)` 于是变红,而这条要证明的
   * 是「每个 fixture 竖版横版都能构树、都画出校名」—— 与语料规模无关。
   *
   * 改法与本轮其他同类一致:**组成关系**断言不变量(预览注册表 = mock + 真实,
   * 一个不多一个不少),**渲染循环**回到它原本的 13 个 fixture(9 个 mock 边界
   * 用例 + 茱莉亚 4 条)。把 1787 个 fixture 各渲两遍在 jsdom 里要几分钟,而
   * 多出来的 1774 条是同一批模板的重复,买不到新的覆盖。
   */
  test("sc:S1 13 个 fixture(9 mock + 4 真实)竖版与横版都能构树,且都画出校名", () => {
    expect(previewProgramsV3.length).toBe(
      mockProgramsV3.length + realProgramsV3.length,
    );
    expect(mockProgramsV3.length).toBe(9);
    // `-t1b` 是预览注册表给真实包加的碰撞规避后缀 —— 用它精确挑出真实数据,
    // 前缀匹配会连带捞到 T3 mock 里同名的茱莉亚用例。
    const juilliardPreview = previewProgramsV3.filter(
      (p) => p.school.slug === "juilliard-t1b",
    );
    expect(juilliardPreview).toHaveLength(4);
    for (const program of [...mockProgramsV3, ...juilliardPreview]) {
      const payload = buildShareCardPayload(program);
      for (const text of [portraitText(program), ogText(program)]) {
        expect(text).toContain(SHARE_CARD_BRAND_LINE);
        // 校名可能被三级溢出保护截断(极长校名),所以断言的是前缀而不是全名;
        // 「截断了没有」由 `sc:U3`/`sc:U4` 与真实渲染的 `sc:R2` 负责。
        expect(text).toContain(namePrefix(payload.name_zh));
        expect(text).toContain(payload.program_zh);
        expect(text).toContain(payload.qr_domain);
      }
    }
  });

  test("sc:S2 每张卡的指标 ≤3,且画出来的每条指标都有标签和值", () => {
    for (const program of previewProgramsV3) {
      const payload = buildShareCardPayload(program);
      expect(payload.metrics.length).toBeLessThanOrEqual(
        SHARE_CARD_MAX_METRICS,
      );
      const text = portraitText(program);
      for (const metric of payload.metrics) {
        expect(text).toContain(metric.label);
        expect(text).toContain(metric.value);
      }
    }
  });

  test("sc:S3 中文校名缺失时英文名只画一次(不是同一行字印两遍)", () => {
    const mdw = mockProgramsV3.find((p) => p.school.school_name_zh === null);
    expect(mdw).toBeDefined();
    const text = portraitText(mdw as ProgramV3);
    // 用前缀计数:回退上来的英文校名可能被截断,但无论如何只该出现一次
    // —— 出现两次就是「校名行 + 英文名行」重复画了同一串字。
    const prefix = namePrefix((mdw as ProgramV3).school.school_name);
    expect(text.split(prefix).length - 1).toBe(1);
  });

  test("sc:S4 §2.3 禁止内容一律不在树里:排名/介绍/校友/编辑观点/星级", () => {
    for (const program of previewProgramsV3) {
      for (const text of [portraitText(program), ogText(program)]) {
        for (const banned of ["排名", "介绍", "校友", "编辑观点", "★", "难度"]) {
          expect(text).not.toContain(banned);
        }
        // 编辑观点的实际内容(T3 fixture 1/3/7 都有)也不得出现。
        if (program.editorial_note) {
          expect(text).not.toContain(program.editorial_note.short_positioning);
          if (program.editorial_note.key_difficulty) {
            expect(text).not.toContain(program.editorial_note.key_difficulty);
          }
        }
      }
    }
  });

  test("sc:S5 曲目全文、豁免政策等长自由文本不会漏进分享卡", () => {
    const juilliard = mockProgramsV3[0];
    const text = portraitText(juilliard);
    expect(juilliard.audition.repertoire_summary).toBeTruthy();
    expect(text).not.toContain(juilliard.audition.repertoire_summary as string);
    expect(text).not.toContain(
      juilliard.application.english_waiver_policy as string,
    );
    expect(text).not.toContain(
      juilliard.publishing.answer_sentence_zh as string,
    );
  });

  test("sc:S6 字体子集用的文本收集会走进函数组件,不只收根节点", () => {
    // 若 collectElementText 不展开函数组件,品牌行/指标/页脚的字就全部收不到,
    // 出图时会变成豆腐块 —— 这条断言是那个静默失败的哨兵。
    const program = mockProgramsV3[0];
    const payload = buildShareCardPayload(program);
    const text = portraitText(program);
    expect(text).toContain(SHARE_CARD_BRAND_LINE); // BrandRow(函数组件)
    expect(text).toContain(payload.metrics[0].value); // Metrics(函数组件)
    expect(text).toContain(payload.qr_domain); // Footer(函数组件)
    expect(text).toContain("开放中"); // Chip(函数组件,嵌在 BrandRow 里)
  });
});

describe("T. 截止角标沿用 T3 的三态(§3.4)", () => {
  // 走 cwd 而不是 import.meta.url:jsdom 环境下 import.meta.url 不是 file: URL。
  const badgeSource = readFileSync(
    path.join(process.cwd(), "components/program/v3/DeadlineBadge.tsx"),
    "utf8",
  );

  test("sc:T1 三态措辞与 DeadlineBadge 一字不差", () => {
    const open = shareCardDeadlineChip(
      { application: { application_deadline: "2026-12-01" } } as ProgramV3,
      FIXED_NOW,
    );
    const closing = shareCardDeadlineChip(
      { application: { application_deadline: "2026-08-21" } } as ProgramV3,
      FIXED_NOW,
    );
    const closed = shareCardDeadlineChip(
      { application: { application_deadline: "2025-12-01" } } as ProgramV3,
      FIXED_NOW,
    );
    expect(open?.text).toBe("开放中");
    expect(closing?.text).toBe("距截止 18 天");
    expect(closed?.text).toBe("本季已截止,查看下季");
    // 同样三句必须仍然存在于 T3 的组件源码里 —— 任何一侧改措辞都会失败。
    expect(badgeSource).toContain("开放中");
    expect(badgeSource).toContain("距截止 ");
    expect(badgeSource).toContain("本季已截止,查看下季");
  });

  test("sc:T2 没有截止日 → 没有角标(不画一个空角标)", () => {
    expect(
      shareCardDeadlineChip(
        { application: { application_deadline: null } } as ProgramV3,
        FIXED_NOW,
      ),
    ).toBeNull();
  });
});

describe("U. 尺寸与字号(硬约束)", () => {
  test("sc:U1 竖版严格 3:4", () => {
    expect(SHARE_CARD_PORTRAIT.height / SHARE_CARD_PORTRAIT.width).toBe(4 / 3);
  });

  test("sc:U2 OG 横版 1200×630", () => {
    expect(SHARE_CARD_OG).toEqual({ width: 1200, height: 630 });
  });

  test("sc:U3 校名三级溢出保护:降字号 → 减行 → 截断,三级都可复现", () => {
    const width = 772;
    const budget = 168; // 竖版实际留给校名的高度,见 schoolNameHeightBudget

    // 第 0 级:短名维持基准字号、只占一行。
    const short = fitSchoolName("茱莉亚音乐学院", 96, width, 2, budget);
    expect(short).toMatchObject({
      text: "茱莉亚音乐学院",
      fontSize: 96,
      lines: 1,
      truncated: false,
    });

    // 第 1 级:14 字中文校名 → 降字号 + 两行,不截断。
    const long = fitSchoolName("曼海姆国立音乐与表演艺术大学", 96, width, 2, budget);
    expect(long.fontSize).toBeLessThan(96);
    expect(long.fontSize).toBeGreaterThanOrEqual(SCHOOL_NAME_MIN_FONT_SIZE);
    expect(long.lines).toBe(2);
    expect(long.truncated).toBe(false);
    expect(long.text).toBe("曼海姆国立音乐与表演艺术大学");

    // 第 2 级:高度预算被压到只够一行时,行数跟着降(而不是硬排两行溢出)。
    const squeezed = fitSchoolName("曼海姆国立音乐与表演艺术大学", 96, width, 2, 70);
    expect(squeezed.lines).toBe(1);

    // 49 字德文全称:预算够时**优先不截断** —— 降到能完整排下的字号为止。
    // (宁可字小,不可无谓截断;预算被压缩时才走第 3 级,见下面 tight 用例。)
    const german = fitSchoolName(
      "Universität für Musik und darstellende Kunst Wien",
      96,
      width,
      2,
      budget,
    );
    expect(german.truncated).toBe(false);
    expect(german.text).toBe("Universität für Musik und darstellende Kunst Wien");
    expect(german.fontSize).toBeLessThan(96);

    // 同一个名字,预算被压到只够一行时 → 第 3 级截断。
    const tight = fitSchoolName(
      "Universität für Musik und darstellende Kunst Wien",
      96,
      width,
      2,
      70,
    );
    expect(tight.truncated).toBe(true);
    expect(tight.text.endsWith("…")).toBe(true);

    // 第 3 级:再怎么降字号也排不下的长度 → 截断并带省略号。
    for (const name of ["音乐学院".repeat(20), "字".repeat(200)]) {
      const fitted = fitSchoolName(name, 96, width, 2, budget);
      expect(fitted.truncated, name.slice(0, 12)).toBe(true);
      expect(fitted.text.endsWith("…"), name.slice(0, 12)).toBe(true);
      expect(fitted.text.length).toBeLessThan(name.length);
    }
  });

  test("sc:U4 无论校名多长,校名块高度不超预算、且每一行都不超行宽", () => {
    const width = 772;
    const budget = 168;
    const names = [
      "茱莉亚音乐学院",
      "曼海姆国立音乐与表演艺术大学",
      "Universität für Musik und darstellende Kunst Wien",
      "音乐学院".repeat(20),
      "字".repeat(500),
      // T5-R2 #1:连续拉丁字符曾被当成不可断开的单个 token,于是「一行放得下」,
      // 既不换行也不截断 —— 而 U4 当时只查高度,横向溢出整个漏网。
      "A".repeat(300),
      "Hochschulefürmusikunddarstellendekunststuttgartabcdefghijklmnop",
      "上海音乐学院Shanghai-Conservatory-of-Music-International-Programme",
      "",
    ];
    for (const name of names) {
      const label = name.slice(0, 12);
      const fitted = fitSchoolName(name, 96, width, 2, budget);

      // 竖向:块高不超预算
      const height = fitted.fontSize * SCHOOL_NAME_LINE_HEIGHT * fitted.lines;
      expect(height, `校名块高度超出预算:${label}`).toBeLessThanOrEqual(budget);
      expect(fitted.lines).toBeLessThanOrEqual(2);
      expect(fitted.lines).toBeGreaterThanOrEqual(1);

      // 横向:把最终要画的文本按同一套规则排一遍,行数不能超过 fitted.lines,
      // 每行宽度也不能超过可用宽度。
      const emPerLine = width / fitted.fontSize;
      const rendered = layoutLines(fitted.text, emPerLine);
      expect(rendered.length, `实际行数超过声称行数:${label}`).toBeLessThanOrEqual(
        fitted.lines,
      );
      for (const lineText of rendered) {
        expect(
          approximateEmWidth(lineText),
          `单行宽度超出可用宽度:${label} → ${lineText.slice(0, 20)}`,
        ).toBeLessThanOrEqual(emPerLine + 1e-9);
      }
    }
  });

  test("sc:U4b 超宽单 token(长英文词/中英混排)必须被判为需要截断", () => {
    // 这条单独立出来,是因为 U4 的不变量(不超宽、不超高)在「悄悄丢字」的
    // 实现下也能满足 —— 必须同时断言这类输入确实走到了第 3 级并留下省略号。
    for (const name of [
      "A".repeat(300),
      "上海音乐学院Shanghai-Conservatory-of-Music-International-Programme-Extended",
    ]) {
      const fitted = fitSchoolName(name, 96, 772, 2, 168);
      expect(fitted.truncated, name.slice(0, 16)).toBe(true);
      expect(fitted.text.endsWith("…"), name.slice(0, 16)).toBe(true);
    }
  });

  test("sc:U5 同一输入永远得到同一结果(确定性,与渲染环境无关)", () => {
    const a = fitSchoolName("曼海姆国立音乐与表演艺术大学", 96, 772, 2, 168);
    const b = fitSchoolName("曼海姆国立音乐与表演艺术大学", 96, 772, 2, 168);
    expect(a).toEqual(b);
  });
});
