/**
 * T5(Share Card / OG 图片服务 / 微信分享)的纯规则测试。
 *
 * 与 T3 的 `program_v3_rendering.test.mjs`、T4 的 `program_v3_ai_ready.test.mjs`
 * 同一个 runner(`node --test --experimental-strip-types`),同一条分工:
 * 不需要文档就能断言的东西全部在这里;需要 JSX 转换的模板元素树在
 * `tests/dom/share-card-v3.dom.test.tsx`(那个 runner 才认 `.tsx`)。
 *
 * fixture 沿用 T3/T4 的做法就地构造,不 import `data/v3/mock-programs.ts`
 * (它通过 `@/` 别名做值导入,strip-types 不解析别名),唯一的例外是
 * **真实数据**:`data/v3/real/juilliard-vocal-arts-pilot.json` 是纯 JSON,
 * 配上同样只做类型导入的 `package-adapter.ts`,可以直接在这里跑。
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import jsQR from "jsqr";
import sharp from "sharp";

import { adaptCanonicalPackage } from "../lib/program-v3/package-adapter.ts";
import {
  buildShareCardPayload,
  SHARE_CARD_MAX_METRICS,
  shareCardMetrics,
  shareCardQrUrl,
  shareCardVerifiedStamp,
} from "../lib/program-v3/share-card.ts";
import { SHARE_CARD_METRIC_RULES } from "../data/v3/share-card-metric-rules.ts";
import { SHARE_CARD_COLORS } from "../lib/program-v3/share-card-tokens.ts";
import { qrSvg } from "../lib/program-v3/qr.ts";
import { buildWechatShareConfig } from "../lib/wechat/share-config.ts";
import { SITE_URL } from "../lib/site-config.ts";

const realPackage = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL("../data/v3/real/juilliard-vocal-arts-pilot.json", import.meta.url),
    ),
    "utf8",
  ),
);

/** 编辑观点/自由文本哨兵,手法同 T4 的 `ai:C1`。 */
const SENTINEL = "编辑观点专用哨兵文本-不得出现在分享卡上";

function program(overrides = {}) {
  return {
    school: {
      slug: "juilliard",
      school_name: "The Juilliard School",
      school_name_zh: "茱莉亚音乐学院",
      city: "New York",
      country: "United States",
      country_code: "US",
      ...(overrides.school ?? {}),
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
      program_url: "https://www.juilliard.edu/music/programs/voice",
      ...(overrides.offering ?? {}),
    },
    application: {
      admission_cycle: "Fall 2026",
      application_deadline: "2026-12-01",
      application_fee: 150,
      application_fee_currency: "USD",
      required_materials: [],
      transcript_requirements: null,
      recommendation_letters: null,
      resume_required: "Unknown",
      essay_required: "Unknown",
      portfolio_required: "Unknown",
      english_language_tests: ["TOEFL"],
      toefl_minimum: 100,
      ielts_minimum: 7,
      duolingo_minimum: null,
      english_requirement_status: "Required",
      english_waiver_policy: null,
      international_applicant_notes: null,
      conditional_notes: null,
      ...(overrides.application ?? {}),
    },
    audition: {
      admission_cycle: "Fall 2026",
      prescreening_required: "Yes",
      prescreening_deadline: null,
      audition_required: "Yes",
      audition_format: "Live or Recorded",
      repertoire_summary: null,
      video_requirements: null,
      file_format_requirements: null,
      accompaniment_requirements: null,
      special_notes: null,
      conditional_notes: null,
      ...(overrides.audition ?? {}),
    },
    editorial_note:
      overrides.editorial_note === undefined
        ? { short_positioning: "编辑写的定位", key_difficulty: "编辑写的难点" }
        : overrides.editorial_note,
    publishing: {
      slug: "voice-bm",
      answer_sentence_zh: "导语句",
      cost_estimate_rmb: null,
      badges: [],
      freshness_flag: {
        status: "current_season",
        last_verified: "2026-07-17",
        days_since_update: 16,
      },
      ...(overrides.publishing ?? {}),
    },
    sources: overrides.sources ?? [
      {
        source_url: "https://www.juilliard.edu/music/programs/voice",
        source_title: "Voice",
        retrieved_date: "2026-07-17",
        source_quote: null,
        related_field: "audition_requirements",
        confidence_level: "High",
      },
    ],
    related_program_refs: [],
  };
}

const officialCost = {
  // 元,不是万(T3-R6)
  min: 550000,
  max: 660000,
  currency: "CNY",
  components: [
    {
      item: "tuition",
      value: 53300,
      currency: "USD",
      source_type: "official",
      period: "per_year",
    },
    {
      item: "living_cost",
      value_min: 28000,
      value_max: 35000,
      currency: "USD",
      source_type: "official",
      composition_note: "含住宿、餐饮、书籍、交通及学生医保(校方公布)",
    },
  ],
  fx_rate: 7.12,
  fx_snapshot_date: "2026-07-01",
  methodology_version: "v3",
};

