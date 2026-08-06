/**
 * The V3 rendering rules as functions.
 *
 * Everything the blueprint's §3 渲染手册 states as a rule, and every ruling
 * T3-R3/R4/R5 settled, that can be decided without a document lives here.
 * The companion file `tests/dom/program-card-v3.dom.test.tsx` asserts only
 * what needs a rendered DOM — which elements exist, and what a crawler sees.
 *
 * The split is the repository's standing convention (see vitest.config.mts):
 * a pure rule is never asserted through a component, because a component
 * test that fails leaves you guessing whether the rule or the markup broke.
 *
 * Fixtures are built inline rather than imported from
 * `data/v3/mock-programs.ts`: that module has a value import through the
 * `@/` alias, which `--experimental-strip-types` does not resolve. Keeping
 * these local also means a mock edit cannot quietly change what a rule test
 * asserts.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  auditionFormatZh,
  conditionIsPurelyLanguage,
  costBlockLine,
  deadlineState,
  fiveStateZh,
  formatDateZh,
  formatYearMonth,
  formatYearMonthZh,
  freshnessLabel,
  icsDataUri,
  latestRetrievedDate,
  programOfferingRef,
  REPERTOIRE_TRUNCATE_LENGTH,
  sourceDomain,
  sourceUrlForField,
  truncateChars,
} from "../lib/program-v3/format.ts";

/** Wording that §3.1 forbids on any surface, in any degradation path. */
const FORBIDDEN_PLACEHOLDERS = [
  "暂无",
  "N/A",
  "n/a",
  "待确认",
  "未知",
  "不详",
  "待定",
  "以官网为准",
];

function tuitionComponent(overrides = {}) {
  return {
    item: "tuition",
    value: 50000,
    currency: "USD",
    source_type: "official",
    period: "per_year",
    ...overrides,
  };
}

function livingComponent(overrides = {}) {
  return {
    item: "living_cost",
    value_min: 28000,
    value_max: 31000,
    currency: "USD",
    source_type: "official",
    composition_note: "含住宿、餐饮、书籍、交通及学生医保(校方公布)",
    ...overrides,
  };
}

function cnyCost(overrides = {}) {
  return {
    // 元,不是万(T3-R6) — 55/66 曾是同一 bug 在 mock 与渲染代码里的共同错误假设
    min: 550000,
    max: 660000,
    currency: "CNY",
    components: [tuitionComponent(), livingComponent()],
    fx_rate: 7.12,
    fx_snapshot_date: "2026-07-01",
    methodology_version: "v3",
    ...overrides,
  };
}

function program(overrides = {}) {
  return {
    school: {
      slug: "juilliard",
      school_name: "The Juilliard School",
      school_name_zh: "茱莉亚音乐学院",
      city: "New York",
      country: "United States",
      country_code: "US",
    },
    offering: {
      school_ref: "juilliard",
      field_ref: "voice",
      degree_level_ref: "bm",
      program_name_zh: "声乐",
      official_program_name: "Voice",
      degree_level_name_zh: "音乐学士",
      degree_abbreviation: "BM",
      duration_years: 4,
      language_of_instruction: ["English"],
      program_url: null,
    },
    application: {
      admission_cycle: "Fall 2026",
      application_deadline: "2026-12-01",
      application_fee: null,
      application_fee_currency: null,
      required_materials: [],
      transcript_requirements: null,
      recommendation_letters: null,
      resume_required: "Unknown",
      essay_required: "Unknown",
      portfolio_required: "Unknown",
      english_language_tests: [],
      toefl_minimum: null,
      ielts_minimum: null,
      duolingo_minimum: null,
      english_requirement_status: "Unknown",
      english_waiver_policy: null,
      international_applicant_notes: null,
      conditional_notes: null,
    },
    audition: {
      admission_cycle: "Fall 2026",
      prescreening_required: "Unknown",
      prescreening_deadline: null,
      audition_required: "Unknown",
      audition_format: "Unknown",
      repertoire_summary: null,
      video_requirements: null,
      file_format_requirements: null,
      accompaniment_requirements: null,
      special_notes: null,
      conditional_notes: null,
    },
    editorial_note: null,
    publishing: {
      slug: "voice-bm",
      answer_sentence_zh: null,
      cost_estimate_rmb: null,
      badges: [],
      freshness_flag: {
        status: "unknown",
        last_verified: null,
        days_since_update: null,
      },
    },
    sources: [],
    related_program_refs: [],
    ...overrides,
  };
}

