/**
 * T7 院校与专业浏览页 —— 纯规则层。
 *
 * 这里只放「不需要文档就能断言」的东西:分组、回退、URL 解析、两行小卡的
 * 文案、提示句的计数。凡是关于「哪些节点进了 DOM」「切换后哪张卡可见」的
 * 断言,都在 `tests/dom/schools-browse.dom.test.tsx` —— 那是关于一份文档的
 * 陈述,这个 runner 看不见。
 *
 * 设计 token 的逐值核对也在这里,但断言的是 CSS 源文件的文本,不是渲染
 * 结果:token 是冻结的确定值,「这个 hex 有没有出现在样式表里」正好是文本
 * 问题。渲染后是否真的应用到了正确的元素上,是人工验证项(见
 * T7_CLAIMS_MATRIX.md)。
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import { fixtureProgramsV3 as realProgramsV3 } from "./fixtures/real-programs.ts";
import {
  browseChipDeadline,
  browseChipTitle,
  browseHref,
  browseLede,
  buildBrowseModel,
  parseBrowsePath,
  resolveBrowseSelection,
} from "../lib/schools-browse/model.ts";

const REAL = buildBrowseModel(realProgramsV3);

/**
 * 真实语料的**规模是数据,不是契约**。2026-08-06 从 1 所扩到 20 所时,这个
 * 文件里三条断言把「1 所 / 4 个专业」写死了,于是数据变多本身让测试变红 ——
 * 而它们各自要守的规则(分组不重复、顺序即数据自身顺序、提示句从数据算)
 * 一条也没被违反。其中「提示句的院校数**从数据算出,不硬编码**」那条尤其
 * 说明问题:它自己硬编码了 1。
 *
 * 现在规模一律从 `realProgramsV3` 现算,断言只钉不变量。再加学校时这些断言
 * 仍然成立 —— 它们本来就该是这样写的。
 */
const ROUTABLE = realProgramsV3.filter((p) => p.publishing.slug !== null);
const EXPECTED_SCHOOL_SLUGS = [...new Set(ROUTABLE.map((p) => p.school.slug))];

/** A second school, so the tab row's 联动 has something to switch between —
 * cloned from the first program of the real corpus. Deep-cloned so nothing
 * here mutates the build-time singleton. */
function withSecondSchool() {
  const clone = structuredClone(realProgramsV3[0]);
  clone.school = { ...clone.school, slug: "mdw-wien", school_name_zh: "维也纳音乐与表演艺术大学" };
  clone.publishing = { ...clone.publishing, slug: "voice-mm-wien" };
  return [...realProgramsV3, clone];
}

describe("t7:model — 分组与顺序", () => {
  test("按学校分组,校内与校间都保持数据自身顺序", () => {
    // 每所学校恰好一组,组的顺序 = 数据里学校首次出现的顺序
    assert.deepEqual(
      REAL.map((s) => s.slug),
      EXPECTED_SCHOOL_SLUGS,
    );
    // 校内顺序 = 该校在数据里的专业顺序,一个不多一个不少
    for (const school of REAL) {
      assert.deepEqual(
        school.programs.map((p) => p.slug),
        ROUTABLE.filter((p) => p.school.slug === school.slug).map(
          (p) => p.publishing.slug,
        ),
        school.slug,
      );
    }
    // 茱莉亚是第一所(它是 REAL_PACKAGES 的第一个包),下面几条断言依赖这点
    assert.equal(REAL[0].slug, "juilliard");
    assert.deepEqual(
      REAL[0].programs.map((p) => p.slug),
      ["voice-bm", "voice-mm", "voice-gd", "voice-dma"],
    );
  });

  test("中文校名为主,缺失时回退英文(核心原则 6)", () => {
    assert.equal(REAL[0].nameZh, "茱莉亚学院");

    const noZh = structuredClone(realProgramsV3[0]);
    noZh.school = { ...noZh.school, school_name_zh: null };
    assert.equal(buildBrowseModel([noZh])[0].nameZh, "The Juilliard School");
  });

  test("没有 publishing.slug 的项目不进入模型 —— 它没有可推送的地址", () => {
    const noSlug = structuredClone(realProgramsV3[0]);
    noSlug.publishing = { ...noSlug.publishing, slug: null };
    assert.deepEqual(buildBrowseModel([noSlug]), []);
  });

  test("多校时每所学校只出现一次,程序落到各自校下", () => {
    const model = buildBrowseModel(withSecondSchool());
    // 真实语料原样分组,末尾多出合成的第二所 —— 学校数正好多 1,且不重复
    assert.deepEqual(
      model.map((s) => s.slug),
      [...EXPECTED_SCHOOL_SLUGS, "mdw-wien"],
    );
    assert.deepEqual(
      model.map((s) => [s.slug, s.programs.length]),
      [
        ...REAL.map((s) => [s.slug, s.programs.length]),
        ["mdw-wien", 1],
      ],
    );
  });
});