/**
 * 蓝图 §1.4 逐字写死的 `share_card_payload` 字段,**七个**:
 * `{name_zh, name_en, program_zh, degree_abbr, metrics, verified_stamp, qr_url}`。
 *
 * `qr_domain` **不在这七个里** —— 它是 T5 为了在二维码旁显示域名而新增的实现
 * 扩展(裁决 T5-R2 / Codex 第二轮 #2)。这里把两者分开列,是因为初版把八个字段一起说成
 * 「§1.4 定义的字段」,等于让测试去验证一份并不存在的规格:没人回查蓝图原文
 * 的话,这条会一直绿着,而 payload 已经偏离契约。同族问题见 T3 的「矩阵指向
 * 不存在的断言」与 T4 的「手工动作伪装成测试」。
 */
const BLUEPRINT_PAYLOAD_FIELDS = [
  "degree_abbr",
  "metrics",
  "name_en",
  "name_zh",
  "program_zh",
  "qr_url",
  "verified_stamp",
];
const T5_PAYLOAD_EXTENSIONS = ["qr_domain"];
const PAYLOAD_FIELDS = [
  ...BLUEPRINT_PAYLOAD_FIELDS,
  ...T5_PAYLOAD_EXTENSIONS,
].sort();

/**
 * payload 的字段级契约:字段集合、每个字段的类型与取值约束。
 *
 * 抽成函数是为了让 **mock 与真实数据跑同一套约束**(裁决 T5-R2 / Codex 第二轮 #3):
 * 只在 mock 上验证过的契约,证明不了真实项目的 payload 也守规矩。
 */
function assertPayloadContract(payload, label) {
  assert.deepEqual(Object.keys(payload).sort(), PAYLOAD_FIELDS, label);

  for (const field of ["name_zh", "name_en", "program_zh", "degree_abbr"]) {
    assert.equal(typeof payload[field], "string", `${label} ${field} 类型`);
    assert.ok(payload[field].length > 0, `${label} ${field} 非空`);
    assert.equal(payload[field], payload[field].trim(), `${label} ${field} 无首尾空白`);
  }

  assert.ok(Array.isArray(payload.metrics), `${label} metrics 是数组`);
  assert.ok(
    payload.metrics.length <= SHARE_CARD_MAX_METRICS,
    `${label} metrics ≤ 3`,
  );
  for (const metric of payload.metrics) {
    assert.deepEqual(
      Object.keys(metric).sort(),
      ["label", "metric_key", "value"],
      `${label} metric 字段集合`,
    );
    for (const field of ["metric_key", "label", "value"]) {
      assert.equal(typeof metric[field], "string", `${label} metric.${field} 类型`);
      // 「永不出现空位」:空字符串或只剩分隔符都算空位。
      assert.ok(metric[field].trim().length > 0, `${label} metric.${field} 非空`);
    }
    assert.ok(
      SHARE_CARD_METRIC_RULES.some((r) => r.metric_key === metric.metric_key),
      `${label} metric_key 必须来自配置层规则`,
    );
  }

  assert.ok(
    payload.verified_stamp === null || typeof payload.verified_stamp === "string",
    `${label} verified_stamp 是 string | null`,
  );
  if (typeof payload.verified_stamp === "string") {
    assert.ok(payload.verified_stamp.trim().length > 0, `${label} 核实戳非空`);
  }

  assert.equal(typeof payload.qr_url, "string", `${label} qr_url 类型`);
  assert.ok(payload.qr_url.startsWith(`${SITE_URL}`), `${label} qr_url 绝对地址`);
  assert.equal(payload.qr_domain, "studyabroadfirst.cn", `${label} qr_domain`);
}

const values = (metrics) => metrics.map((m) => m.value);
const keys = (metrics) => metrics.map((m) => m.metric_key);