describe("§3.1 缺失降级:null 进 null 出,永不制造占位符", () => {
  test("A1 每个格式化函数对 null 都返回 null,而不是一个字符串", () => {
    assert.equal(formatDateZh(null), null);
    assert.equal(formatYearMonth(null), null);
    assert.equal(formatYearMonthZh(null), null);
    assert.equal(costBlockLine(null), null);
    assert.equal(deadlineState(null), null);
  });

  test("A2 无法解析的日期同样返回 null,不回落到原样输出", () => {
    assert.equal(formatDateZh("not-a-date"), null);
    assert.equal(formatDateZh(""), null);
    assert.equal(deadlineState("2026-13-99"), null);
  });

  test("A3 没有任何格式化函数会输出禁用占位词", () => {
    const outputs = [
      formatDateZh("2026-12-01"),
      formatYearMonth("2026-07-01"),
      formatYearMonthZh("2026-07-01"),
      auditionFormatZh("Live Only"),
      fiveStateZh("Not Required"),
      fiveStateZh("Conditional"),
      freshnessLabel("current_season", "Fall 2026")?.text,
      freshnessLabel("outdated_season", "Fall 2026")?.text,
      freshnessLabel("changed", "Fall 2026")?.text,
      costBlockLine(cnyCost())?.headline,
      costBlockLine(cnyCost({ currency: "GBP" }))?.headline,
    ].filter(Boolean);
    for (const output of outputs) {
      for (const banned of FORBIDDEN_PLACEHOLDERS) {
        assert.ok(
          !output.includes(banned),
          `「${banned}」 leaked into 「${output}」`,
        );
      }
    }
  });
});

describe("§3.1 null ≠ Not Required:只有显式值才可断言", () => {
  test("B1 Unknown 渲染为 null,不渲染成「无需」", () => {
    assert.equal(fiveStateZh("Unknown"), null);
    assert.equal(auditionFormatZh("Unknown"), null);
  });

  test("B2 词表外的值一律不采信", () => {
    assert.equal(fiveStateZh("yes"), null);
    assert.equal(fiveStateZh(""), null);
    assert.equal(auditionFormatZh("Live"), null);
  });

  test("B3 只有显式 Not Required 才产出「无需」措辞", () => {
    assert.equal(fiveStateZh("Not Required"), "无需");
    assert.equal(fiveStateZh("Required"), "需要");
    assert.equal(fiveStateZh("Optional"), "可选");
  });

  test("B4 第五态 Conditional 不落到需要/无需任一侧(T3-R3.8)", () => {
    const label = fiveStateZh("Conditional");
    assert.equal(label, "有条件要求");
    assert.ok(!label.startsWith("需要"));
    assert.ok(!label.startsWith("无需"));
  });
});

describe("§3.3 长文本:JS 字符截断,常量 80", () => {
  test("C1 截断常量就是蓝图写死的 80", () => {
    assert.equal(REPERTOIRE_TRUNCATE_LENGTH, 80);
  });

  test("C2 恰好 80 字不截断,81 字才截断", () => {
    const exactly = "曲".repeat(80);
    assert.deepEqual(truncateChars(exactly), {
      preview: exactly,
      isTruncated: false,
    });
    const over = "曲".repeat(81);
    const result = truncateChars(over);
    assert.equal(result.isTruncated, true);
    assert.equal(Array.from(result.preview).length, 81); // 80 + 省略号
    assert.ok(result.preview.endsWith("…"));
  });

  test("C3 按字符数而非码元截断:代理对不会被劈开", () => {
    // 每个音乐符号是一个 surrogate pair;按 .slice() 会切出半个字符
    const emoji = "𝄞".repeat(100);
    const result = truncateChars(emoji);
    assert.equal(Array.from(result.preview).length, 81);
    assert.ok(!result.preview.includes("�"));
    assert.ok(result.preview.startsWith("𝄞𝄞"));
  });

  test("C4 截断位置与设备无关:同一输入永远同一切点", () => {
    const text = "要求".repeat(100);
    assert.equal(truncateChars(text).preview, truncateChars(text).preview);
  });
});