describe("t7:model — 选中态回退", () => {
  test("无参数 → 第一所学校的第一个专业(联动规则 1)", () => {
    assert.deepEqual(resolveBrowseSelection(REAL), {
      schoolSlug: "juilliard",
      programSlug: "voice-bm",
    });
  });

  test("完全匹配的一对 slug 原样选中", () => {
    assert.deepEqual(resolveBrowseSelection(REAL, "juilliard", "voice-dma"), {
      schoolSlug: "juilliard",
      programSlug: "voice-dma",
    });
  });

  test("学校对、专业不存在 → 保留学校,取该校第一个专业", () => {
    const model = buildBrowseModel(withSecondSchool());
    assert.deepEqual(resolveBrowseSelection(model, "mdw-wien", "does-not-exist"), {
      schoolSlug: "mdw-wien",
      programSlug: "voice-mm-wien",
    });
  });

  test("学校也不存在 → 整体回退到第一所第一个,不抛错", () => {
    assert.deepEqual(resolveBrowseSelection(REAL, "nope", "nope"), {
      schoolSlug: "juilliard",
      programSlug: "voice-bm",
    });
  });

  test("没有数据时返回 null,而不是造一个空选中态", () => {
    assert.equal(resolveBrowseSelection([]), null);
  });
});

describe("t7:model — URL", () => {
  test("browseHref 就是 /schools/{school}/{program}", () => {
    assert.equal(
      browseHref({ schoolSlug: "juilliard", programSlug: "voice-bm" }),
      "/schools/juilliard/voice-bm",
    );
  });

  test("parseBrowsePath 取回两段,并解码百分号转义", () => {
    assert.deepEqual(parseBrowsePath("/schools/juilliard/voice-bm"), {
      schoolSlug: "juilliard",
      programSlug: "voice-bm",
    });
    assert.deepEqual(parseBrowsePath("/schools/a%20b/c"), {
      schoolSlug: "a b",
      programSlug: "c",
    });
  });

  test("/schools 自身两段皆空,交给 resolve 去回退", () => {
    assert.deepEqual(parseBrowsePath("/schools"), {
      schoolSlug: null,
      programSlug: null,
    });
    assert.deepEqual(parseBrowsePath("/schools/juilliard"), {
      schoolSlug: "juilliard",
      programSlug: null,
    });
  });

  test("不是 /schools 开头的路径不被误认成一个选中态", () => {
    assert.deepEqual(parseBrowsePath("/v3-preview/juilliard/voice-bm"), {
      schoolSlug: null,
      programSlug: null,
    });
  });

  test("解析 → 回退 是一条闭环:任何路径都能得出一个可渲染的选中态", () => {
    for (const path of ["/schools", "/schools/x", "/schools/x/y", "/", "/schools/juilliard/voice-mm"]) {
      const { schoolSlug, programSlug } = parseBrowsePath(path);
      assert.notEqual(resolveBrowseSelection(REAL, schoolSlug, programSlug), null);
    }
  });
});

describe("t7:model — 文案", () => {
  test("小卡第一行是「中文名 · 学位缩写」", () => {
    assert.equal(browseChipTitle(REAL[0].programs[0].program), "声乐 · BM");
    assert.equal(browseChipTitle(REAL[0].programs[3].program), "声乐 · DMA");
  });

  test("中文专业名缺失时回退官方英文名,而不是丢掉主语", () => {
    const noZh = structuredClone(realProgramsV3[0]);
    noZh.offering = { ...noZh.offering, program_name_zh: null };
    assert.equal(browseChipTitle(noZh), "Voice Bachelor of Music · BM");
  });

  test("小卡第二行是「截止 {日期}」", () => {
    assert.equal(
      browseChipDeadline(REAL[0].programs[0].program),
      "截止 2025年12月2日",
    );
  });

  test("截止日为 null → 「截止日期未公布」,不是空行也不是占位符", () => {
    const noDeadline = structuredClone(realProgramsV3[0]);
    noDeadline.application = {
      ...noDeadline.application,
      application_deadline: null,
    };
    assert.equal(browseChipDeadline(noDeadline), "截止日期未公布");
  });

  // 裁决 2026-08-05(T7 交付确认第 1 条):结尾是「标注官网核实时间」而不是
  // 更强的「可溯源至官网」—— 原文证据等四个模块目前没有生产入口,承诺不能
  // 大于兑现。四个模块恢复后可以改回去(T7_REVIEW_HANDOFF.md 待办 1)。
  test("提示句不承诺溯源,只承诺标注核实时间", () => {
    const lede = browseLede(REAL, new Date("2026-08-05T00:00:00Z"));
    assert.ok(lede.endsWith("每条信息标注官网核实时间"));
    assert.ok(!lede.includes("溯源"));
  });

  test("提示句的院校数从数据算出,不硬编码", () => {
    // 数字必须是当前语料的实际学校数,不是任何写死的值
    assert.equal(
      browseLede(REAL, new Date("2026-08-05T00:00:00Z")),
      `截至 2026年8月 · 已收录 ${REAL.length} 所音乐院校 · 每条信息标注官网核实时间`,
    );
    // 多一所学校,数字必须跟着 +1 —— 这才是「从数据算出」的实质
    const twoMore = buildBrowseModel(withSecondSchool());
    assert.equal(twoMore.length, REAL.length + 1);
    assert.equal(
      browseLede(twoMore, new Date("2027-01-09T00:00:00Z")),
      `截至 2027年1月 · 已收录 ${REAL.length + 1} 所音乐院校 · 每条信息标注官网核实时间`,
    );
  });
});