describe("A. share_card_payload 装配(§1.4)", () => {
  test("sc:A1 中文校名缺失 → 回退英文校名,name_en 仍是英文名", () => {
    const payload = buildShareCardPayload(
      program({ school: { school_name_zh: null } }),
    );
    assert.equal(payload.name_zh, "The Juilliard School");
    assert.equal(payload.name_en, "The Juilliard School");
  });

  test("sc:A2 中文专业名缺失 → 回退官方英文项目名", () => {
    const payload = buildShareCardPayload(
      program({ offering: { program_name_zh: null } }),
    );
    assert.equal(payload.program_zh, "Voice");
    assert.equal(payload.degree_abbr, "BM");
  });

  test("sc:A3 中文齐全时用中文(核心原则 6)", () => {
    const payload = buildShareCardPayload(program());
    assert.equal(payload.name_zh, "茱莉亚音乐学院");
    assert.equal(payload.program_zh, "声乐");
    assert.equal(payload.qr_domain, "studyabroadfirst.cn");
  });

  test("sc:A4 payload 的**每一个字段**都被断言过,且没有多余字段", () => {
    // T5-R1 #3:A1 原来只由 `sc:A3`(三个字段)+ `sc:E1`(哨兵不出现)兜着,
    // 声称的范围大于断言的范围。这条把 §1.4 列的字段逐个钉死,并断言
    // 结构里没有第八个字段 —— 多出来的字段就是「投影发明了新事实」的入口。
    const payload = buildShareCardPayload(
      program({ publishing: { cost_estimate_rmb: officialCost } }),
    );
    // 字段集合 = 蓝图 §1.4 的七个 + T5 的扩展 `qr_domain`,两者分开声明,
    // 不把扩展说成蓝图定义(裁决 T5-R2 / Codex 第二轮 #2)。
    assert.deepEqual(Object.keys(payload).sort(), PAYLOAD_FIELDS);
    assert.deepEqual(BLUEPRINT_PAYLOAD_FIELDS.sort(), [
      "degree_abbr",
      "metrics",
      "name_en",
      "name_zh",
      "program_zh",
      "qr_url",
      "verified_stamp",
    ]);
    for (const field of BLUEPRINT_PAYLOAD_FIELDS) {
      assert.ok(field in payload, `蓝图字段缺失:${field}`);
    }
    assertPayloadContract(payload, "mock 茱莉亚声乐 BM");
    assert.deepEqual(payload, {
      name_zh: "茱莉亚音乐学院",
      name_en: "The Juilliard School",
      program_zh: "声乐",
      degree_abbr: "BM",
      metrics: [
        {
          metric_key: "language_requirement",
          label: "语言要求",
          value: "TOEFL 100 / IELTS 7",
        },
        {
          metric_key: "prescreening_audition",
          label: "预筛/试音",
          value: "需预筛 · 现场或录像试音",
        },
        {
          metric_key: "deadline",
          label: "截止日期",
          value: "2026年12月1日",
        },
      ],
      verified_stamp: "官网核实 2026年7月",
      qr_url: `${SITE_URL}/schools/juilliard/voice-bm`,
      qr_domain: "studyabroadfirst.cn",
    });
  });
});