describe("§3.4 时间态:三态由 now() vs deadline 计算,与 freshness 无关", () => {
  const now = new Date("2026-08-03T12:00:00");

  test("D1 已过 → closed", () => {
    assert.deepEqual(deadlineState("2026-08-02", now), { kind: "closed" });
  });

  test("D1b 昨天刚过的截止日必须是 closed,不得因 -0 判成开放", () => {
    // Math.ceil(-0.5) === -0,而 -0 < 0 为 false。改按日历日计算前,
    // 当天早些时候过期的项目会渲染成「距截止 -0 天」。
    for (const hour of ["00:00:01", "12:00:00", "23:59:59"]) {
      const state = deadlineState("2026-08-02", new Date(`2026-08-03T${hour}`));
      assert.deepEqual(state, { kind: "closed" }, `now=${hour}`);
    }
  });

  test("D1c 天数在一天之内不抖动:同一截止日,任何时刻同一读数", () => {
    const readings = ["00:00:01", "09:30:00", "18:45:00", "23:59:59"].map(
      (hour) => deadlineState("2026-08-21", new Date(`2026-08-03T${hour}`)).days,
    );
    assert.deepEqual(readings, [18, 18, 18, 18]);
  });

  test("D2 30 天内 → closing,带天数", () => {
    assert.deepEqual(deadlineState("2026-08-21", now), {
      kind: "closing",
      days: 18,
    });
  });

  test("D3 超过 30 天 → open", () => {
    assert.equal(deadlineState("2026-12-01", now).kind, "open");
  });

  test("D4 截止当天仍算开放,不算已截止", () => {
    assert.equal(deadlineState("2026-08-03", now).kind, "closing");
  });

  test("D5 30 天边界归入 closing,31 天归入 open", () => {
    assert.equal(deadlineState("2026-09-02", now).kind, "closing");
    assert.equal(deadlineState("2026-09-03", now).kind, "open");
  });

  test("D6 freshness 状态完全不参与截止判定", () => {
    // 同一日期,四种 freshness 下结果必须一致 —— 函数签名里就没有这个入参
    const baseline = deadlineState("2026-12-01", now);
    for (const status of [
      "current_season",
      "outdated_season",
      "changed",
      "unknown",
    ]) {
      freshnessLabel(status, "Fall 2026");
      assert.deepEqual(deadlineState("2026-12-01", now), baseline);
    }
  });
});

describe("§3.4 freshness 旗:unknown 不渲染任何状态断言", () => {
  test("E1 unknown → null,调用方因此渲染不出旗", () => {
    assert.equal(freshnessLabel("unknown", "Fall 2026"), null);
  });

  test("E2 unknown 下不存在任何「未检测到变更」类措辞可供渲染", () => {
    assert.equal(freshnessLabel("unknown", "Fall 2026"), null);
    const others = ["current_season", "outdated_season", "changed"].map(
      (s) => freshnessLabel(s, "Fall 2026").text,
    );
    // 「未检测到变更」只允许出现在 current_season 一处
    const withClaim = others.filter((t) => t.includes("未检测到变更"));
    assert.equal(withClaim.length, 1);
    assert.ok(withClaim[0].includes("Fall 2026"));
  });

  test("E3 outdated_season 把「上一申请季」前置(人类裁决的措辞)", () => {
    const label = freshnessLabel("outdated_season", "Fall 2025");
    assert.equal(label.text, "上一申请季数据 · 官网核实 Fall 2025");
    assert.equal(label.tone, "yellow");
    assert.ok(!label.text.startsWith("官网核实"));
  });

  test("E4 changed 的措辞不含申请季,且色调为红", () => {
    const label = freshnessLabel("changed", "Fall 2026");
    assert.equal(label.text, "官网内容有变更,信息更新中");
    assert.equal(label.tone, "red");
  });

  test("E5 核实月份只到月,不到日(§3.4 原文「核实月份」)", () => {
    const label = formatYearMonthZh("2025-09-02");
    assert.equal(label, "2025年9月");
    // 日被丢掉:精度到日会暗示这个状态本身并不主张的准确度
    assert.ok(!label.includes("日"));
    assert.ok(!label.includes("2日"));
  });
});