describe("t7:tokens — browse.module.css 逐值核对", () => {
  const css = readFileSync(
    fileURLToPath(new URL("../components/schools/browse/browse.module.css", import.meta.url)),
    "utf8",
  );

  const COLORS = [
    "#2b44ff",
    "#e8ebff",
    "#f5f6ff",
    "#f7f8fa",
    "#ffffff",
    "#e5e7eb",
    "#f0f2f5",
    "#1b1f27",
    "#6b7280",
    "#9ca3af",
  ];
  for (const color of COLORS) {
    test(`色值 ${color} 出现在样式表里`, () => {
      assert.ok(css.includes(color), `${color} 缺失`);
    });
  }

  const SIZES = [
    ["大卡主标题", "font-size: 24px"],
    ["STAGE 品牌标识", "font-size: 20px"],
    ["三数字块数值", "font-size: 18px"],
    ["15 号一档", "font-size: 15px"],
    ["13 号一档", "font-size: 13px"],
    ["导航副标", "font-size: 12px"],
  ];
  for (const [name, decl] of SIZES) {
    test(`字号 ${name}:${decl}`, () => {
      assert.ok(css.includes(decl), `${decl} 缺失`);
    });
  }

  const SHAPES = [
    ["内容区宽", "max-width: 1200px"],
    ["导航高", "height: 64px"],
    ["大卡圆角", "border-radius: 10px"],
    ["小卡圆角", "border-radius: 8px"],
    ["胶囊/按钮圆角", "border-radius: 999px"],
    ["大卡内边距", "padding: 32px"],
    ["移动端大卡内边距", "padding: 20px"],
    ["小卡内边距", "padding: 14px 16px"],
    ["tab 内边距", "padding: 8px 18px"],
    ["小卡选中边框", "border: 1.5px solid var(--t7-brand)"],
    ["内容区上 padding", "padding-top: 40px"],
    ["内容区下 padding", "padding-bottom: 72px"],
    ["提示句→tab", "margin-top: 28px"],
    ["tab→小卡", "margin-top: 18px"],
    ["小卡→大卡", "margin-top: 40px"],
    ["导语→主标题", "margin-top: 26px"],
    ["主标题→次级行", "margin: 10px 0 0"],
    ["次级行→标签", "margin: 16px 0 0"],
    ["标签→三数字块", "margin: 44px 0 0"],
    ["数字块→详细要求", "margin: 44px 0 0"],
    ["详细要求→状态条", "margin-top: 38px"],
    ["数字块列间距", "column-gap: 32px"],
    ["小卡与 tab 间距", "gap: 12px"],
    ["当前导航项下划线", "border-bottom: 2px solid var(--t7-brand)"],
    ["移动端左右 padding", "padding-left: 16px"],
  ];
  for (const [name, decl] of SHAPES) {
    test(`${name}:${decl}`, () => {
      assert.ok(css.includes(decl), `${decl} 缺失`);
    });
  }

  test("移动端断点是 767px(< 768px)", () => {
    assert.ok(css.includes("@media (max-width: 767px)"));
  });

  test("tab 行与小卡条隐藏滚动条但仍可横向滚动", () => {
    assert.ok(css.includes("overflow-x: auto"));
    assert.ok(css.includes("scrollbar-width: none"));
    assert.ok(css.includes("::-webkit-scrollbar"));
  });

  test("字重只有 500 与 700 两个非默认档", () => {
    const weights = new Set(
      [...css.matchAll(/font-weight:\s*(\d+)/g)].map((m) => m[1]),
    );
    assert.deepEqual([...weights].sort(), ["400", "500", "700"]);
  });
});