describe("B. 指标规则(§1.2 share_card_metric_rules)", () => {
  test("sc:B1 指标按传入配置的 priority 升序取值(本仓库镜像的配置即语言>预筛/试音>截止>费用)", () => {
    const metrics = shareCardMetrics(
      program({ publishing: { cost_estimate_rmb: officialCost } }),
    );
    assert.deepEqual(keys(metrics), [
      "language_requirement",
      "prescreening_audition",
      "deadline",
    ]);
  });

  test("sc:B2 四条规则都有值时也**永不超过 3 个**,被挤掉的是最低优先级", () => {
    const metrics = shareCardMetrics(
      program({ publishing: { cost_estimate_rmb: officialCost } }),
    );
    assert.equal(metrics.length, SHARE_CARD_MAX_METRICS);
    assert.ok(!keys(metrics).includes("total_cost"));
  });

  test("sc:B3 顺序由 priority 决定,不是数组书写顺序", () => {
    // 把数组顺序完全打乱,priority 不变 —— 结果必须一样。
    const shuffled = [...SHARE_CARD_METRIC_RULES].reverse();
    const metrics = shareCardMetrics(
      program({ publishing: { cost_estimate_rmb: officialCost } }),
      shuffled,
    );
    assert.deepEqual(keys(metrics), [
      "language_requirement",
      "prescreening_audition",
      "deadline",
    ]);
  });

  test("sc:B4 缺失的规则不占位,由低优先级补位(fallback_when_missing)", () => {
    const metrics = shareCardMetrics(
      program({
        application: {
          toefl_minimum: null,
          ielts_minimum: null,
          duolingo_minimum: null,
          english_requirement_status: "Unknown",
        },
        publishing: { cost_estimate_rmb: officialCost },
      }),
    );
    assert.deepEqual(keys(metrics), [
      "prescreening_audition",
      "deadline",
      "total_cost",
    ]);
  });

  test("sc:B5 **永不出现空位**:任何一条指标的 label / value 都非空", () => {
    const cases = [
      program(),
      program({ publishing: { cost_estimate_rmb: officialCost } }),
      program({ application: { application_deadline: null } }),
      program({
        application: { english_requirement_status: "Not Required" },
        audition: { prescreening_required: "Unknown", audition_format: "Unknown" },
      }),
      program({
        application: {
          application_deadline: null,
          toefl_minimum: null,
          ielts_minimum: null,
          english_requirement_status: "Unknown",
        },
        audition: { prescreening_required: "Unknown", audition_format: "Unknown" },
        publishing: { cost_estimate_rmb: null },
      }),
    ];
    for (const p of cases) {
      const metrics = shareCardMetrics(p);
      assert.ok(metrics.length <= SHARE_CARD_MAX_METRICS);
      for (const metric of metrics) {
        assert.ok(metric.label.length > 0, "label 不得为空");
        assert.ok(metric.value.length > 0, "value 不得为空");
        assert.ok(!/^[\s·-]*$/.test(metric.value), "value 不得只有分隔符");
      }
    }
    // 全都没有 → 空数组,而不是三个空位。
    assert.deepEqual(shareCardMetrics(cases.at(-1)), []);
  });

  test("sc:B6 语言要求:分数优先,显式 Not Required 才允许「无需」措辞", () => {
    assert.deepEqual(values(shareCardMetrics(program())).slice(0, 1), [
      "TOEFL 100 / IELTS 7",
    ]);
    assert.equal(
      shareCardMetrics(
        program({
          application: {
            toefl_minimum: null,
            ielts_minimum: null,
            english_requirement_status: "Not Required",
          },
        }),
      )[0].value,
      "无需语言成绩",
    );
    assert.equal(
      shareCardMetrics(
        program({
          application: {
            toefl_minimum: null,
            ielts_minimum: null,
            english_requirement_status: "Required",
          },
        }),
      )[0].value,
      "需要语言成绩",
    );
    assert.equal(
      shareCardMetrics(
        program({
          application: {
            toefl_minimum: null,
            ielts_minimum: null,
            english_requirement_status: "Conditional",
          },
        }),
      )[0].value,
      "有条件要求",
    );
    // Optional / Unknown 都说不出有效信息 → 让位,不写「暂无」。
    for (const status of ["Optional", "Unknown"]) {
      const metrics = shareCardMetrics(
        program({
          application: {
            toefl_minimum: null,
            ielts_minimum: null,
            english_requirement_status: status,
          },
        }),
      );
      assert.ok(!keys(metrics).includes("language_requirement"));
    }
  });

  test("sc:B7 Duolingo 分数同样入选,三项齐全时按 TOEFL/IELTS/Duolingo 排列", () => {
    const metrics = shareCardMetrics(
      program({ application: { duolingo_minimum: 120 } }),
    );
    assert.equal(metrics[0].value, "TOEFL 100 / IELTS 7 / Duolingo 120");
  });

  test("sc:B8 预筛/试音:两字段各自可缺;Varies 不自造措辞", () => {
    assert.equal(
      shareCardMetrics(program())[1].value,
      "需预筛 · 现场或录像试音",
    );
    assert.equal(
      shareCardMetrics(
        program({ audition: { prescreening_required: "No" } }),
      )[1].value,
      "无需预筛 · 现场或录像试音",
    );
    // Varies:五态词表里没有对应措辞 → 只说试音形式。
    assert.equal(
      shareCardMetrics(
        program({ audition: { prescreening_required: "Varies" } }),
      )[1].value,
      "现场或录像试音",
    );
    // 形式未知但预筛已知 → 只说预筛。
    assert.equal(
      shareCardMetrics(
        program({ audition: { audition_format: "Unknown" } }),
      )[1].value,
      "需预筛",
    );
    // 两者都未知 → 整条消失。
    assert.ok(
      !keys(
        shareCardMetrics(
          program({
            audition: {
              prescreening_required: "Unknown",
              audition_format: "Unknown",
            },
          }),
        ),
      ).includes("prescreening_audition"),
    );
  });

  test("sc:B9 总费用直接复用 T3 的 costBlockLine headline,不另造措辞", () => {
    const metrics = shareCardMetrics(
      program({
        application: { application_deadline: null },
        publishing: { cost_estimate_rmb: officialCost },
      }),
    );
    const cost = metrics.find((m) => m.metric_key === "total_cost");
    assert.equal(cost.value, "¥55–66 万元人民币");
    // 形态③(非 CNY)同样原样取用,包括自限定的「不含生活费」。
    const tuitionOnly = shareCardMetrics(
      program({
        application: { application_deadline: null },
        publishing: {
          cost_estimate_rmb: {
            min: 61300,
            max: 61300,
            currency: "USD",
            components: [
              {
                item: "tuition",
                value: 61300,
                currency: "USD",
                source_type: "official",
                period: "per_year",
              },
            ],
            methodology_version: "v3",
          },
        },
      }),
    ).find((m) => m.metric_key === "total_cost");
    assert.equal(tuitionOnly.value, "USD 61,300/年（学费,不含生活费）");
  });

  test("sc:B10 enabled: false 的规则不参与选取", () => {
    const rules = SHARE_CARD_METRIC_RULES.map((rule) =>
      rule.metric_key === "language_requirement"
        ? { ...rule, enabled: false }
        : rule,
    );
    const metrics = shareCardMetrics(
      program({ publishing: { cost_estimate_rmb: officialCost } }),
      rules,
    );
    assert.deepEqual(keys(metrics), [
      "prescreening_audition",
      "deadline",
      "total_cost",
    ]);
  });

  test("sc:B11 fallback_when_missing: false → 不许低优先级顶位,但也不留空位", () => {
    const rules = SHARE_CARD_METRIC_RULES.map((rule) =>
      rule.metric_key === "language_requirement"
        ? { ...rule, fallback_when_missing: false }
        : rule,
    );
    const metrics = shareCardMetrics(
      program({
        application: {
          toefl_minimum: null,
          ielts_minimum: null,
          english_requirement_status: "Unknown",
        },
        publishing: { cost_estimate_rmb: officialCost },
      }),
      rules,
    );
    assert.deepEqual(keys(metrics), []);
  });
});