describe("§3.6 费用块:三形态一律正向判定(T3-R3.4 / R4.3 / R5.2)", () => {
  test("F1 形态①:官方 CoA 生活费 + 学费 + FX 齐全", () => {
    const line = costBlockLine(cnyCost());
    assert.equal(line.form, "official");
    assert.equal(line.headline, "¥55–66 万元人民币"); // 550000/660000 元 → 55/66 万
    assert.equal(line.configEstimateDisclaimer, null);
  });

  test("F2 形态②:config_estimate 生活费,强制输出第三方估算免责语", () => {
    const line = costBlockLine(
      cnyCost({
        components: [
          tuitionComponent(),
          livingComponent({ source_type: "config_estimate" }),
        ],
      }),
    );
    assert.equal(line.form, "config_estimate");
    assert.equal(
      line.configEstimateDisclaimer,
      "生活费为第三方估算,非院校官方数据",
    );
  });

  test("F3 形态①② 一律带汇率月份免责语,且月份取自快照日期", () => {
    for (const sourceType of ["official", "config_estimate"]) {
      const line = costBlockLine(
        cnyCost({
          components: [
            tuitionComponent(),
            livingComponent({ source_type: sourceType }),
          ],
        }),
      );
      assert.equal(
        line.fxDisclaimer,
        "按 2026-07 月均汇率估算,实际以缴费时点为准",
      );
    }
  });

  test("F4 形态③ 不带汇率与构成措辞", () => {
    const line = costBlockLine({
      min: 32000,
      max: 32000,
      currency: "GBP",
      components: [tuitionComponent({ currency: "GBP", value: 32000 })],
      methodology_version: "v3",
    });
    assert.equal(line.form, "tuition_only");
    assert.equal(line.fxDisclaimer, null);
    assert.equal(line.compositionNote, null);
    assert.equal(line.configEstimateDisclaimer, null);
    assert.ok(line.headline.includes("GBP"));
  });

  test("F5 fx_rate 缺失 → 降级形态③(T3-R3.4)", () => {
    const line = costBlockLine(cnyCost({ fx_rate: undefined }));
    assert.equal(line.form, "tuition_only");
    assert.ok(!line.headline.includes("万元人民币"));
  });

  test("F6 fx_snapshot_date 缺失 → 降级形态③", () => {
    const line = costBlockLine(cnyCost({ fx_snapshot_date: undefined }));
    assert.equal(line.form, "tuition_only");
  });

  test("F7 fx_rate 非有限或非正 → 降级,不当成有效汇率", () => {
    for (const rate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, "7.12"]) {
      assert.equal(
        costBlockLine(cnyCost({ fx_rate: rate })).form,
        "tuition_only",
        `fx_rate=${String(rate)} 应降级`,
      );
    }
  });

  test("F8 降级时币种取自 component,不取自块(块仍标 CNY)", () => {
    const line = costBlockLine(
      cnyCost({
        fx_rate: undefined,
        components: [tuitionComponent({ currency: "EUR", value: 1500 })],
      }),
    );
    assert.ok(line.headline.startsWith("EUR "));
    assert.ok(!line.headline.includes("CNY"));
    assert.ok(!line.headline.includes("¥"));
  });

  test("F9 无生活费组件 → 不判形态①,降级(T3-R4.3)", () => {
    const line = costBlockLine(cnyCost({ components: [tuitionComponent()] }));
    assert.equal(line.form, "tuition_only");
    assert.equal(line.compositionNote, null);
    assert.ok(!line.headline.includes("万元人民币"));
  });

  test("F10 无学费组件 → 不判形态①②;无学费可显示 → 整块消失(T3-R5.2)", () => {
    assert.equal(costBlockLine(cnyCost({ components: [livingComponent()] })), null);
  });

  test("F11 生活费 source_type 越界 → 降级,不猜测", () => {
    const line = costBlockLine(
      cnyCost({
        components: [
          tuitionComponent(),
          livingComponent({ source_type: "guess" }),
        ],
      }),
    );
    assert.equal(line.form, "tuition_only");
  });

  test("F12 完全无学费的形态③ → null(整块不渲染,不输出 0)", () => {
    assert.equal(
      costBlockLine({
        min: 0,
        max: 0,
        currency: "GBP",
        components: [],
        methodology_version: "v3",
      }),
      null,
    );
  });

  test("F13 构成小字只能来自 component 自带的 composition_note,不由前端编写", () => {
    const line = costBlockLine(
      cnyCost({
        components: [
          tuitionComponent(),
          livingComponent({ composition_note: undefined }),
        ],
      }),
    );
    assert.equal(line.form, "official");
    assert.equal(line.compositionNote, null);
  });

  test("F14 学费周期如实渲染,不假定按年", () => {
    const perSemester = costBlockLine({
      min: 1500,
      max: 1500,
      currency: "EUR",
      components: [
        tuitionComponent({ currency: "EUR", value: 1500, period: "per_semester" }),
      ],
      methodology_version: "v3",
    });
    assert.ok(perSemester.headline.includes("/学期"));
    assert.ok(!perSemester.headline.includes("/年"));
  });

  test("F15 T1b 真实包的原始数值(570000/600000 元)渲染为 57–60 万,不是 570000 万(T3-R6)", () => {
    // 直接抄 T1b 茱莉亚 Vocal Arts pilot 真实产出的 cost_estimate_rmb 数值
    // (data/v3/real/juilliard-vocal-arts-pilot.json),不经过 mock —— 这条
    // 存在的意义就是防止 mock 与代码再次共享同一个错误假设(T3-R6 的教训)。
    const line = costBlockLine({
      min: 570000,
      max: 600000,
      currency: "CNY",
      components: [
        {
          item: "tuition",
          value: 57200,
          source_type: "official",
          currency: "USD",
          period: "per_year",
        },
        {
          item: "living_cost",
          value_min: 28600,
          value_max: 31500,
          source_type: "config_estimate",
          currency: "USD",
          composition_note:
            "含住宿、餐饮、书籍、交通,不含学生医保(各校差异较大,以校方公布为准)",
        },
      ],
      fx_rate: 6.752,
      fx_snapshot_date: "2026-08-01",
      methodology_version: "v3",
    });
    assert.equal(line.headline, "¥57–60 万元人民币");
    // 回归红线:57 亿曾经是这个 bug 真实上线过的渲染结果
    assert.ok(!line.headline.includes("570000"));
    assert.ok(!line.headline.includes("亿"));
  });

  // 编号从 F17 起、不用 F16:矩阵里已经有一行叫 F16(JSON-LD 不再 ×10000 的
  // 声称),那一行只引用 dom:U4,和这里的测试无关 —— 复用同一个编号会让人
  // 以为两者互相印证,其实说的是完全不同的两件事(裁决 T3-R7.3)。
  test("F17 违反「万的整数倍」契约的输入:拒绝显示,降级为原币种,不是显示得好看(T3-R7.1)", () => {
    // 这三个值曾经是这个 bug 的隐蔽之处:旧实现用 toFixed() 把它们都显示成
    // 干净的「1 万」——toFixed 本身就是舍入,契约违反因此被掩盖而不是被
    // 揭穿。9999 和 10001 都不是 10000 的整数倍,12345 也不是。
    for (const bad of [9999, 10001, 12345]) {
      const line = costBlockLine(cnyCost({ min: bad, max: bad }));
      assert.equal(line.form, "tuition_only", `min=max=${bad} 应当降级`);
      assert.ok(
        !line.headline.includes("万元人民币"),
        `min=max=${bad} 不应渲染出人民币行`,
      );
    }
  });

  test("F18 只有一侧违反契约也要整体降级,不能一侧合规就蒙混过关", () => {
    const minBad = costBlockLine(cnyCost({ min: 12345, max: 660000 }));
    assert.equal(minBad.form, "tuition_only");
    const maxBad = costBlockLine(cnyCost({ min: 550000, max: 12345 }));
    assert.equal(maxBad.form, "tuition_only");
  });

  test("F19 合规的万整数倍(包括真实 T1b 取值)照常显示,不被契约校验误伤", () => {
    const line = costBlockLine(cnyCost({ min: 570000, max: 600000 }));
    assert.equal(line.form, "official");
    assert.equal(line.headline, "¥57–60 万元人民币");
  });
});

describe("§3.2 条件归属:默认独立成行(T3-R5.1)", () => {
  test("G1 Codex 用来绕过旧词表的构造,现在一律不并入英语行", () => {
    const bypasses = [
      "作品集需包含英语作品",
      "作品集中包含 IELTS 曲目",
      "面试用英语进行",
      "作品集须包含至少一部英语声乐作品",
      "试音时评委可能用英语提问",
      "推荐信须以英语撰写",
      "成绩单须附英语翻译件",
      "个人陈述须用英语写作",
      "录像中的口头介绍须使用英语",
      "申请材料须全部译为英语",
      "Portfolio must include one English-language work",
      "Interview is conducted in English",
    ];
    for (const note of bypasses) {
      assert.equal(
        conditionIsPurelyLanguage(note),
        false,
        `「${note}」 必须独立成行`,
      );
    }
  });

  test("G2 纯语言条件仍并入英语行(保守规则没有把它全否掉)", () => {
    const pure = [
      "语言成绩要求仅适用于国际申请者",
      "仅适用于非英语授课本科背景的申请者",
      "德语语言要求仅适用于计划修读教学法方向的申请者",
      "TOEFL 成绩须在两年有效期内",
      "雅思单项不得低于 6.0",
    ];
    for (const note of pure) {
      assert.equal(conditionIsPurelyLanguage(note), true, `「${note}」 应并入英语行`);
    }
  });

  test("G3 完全不含语言词 → 独立成行", () => {
    assert.equal(
      conditionIsPurelyLanguage("作品集要求视申请方向而定,电子音乐方向另有细则"),
      false,
    );
    assert.equal(conditionIsPurelyLanguage("仅预筛通过者需参加现场试音"), false);
  });

  test("G4 否决优先于命中:同时出现两类词时,否决必须赢", () => {
    // 这条就是 R5 的判定方向本身。若哪天改回「命中即并入」,此条先失败。
    assert.equal(conditionIsPurelyLanguage("语言成绩证明须随作品集一并提交"), false);
  });

  test("G5 大小写不影响判定", () => {
    assert.equal(conditionIsPurelyLanguage("PORTFOLIO must be in ENGLISH"), false);
    assert.equal(conditionIsPurelyLanguage("TOEFL scores must be recent"), true);
  });
});