describe("C. 核实戳", () => {
  test("sc:C1 freshness=changed 时不盖核实戳,改用 T3 的变更措辞", () => {
    assert.equal(
      shareCardVerifiedStamp(
        program({
          publishing: {
            freshness_flag: {
              status: "changed",
              last_verified: "2026-06-01",
              days_since_update: 63,
            },
          },
        }),
      ),
      "官网内容有变更,信息更新中",
    );
  });

  test("sc:C2 last_verified → 「官网核实 YYYY年M月」", () => {
    assert.equal(shareCardVerifiedStamp(program()), "官网核实 2026年7月");
  });

  test("sc:C3 last_verified 缺失 → 回退 max(retrieved_date)(与 T4 引用块同一来源)", () => {
    assert.equal(
      shareCardVerifiedStamp(
        program({
          publishing: {
            freshness_flag: {
              status: "unknown",
              last_verified: null,
              days_since_update: null,
            },
          },
          sources: [
            {
              source_url: "https://example.edu/a",
              source_title: null,
              retrieved_date: "2025-09-02",
              source_quote: null,
              related_field: "application_requirements",
              confidence_level: "Low",
            },
            {
              source_url: "https://example.edu/b",
              source_title: null,
              retrieved_date: "2026-02-11",
              source_quote: null,
              related_field: "application_requirements",
              confidence_level: "Low",
            },
          ],
        }),
      ),
      "官网核实 2026年2月",
    );
  });

  test("sc:C4 两者都没有 → null(整个戳不渲染,不写「暂无」)", () => {
    assert.equal(
      shareCardVerifiedStamp(
        program({
          publishing: {
            freshness_flag: {
              status: "unknown",
              last_verified: null,
              days_since_update: null,
            },
          },
          sources: [],
        }),
      ),
      null,
    );
  });
});

describe("D. 二维码地址(裁决 T5-R2)", () => {
  test("sc:D1 有 slug → 指向**该项目**详情页绝对地址,不是首页", () => {
    const url = shareCardQrUrl(program());
    assert.equal(url, `${SITE_URL}/schools/juilliard/voice-bm`);
    assert.notEqual(url, SITE_URL);
  });

  test("sc:D2 无 slug → 回退站点首页(人类 2026-08-03 裁决:版式完整优先)", () => {
    assert.equal(
      shareCardQrUrl(program({ publishing: { slug: null } })),
      SITE_URL,
    );
  });

  test("sc:D3 share-card.ts 源码不含硬编码的 v3-preview 字面量(同 T4 的 I1)", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../lib/program-v3/share-card.ts", import.meta.url)),
      "utf8",
    );
    assert.ok(!source.includes("v3-preview"));
  });

  test("sc:D4 生成的二维码能被解码回同一个 URL(不是「画了个方块」)", async () => {
    const url = shareCardQrUrl(program());
    const svg = await qrSvg(url);
    // SVG → 位图 → jsQR 解码,走的是「扫码器看到什么」这条路径。
    const { data, info } = await sharp(Buffer.from(svg))
      .resize({ width: 360, kernel: "nearest" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    assert.ok(decoded, "二维码未能解码");
    assert.equal(decoded.data, url);
  });
});