describe("来源与引用:不编造链接,不落库派生值", () => {
  test("H1 无匹配来源 → null,调用方渲染无链接的纯文本", () => {
    assert.equal(sourceUrlForField(program(), "english"), null);
  });

  test("H2 related_field 匹配才返回链接,大小写不敏感", () => {
    const p = program({
      sources: [
        {
          source_url: "https://example.edu/english",
          source_title: null,
          retrieved_date: "2026-07-01",
          source_quote: null,
          related_field: "English_Language_Tests",
          confidence_level: "High",
        },
      ],
    });
    assert.equal(sourceUrlForField(p, "english"), "https://example.edu/english");
    assert.equal(sourceUrlForField(p, "audition"), null);
  });

  test("H3 数据更新时间 = max(retrieved_date),渲染时算而非落库", () => {
    const p = program({
      sources: [
        {
          source_url: "https://a.edu",
          source_title: null,
          retrieved_date: "2025-01-01",
          source_quote: null,
          related_field: "x",
          confidence_level: "High",
        },
        {
          source_url: "https://b.edu",
          source_title: null,
          retrieved_date: "2026-07-17",
          source_quote: null,
          related_field: "y",
          confidence_level: "High",
        },
      ],
    });
    assert.equal(latestRetrievedDate(p), "2026-07-17");
    assert.equal(latestRetrievedDate(program()), null);
  });

  test("H4 来源域名去掉 www,坏 URL 原样返回而不抛错", () => {
    assert.equal(sourceDomain("https://www.juilliard.edu/x"), "juilliard.edu");
    assert.equal(sourceDomain("not a url"), "not a url");
  });
});

describe("身份与订阅", () => {
  test("I1 对比键包含学校:不同学校的同专业同学位不得撞键", () => {
    const juilliard = program();
    const msm = program({
      offering: { ...program().offering, school_ref: "manhattan-school-of-music" },
    });
    assert.notEqual(programOfferingRef(juilliard), programOfferingRef(msm));
    assert.ok(programOfferingRef(juilliard).includes("juilliard"));
  });

  test("I2 无截止日 → 无 .ics(不生成一个没有日期的日历事件)", () => {
    const p = program({
      application: { ...program().application, application_deadline: null },
    });
    assert.equal(icsDataUri(p), null);
  });

  test("I3 有截止日 → .ics 内含该日期", () => {
    const uri = icsDataUri(program());
    assert.ok(uri.startsWith("data:text/calendar"));
    assert.ok(decodeURIComponent(uri).includes("DTSTART;VALUE=DATE:20261201"));
  });
});