describe("E. editorial_notes 永不进入分享卡(§0.3 铁律)", () => {
  const kitchenSink = program({
    editorial_note: {
      short_positioning: `${SENTINEL}-定位`,
      key_difficulty: `${SENTINEL}-难点`,
    },
    application: {
      english_waiver_policy: `${SENTINEL}-豁免`,
      international_applicant_notes: `${SENTINEL}-国际生`,
      conditional_notes: `${SENTINEL}-申请条件`,
      transcript_requirements: `${SENTINEL}-成绩单`,
    },
    audition: {
      repertoire_summary: `${SENTINEL}-曲目`,
      video_requirements: `${SENTINEL}-视频`,
      accompaniment_requirements: `${SENTINEL}-伴奏`,
      special_notes: `${SENTINEL}-特别说明`,
      conditional_notes: `${SENTINEL}-试音条件`,
    },
    publishing: {
      answer_sentence_zh: `${SENTINEL}-导语`,
      cost_estimate_rmb: officialCost,
    },
    sources: [
      {
        source_url: "https://www.juilliard.edu/music/programs/voice",
        source_title: `${SENTINEL}-来源标题`,
        retrieved_date: "2026-07-17",
        source_quote: `${SENTINEL}-原文引用`,
        related_field: "audition_requirements",
        confidence_level: "High",
      },
    ],
  });

  test("sc:E1 13 处自由文本哨兵与字段名都不出现在 payload 里", () => {
    const serialized = JSON.stringify(buildShareCardPayload(kitchenSink));
    assert.ok(!serialized.includes(SENTINEL));
    for (const field of [
      "editorial_note",
      "short_positioning",
      "key_difficulty",
      "english_waiver_policy",
      "international_applicant_notes",
      "conditional_notes",
      "transcript_requirements",
      "repertoire_summary",
      "video_requirements",
      "accompaniment_requirements",
      "special_notes",
      "answer_sentence_zh",
      "source_quote",
    ]) {
      assert.ok(!serialized.includes(field), `payload 里出现了 ${field}`);
    }
  });

  test("sc:E2 正向对照:该映射出来的字段确实原样出现(不是把对象清空了)", () => {
    const payload = buildShareCardPayload(kitchenSink);
    assert.equal(payload.name_zh, "茱莉亚音乐学院");
    assert.equal(payload.program_zh, "声乐");
    assert.equal(payload.degree_abbr, "BM");
    assert.ok(payload.metrics.length > 0);
    assert.ok(payload.verified_stamp);
  });

  test("sc:E3 share-card.ts 源码里没有 editorial_note 的读取路径", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../lib/program-v3/share-card.ts", import.meta.url)),
      "utf8",
    );
    assert.ok(!/program\.editorial_note/.test(source));
  });

  test("sc:E4 微信分享文案同样不含任何哨兵", () => {
    const config = buildWechatShareConfig(kitchenSink);
    assert.ok(!JSON.stringify(config).includes(SENTINEL));
  });
});

describe("F. 微信 JS-SDK 分享内容", () => {
  test("sc:F1 标题 = 中文校名 + 专业 + 学位;链接与图片都是绝对地址", () => {
    const config = buildWechatShareConfig(program());
    assert.equal(config.title, "茱莉亚音乐学院 声乐 · BM");
    assert.equal(config.link, `${SITE_URL}/schools/juilliard/voice-bm`);
    assert.equal(
      config.imgUrl,
      `${SITE_URL}/schools/juilliard/voice-bm/share-card`,
    );
  });

  test("sc:F2 描述 = 分享卡上的同一批指标、同一套措辞", () => {
    const config = buildWechatShareConfig(program());
    const payload = buildShareCardPayload(program());
    assert.equal(
      config.desc,
      payload.metrics.map((m) => `${m.label} ${m.value}`).join(" · "),
    );
  });

  test("sc:F3 指标为空 → 退到 Mode F 导语;导语也没有 → 退到品牌行", () => {
    const bare = {
      application: {
        application_deadline: null,
        toefl_minimum: null,
        ielts_minimum: null,
        english_requirement_status: "Unknown",
      },
      audition: { prescreening_required: "Unknown", audition_format: "Unknown" },
    };
    assert.equal(
      buildWechatShareConfig(program({ ...bare })).desc,
      "导语句",
    );
    assert.equal(
      buildWechatShareConfig(
        program({ ...bare, publishing: { answer_sentence_zh: null } }),
      ).desc,
      "先留学 · 不鸽,只先到",
    );
  });

  test("sc:F4 无 slug → 返回 null(没有落地页就不配分享,不拿首页冒充项目页)", () => {
    assert.equal(buildWechatShareConfig(program({ publishing: { slug: null } })), null);
  });
});

describe("G. 视觉 token 与 T3 保持同一套值(过渡方案)", () => {
  const tailwind = readFileSync(
    fileURLToPath(new URL("../tailwind.config.ts", import.meta.url)),
    "utf8",
  );

  test("sc:G1 分享卡用的每个色值都能在 tailwind.config.ts 里找到", () => {
    for (const [name, value] of Object.entries(SHARE_CARD_COLORS)) {
      // 白色与 Tailwind 默认调色板(red-50/600)不在这个配置文件里,单独放行。
      if (["surface", "red50", "red600"].includes(name)) continue;
      assert.ok(
        tailwind.includes(value),
        `${name} = ${value} 在 tailwind.config.ts 里找不到 —— T3 改色了但分享卡没跟上`,
      );
    }
  });

  test("sc:G2 §2.3 的品牌深蓝/暖金**没有**出现在本轮实现里(过渡方案)", () => {
    const serialized = JSON.stringify(SHARE_CARD_COLORS).toUpperCase();
    assert.ok(!serialized.includes("0A1F4D"));
    assert.ok(!serialized.includes("F4C870"));
    assert.equal(SHARE_CARD_COLORS.surface, "#FFFFFF");
  });
});

describe("I. OG image 的绝对地址来源", () => {
  test("sc:I1 metadataBase 走 SITE_URL 单一来源,不再硬编码域名", () => {
    const layout = readFileSync(
      fileURLToPath(new URL("../app/layout.tsx", import.meta.url)),
      "utf8",
    );
    // `opengraph-image` 注入的 og:image 是绝对地址,主机名取自 metadataBase。
    // 之前这里写死的是 `https://stage.app`(不是本站域名),外部抓到的分享图
    // 链接会指向一个我们不控制的主机。
    assert.ok(layout.includes("metadataBase: new URL(SITE_URL)"));
    assert.ok(!/metadataBase:\s*new URL\("https?:\/\//.test(layout));
    assert.ok(!layout.includes("stage.app"));
  });
});

describe("H. 真实数据(T1b 茱莉亚包)", () => {
  const realPrograms = adaptCanonicalPackage(realPackage);

  test("sc:H1 真实包装配出的 4 条项目,payload 逐条满足与 mock 同一套字段契约", () => {
    // T5-R2 #3/#4:原来这条声称「完整 payload」,实际只查了三个字符串非空 +
    // qr_url 前缀。现在真实数据跑的是 `assertPayloadContract` —— 与 `sc:A4`
    // 里 mock 跑的**同一个**契约函数:字段集合(蓝图七字段 + qr_domain)、
    // 每个字段的类型、非空、metrics ≤3 且无空位、metric_key 必须来自配置层。
    assert.equal(realPrograms.length, 4);
    for (const p of realPrograms) {
      const payload = buildShareCardPayload(p);
      assertPayloadContract(payload, `真实 ${p.publishing.slug}`);
      // 这里用的是适配器的原始输出,school slug 就是包里的 `juilliard`
      // (T3b 生产路由用的正是这个未加后缀的值;`-t1b` 后缀只在
      // `data/v3/preview-registry.ts` 里为 `/v3-preview` 预览面单独加)。
      assert.equal(
        payload.qr_url,
        `${SITE_URL}/schools/juilliard/${p.publishing.slug}`,
      );
    }
  });

  test("sc:H2 真实数据同样 ≤3 指标、无空位", () => {
    for (const p of realPrograms) {
      const metrics = shareCardMetrics(p);
      assert.ok(metrics.length <= SHARE_CARD_MAX_METRICS);
      for (const metric of metrics) {
        assert.ok(metric.label.length > 0 && metric.value.length > 0);
      }
    }
  });

  test("sc:H3 四条真实项目逐字段断言(不是只测一条 voice-bm)", () => {
    // T5-R1 #2:原来只深测了 voice-bm,而四条里 DMA 最特殊(费用为 null)。
    // 这里把四条的**校名/专业/学位/三条指标/核实戳/二维码**全部钉死,
    // 值全部取自 `data/v3/real/juilliard-vocal-arts-pilot.json` 的实际字段。
    const expected = {
      "voice-bm": {
        degree_abbr: "BM",
        // 真实包 toefl_minimum 73 / ielts_minimum 6
        metrics: ["TOEFL 73 / IELTS 6", "需预筛 · 多轮试音", "2025年12月2日"],
      },
      "voice-mm": {
        degree_abbr: "MM",
        metrics: ["TOEFL 89 / IELTS 6.5", "需预筛 · 多轮试音", "2025年12月2日"],
      },
      "voice-gd": {
        degree_abbr: "GD",
        metrics: ["TOEFL 89 / IELTS 6.5", "需预筛 · 多轮试音", "2025年12月2日"],
      },
      "voice-dma": {
        degree_abbr: "DMA",
        metrics: ["TOEFL 102 / IELTS 7.5", "需预筛 · 多轮试音", "2025年12月2日"],
      },
    };
    assert.deepEqual(
      realPrograms.map((p) => p.publishing.slug).sort(),
      Object.keys(expected).sort(),
    );
    for (const [slug, want] of Object.entries(expected)) {
      const p = realPrograms.find((item) => item.publishing.slug === slug);
      const payload = buildShareCardPayload(p);
      assert.equal(payload.name_zh, "茱莉亚学院", slug);
      assert.equal(payload.name_en, "The Juilliard School", slug);
      // 真实包 program_offerings.program_name_zh 为 null,中文专业名来自
      // 受控词表 fields[].field_name_zh —— 与 Mode F 取同一列。
      assert.equal(payload.program_zh, "声乐", slug);
      assert.equal(payload.degree_abbr, want.degree_abbr, slug);
      assert.deepEqual(values(payload.metrics), want.metrics, slug);
      // 四条的 freshness 都是 unknown,核实戳走 last_verified(2026-08-03)。
      assert.equal(payload.verified_stamp, "官网核实 2026年8月", slug);
      assert.equal(
        payload.qr_url,
        `${SITE_URL}/schools/juilliard/${slug}`,
        slug,
      );
    }
  });

  /**
   * DMA 的费用块是**形态④(全额学费减免)**,不是 `null`。
   *
   * 出处:T2c 裁决 2026-08-03(茱莉亚 T1b 真实数据运行)——「录取者全额学费
   * 减免」是官网公布的事实,所以 `funding_policy:
   * "full_tuition_waiver_all_admitted"` 让费用块落形态④:没有 `currency`、
   * 没有 `min`/`max`、`components` 存在且为空数组,改为携带
   * `PHRASING_V1["funding_full_waiver"]` 的 `note`。判形态④要看
   * `funding_policy` 在不在,**不是**看 `currency`(它没有 currency)。
   * 见 `stage-music-admissions-extractor/references/directus_collections_reference.md`
   * §4 与 §13,以及 `T2BC_REVIEW_HANDOFF.md` 里逐字给出的目标句子。
   *
   * 这两条(sc:H3b / sc:H5)此前钉的是 T2c **之前**的 `null`。T2bc 在提取器
   * 仓库结项时,这个仓库里的真实包从没重跑过 Mode F,所以旧期望一直没被打脸;
   * 2026-08-06 二十校上线轮重跑 Mode F 后才暴露。改的是过时的期望,不是为了
   * 让实现过关 —— 实现产出的正是裁决要求的形态。
   */
  test("sc:H3b 四条真实项目的费用形态:三条 CNY 块、DMA 为形态④全额减免", () => {
    const dma = realPrograms.find((p) => p.publishing.slug === "voice-dma");
    const waiver = dma.publishing.cost_estimate_rmb;
    assert.equal(waiver.funding_policy, "full_tuition_waiver_all_admitted");
    assert.equal(waiver.note, "录取者全额学费减免(官网公布)");
    // §13:`components` 键**总是存在**,形态④下是空数组 —— 前端因此不必区分
    // 「没有这个键」和「空」。
    assert.deepEqual(waiver.components, []);
    // 形态④没有金额、没有币种:发一个区间会是它从没做过的声称。
    assert.equal(waiver.currency, undefined);
    assert.equal(waiver.min, undefined);
    assert.equal(waiver.max, undefined);
    for (const slug of ["voice-bm", "voice-mm", "voice-gd"]) {
      const p = realPrograms.find((item) => item.publishing.slug === slug);
      assert.equal(p.publishing.cost_estimate_rmb.currency, "CNY", slug);
      // 单位缺陷(蓝图/真实数据是「元」,T3 渲染器当「万元」)记在移交文档,
      // 这里只钉住真实值是什么,免得将来悄悄变了没人发现。
      assert.equal(p.publishing.cost_estimate_rmb.min, 570000, slug);
      assert.equal(p.publishing.cost_estimate_rmb.max, 600000, slug);
    }
  });

  test("sc:H4 真实包缺 english_requirement_status → 不因为有分数就反推成 Required", () => {
    const bm = realPrograms.find((p) => p.publishing.slug === "voice-bm");
    assert.equal(bm.application.english_requirement_status, "Unknown");
    // 分数存在,所以指标仍然出得来 —— 出的是分数这个事实,不是五态判定。
    assert.equal(shareCardMetrics(bm)[0].value, "TOEFL 73 / IELTS 6");
  });

  /** 同 sc:H3b 的出处(T2c 裁决 2026-08-03):形态④没有 `min`/`max`,所以
   * 分享卡照样出不了「总费用」指标 —— 这条断言要守的行为没变,变的只是
   * 「DMA 的费用块长什么样」。 */
  test("sc:H5 真实包的 DMA(形态④全额减免,无金额)不产生费用指标", () => {
    const dma = realPrograms.find((p) => p.publishing.slug === "voice-dma");
    assert.equal(
      dma.publishing.cost_estimate_rmb.funding_policy,
      "full_tuition_waiver_all_admitted",
    );
    assert.equal(dma.publishing.cost_estimate_rmb.min, undefined);
    assert.ok(!keys(shareCardMetrics(dma)).includes("total_cost"));
  });

  test("sc:H6 真实包没有 editorial_note,分享卡输出里也不出现编辑层字段", () => {
    for (const p of realPrograms) {
      assert.equal(p.editorial_note, null);
      assert.ok(
        !JSON.stringify(buildShareCardPayload(p)).includes("editorial"),
      );
    }
  });
});
