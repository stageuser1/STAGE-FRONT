/**
 * T4 (AI-ready 层) pure-rule tests: JSON-LD mapping, the sitemap entry
 * generator, robots.ts, sitemap.ts, and llms.txt content.
 *
 * Companion to `tests/program_v3_rendering.test.mjs` — same split rationale
 * (see that file's header): everything decidable without a rendered
 * document lives here, `node --test`, no jsdom.
 *
 * Fixtures are built inline, not imported from `data/v3/mock-programs.ts`,
 * for the same reason as the T3 file: that module goes through the `@/`
 * alias, which `--experimental-strip-types` does not resolve, and importing
 * it would let an unrelated fixture edit silently change what this file
 * asserts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

import {
  buildProgramJsonLd,
  buildSchoolJsonLd,
  pruneObject,
} from "../lib/program-v3/json-ld.ts";
import { buildProgramSitemapEntries } from "../lib/program-v3/sitemap-entries.ts";
import { realProgramsV3 } from "../data/v3/real-programs.ts";
import { SITE_URL } from "../lib/site-config.ts";
import robots from "../app/robots.ts";
import sitemap from "../app/sitemap.ts";
/**
 * Next's *actual* serializer for `MetadataRoute.Robots`/`MetadataRoute.Sitemap`
 * — the same function the framework calls at request time to turn our
 * plain-object route data into the text a crawler receives. Importing it
 * directly lets this file assert on the real served bytes without booting a
 * server (T4-R1: Codex flagged the original "XML schema check" and "robots
 * content" claims as one-off manual curls with nothing pinning them).
 *
 * This is an internal, undocumented Next path (verified against
 * `next@15.5.22`, this repo's pinned version). If a Next upgrade moves or
 * renames it, this import throws and these tests fail loudly — that failure
 * is the correct signal to find the new path, not something to work around
 * with a try/catch that would silently stop testing the real output.
 */
import {
  resolveRobots,
  resolveSitemap,
} from "next/dist/build/webpack/loaders/metadata/resolve-route-data.js";

/** A sentinel string standing in for `editorial_note` content: if this ever
 * shows up anywhere in a JSON-LD payload, the isolation the blueprint's §0.3
 * / §1.3 requires ("编辑观点...永不进入...JSON-LD") has been broken. */
const EDITORIAL_SENTINEL = "编辑观点专用哨兵文本-不得出现在JSON-LD里";

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
    // 元,不是万(T3-R6)
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
    editorial_note: {
      short_positioning: EDITORIAL_SENTINEL,
      key_difficulty: EDITORIAL_SENTINEL,
    },
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

describe("pruneObject:「宁缺毋假」应用到机读输出", () => {
  test("A1 递归删除 null / undefined / 空字符串 / 空数组键", () => {
    const out = pruneObject({
      a: null,
      b: undefined,
      c: "",
      d: [],
      e: { f: null, g: "keep" },
      h: ["keep", null, ""],
    });
    assert.deepEqual(out, { e: { g: "keep" }, h: ["keep"] });
  });

  test("A2 不误删有意义的假值(0)", () => {
    const out = pruneObject({ zero: 0, falseFlag: false });
    assert.equal(out.zero, 0);
    assert.equal(out.falseFlag, false);
  });
});

describe("EducationalOrganization / EducationalOccupationalProgram 字段映射", () => {
  test("B1 中文名为 name,英文名降级为 alternateName(核心原则 6)", () => {
    const org = buildSchoolJsonLd(program());
    assert.equal(org.name, "茱莉亚音乐学院");
    assert.equal(org.alternateName, "The Juilliard School");
  });

  test("B2 中文校名缺失时,英文名是唯一的 name,不再重复为 alternateName", () => {
    const org = buildSchoolJsonLd(
      program({
        school: {
          slug: "mdw-wien",
          school_name: "Universität für Musik und darstellende Kunst Wien",
          school_name_zh: null,
          city: "Vienna",
          country: "Austria",
          country_code: "AT",
        },
      }),
    );
    assert.equal(org.name, "Universität für Musik und darstellende Kunst Wien");
    assert.equal(org.alternateName, undefined);
  });

  test("B3 country_code 为 null 时,addressCountry 整键消失(不填空字符串)", () => {
    const org = buildSchoolJsonLd(
      program({
        school: {
          slug: "x",
          school_name: "X School",
          school_name_zh: null,
          city: "Somewhere",
          country: "Nowhere",
          country_code: null,
        },
      }),
    );
    assert.equal("addressCountry" in org.address, false);
    assert.equal(org.address.addressLocality, "Somewhere");
  });

  test("B4 educationalCredentialAwarded 组合学位中文名与缩写", () => {
    const jsonLd = buildProgramJsonLd(program(), "/v3-preview/juilliard/voice-bm");
    assert.equal(jsonLd.educationalCredentialAwarded, "音乐学士 BM");
  });

  test("B5 timeToComplete 是 ISO 8601 时长;duration_years 为 null 或 0 时整键消失", () => {
    const withDuration = buildProgramJsonLd(program(), "/p");
    assert.equal(withDuration.timeToComplete, "P4Y");

    const noDuration = buildProgramJsonLd(
      program({ offering: { ...program().offering, duration_years: null } }),
      "/p",
    );
    assert.equal("timeToComplete" in noDuration, false);

    // T4-R2 (Codex): 0 是真实可能值(数据填错,或按学期计的项目在提取阶段
    // 被错误折算成 0 年),不是只测 null 就够——`!years` 的 falsy 判断对
    // 0 和 null 是同一条路径,但这条路径此前只被 null 走过,没被 0 走过。
    const zeroDuration = buildProgramJsonLd(
      program({ offering: { ...program().offering, duration_years: 0 } }),
      "/p",
    );
    assert.equal(
      "timeToComplete" in zeroDuration,
      false,
      "duration_years: 0 不应该产出 P0Y —— 0 年不是一个可信的时长声称",
    );
  });

  test("B6 application_deadline 为 null 时,applicationDeadline 整键消失", () => {
    const jsonLd = buildProgramJsonLd(
      program({
        application: { ...program().application, application_deadline: null },
      }),
      "/p",
    );
    assert.equal("applicationDeadline" in jsonLd, false);
  });

  test("B7 pageUrl 为 null(Mode F 未生成 slug)时,url 与 @id 都不输出", () => {
    const jsonLd = buildProgramJsonLd(program(), null);
    assert.equal("url" in jsonLd, false);
    assert.equal("@id" in jsonLd, false);
    // provider 的 @id 不受影响 —— 学校本身仍有稳定标识
    assert.ok(jsonLd.provider["@id"].includes("juilliard"));
  });

  test("B8 url 存在时是绝对地址,拼的是 SITE_URL + 当前可用路由", () => {
    const jsonLd = buildProgramJsonLd(program(), "/v3-preview/juilliard/voice-bm");
    assert.equal(jsonLd.url, `${SITE_URL}/v3-preview/juilliard/voice-bm`);
    assert.equal(jsonLd["@id"], `${jsonLd.url}#program`);
  });
});

/**
 * T4-R1 (Codex): the original C1 only sentineled `editorial_note` while
 * every other free-text field stayed empty. That leaves the test unable to
 * tell "editorial_note is filtered" apart from "everything is filtered" —
 * a checker that stripped the whole object would pass it too. This fixture
 * sentinels *every* free-text field on `ProgramV3` with a distinct string,
 * so the assertions below prove an allowlist (only the fields §2.4 actually
 * asks for survive), not an accidental blanket strip.
 */
const NEVER_LEAK = {
  editorialShortPositioning: "哨兵-编辑观点-定位-不得出现",
  editorialKeyDifficulty: "哨兵-编辑观点-难点-不得出现",
  englishWaiverPolicy: "哨兵-语言豁免政策-不得出现",
  internationalApplicantNotes: "哨兵-国际生备注-不得出现",
  applicationConditionalNotes: "哨兵-申请条件说明-不得出现",
  auditionSpecialNotes: "哨兵-试音特殊说明-不得出现",
  auditionConditionalNotes: "哨兵-试音条件说明-不得出现",
  repertoireSummary: "哨兵-曲目要求全文-不得出现",
  videoRequirements: "哨兵-视频要求-不得出现",
  transcriptRequirements: "哨兵-成绩单要求-不得出现",
  sourceQuote: "哨兵-原文引用-不得出现",
  answerSentenceZh: "哨兵-导语原文-不得出现于JSON-LD",
};

function kitchenSinkProgram(overrides = {}) {
  return program({
    application: {
      ...program().application,
      transcript_requirements: NEVER_LEAK.transcriptRequirements,
      english_waiver_policy: NEVER_LEAK.englishWaiverPolicy,
      international_applicant_notes: NEVER_LEAK.internationalApplicantNotes,
      conditional_notes: NEVER_LEAK.applicationConditionalNotes,
    },
    audition: {
      ...program().audition,
      repertoire_summary: NEVER_LEAK.repertoireSummary,
      video_requirements: NEVER_LEAK.videoRequirements,
      special_notes: NEVER_LEAK.auditionSpecialNotes,
      conditional_notes: NEVER_LEAK.auditionConditionalNotes,
    },
    editorial_note: {
      short_positioning: NEVER_LEAK.editorialShortPositioning,
      key_difficulty: NEVER_LEAK.editorialKeyDifficulty,
    },
    publishing: {
      ...program().publishing,
      answer_sentence_zh: NEVER_LEAK.answerSentenceZh,
      cost_estimate_rmb: cnyCost(),
    },
    sources: [
      {
        source_url: "https://example.edu/x",
        source_title: "X",
        retrieved_date: "2026-07-01",
        source_quote: NEVER_LEAK.sourceQuote,
        related_field: "audition_requirements",
        confidence_level: "High",
      },
    ],
    ...overrides,
  });
}

describe("editorial_note 永不进入 JSON-LD(铁律,§0.3 / §1.3)", () => {
  test("C1 kitchen-sink fixture:每个自由文本字段各有独立哨兵,JSON-LD 里一个都不出现", () => {
    const jsonLd = buildProgramJsonLd(
      kitchenSinkProgram(),
      "/v3-preview/juilliard/voice-bm",
    );
    const serialized = JSON.stringify(jsonLd);
    for (const [field, sentinel] of Object.entries(NEVER_LEAK)) {
      assert.equal(
        serialized.includes(sentinel),
        false,
        `${field} 的哨兵文本泄漏进了 JSON-LD: ${sentinel}`,
      );
    }
    // 结构性保证:字段名本身也不在输出的键里(不是靠字符串巧合没撞上)
    for (const key of [
      "short_positioning",
      "key_difficulty",
      "english_waiver_policy",
      "international_applicant_notes",
      "conditional_notes",
      "special_notes",
      "repertoire_summary",
      "video_requirements",
      "transcript_requirements",
      "source_quote",
      "answer_sentence_zh",
    ]) {
      assert.equal(serialized.includes(key), false, `键名 ${key} 出现在了 JSON-LD 里`);
    }
  });

  test("C2 白名单校验:同一个 kitchen-sink fixture 里,理应出现的映射字段确实都在(证明不是整体清空)", () => {
    const jsonLd = buildProgramJsonLd(
      kitchenSinkProgram(),
      "/v3-preview/juilliard/voice-bm",
    );
    assert.equal(jsonLd.name, "声乐");
    assert.equal(jsonLd.provider.name, "茱莉亚音乐学院");
    assert.equal(jsonLd.provider.address.addressLocality, "New York");
    assert.equal(jsonLd.educationalCredentialAwarded, "音乐学士 BM");
    assert.equal(jsonLd.applicationDeadline, "2026-12-01");
    assert.ok(jsonLd.offers, "kitchen-sink fixture 用的是形态① cnyCost(),offers 应该出现");
  });

  test("C3 多种费用形态 × 多种 editorial_note 状态的交叉组合,隔离仍然成立", () => {
    const variants = [
      kitchenSinkProgram(), // 形态①,editorial_note 有值
      kitchenSinkProgram({ editorial_note: null }), // editorial_note 为 null
      kitchenSinkProgram({
        publishing: {
          ...kitchenSinkProgram().publishing,
          cost_estimate_rmb: null, // 无费用数据
        },
      }),
    ];
    for (const variant of variants) {
      const serialized = JSON.stringify(
        buildProgramJsonLd(variant, "/v3-preview/juilliard/voice-bm"),
      );
      for (const sentinel of Object.values(NEVER_LEAK)) {
        assert.equal(serialized.includes(sentinel), false);
      }
    }
  });
});

describe("费用只在形态①②输出(形态③是真数字,但不是「年总费用」声称)", () => {
  test("D1 形态①(官方 CoA,汇率齐全)→ offers 出现,单位是实际人民币金额", () => {
    const jsonLd = buildProgramJsonLd(
      program({ publishing: { ...program().publishing, cost_estimate_rmb: cnyCost() } }),
      "/p",
    );
    assert.equal(jsonLd.offers.priceSpecification.priceCurrency, "CNY");
    // min/max 已经是元(T3-R6),JSON-LD 的 price 原样使用,不再 ×10000
    assert.equal(jsonLd.offers.priceSpecification.minPrice, 550000);
    assert.equal(jsonLd.offers.priceSpecification.maxPrice, 660000);
  });

  test("D2 形态②(config_estimate 生活费)→ offers 同样出现", () => {
    const jsonLd = buildProgramJsonLd(
      program({
        publishing: {
          ...program().publishing,
          cost_estimate_rmb: cnyCost({
            components: [
              tuitionComponent(),
              livingComponent({ source_type: "config_estimate" }),
            ],
          }),
        },
      }),
      "/p",
    );
    assert.ok(jsonLd.offers);
  });

  test("D3 形态③(非 CNY,如 GBP 学费)→ 不输出 offers", () => {
    const jsonLd = buildProgramJsonLd(
      program({
        publishing: {
          ...program().publishing,
          cost_estimate_rmb: {
            min: 32000,
            max: 32000,
            currency: "GBP",
            components: [tuitionComponent({ currency: "GBP", value: 32000 })],
            methodology_version: "v3",
          },
        },
      }),
      "/p",
    );
    assert.equal("offers" in jsonLd, false);
  });

  test("D4 CNY 标记但 fx_rate 缺失 → 降级为③,不输出 offers", () => {
    const jsonLd = buildProgramJsonLd(
      program({
        publishing: {
          ...program().publishing,
          cost_estimate_rmb: cnyCost({ fx_rate: undefined }),
        },
      }),
      "/p",
    );
    assert.equal("offers" in jsonLd, false);
  });

  test("D5 只有学费、没有生活费组件 → 降级为③,不输出 offers(T3-R5.2 同一判定)", () => {
    const jsonLd = buildProgramJsonLd(
      program({
        publishing: {
          ...program().publishing,
          cost_estimate_rmb: cnyCost({ components: [tuitionComponent()] }),
        },
      }),
      "/p",
    );
    assert.equal("offers" in jsonLd, false);
  });

  test("D6 cost_estimate_rmb 为 null → 不输出 offers", () => {
    const jsonLd = buildProgramJsonLd(program(), "/p");
    assert.equal("offers" in jsonLd, false);
  });
});

describe("sitemap 条目生成器:lastmod 接 max(retrieved_date),不接构建时间", () => {
  test("E1 无 slug 或无 sources 的 program 不产生条目(不收空壳页)", () => {
    const noSlug = program({ publishing: { ...program().publishing, slug: null } });
    const noSources = program(); // sources: []
    assert.deepEqual(buildProgramSitemapEntries([noSlug, noSources]), []);
  });

  test("E2 lastModified 是来源里最晚的 retrieved_date,不是 Date.now()", () => {
    const withSources = program({
      sources: [
        { source_url: "https://a.example/x", source_title: null, retrieved_date: "2026-06-01", source_quote: null, related_field: "x", confidence_level: "High" },
        { source_url: "https://a.example/y", source_title: null, retrieved_date: "2026-07-19", source_quote: null, related_field: "y", confidence_level: "High" },
      ],
    });
    const [entry] = buildProgramSitemapEntries([withSources]);
    assert.equal(entry.lastModified, "2026-07-19");
    assert.equal(entry.url, `${SITE_URL}/schools/juilliard/voice-bm`);
  });
});

/**
 * A10's regression guard. `validator.schema.org` was run once, by hand, on
 * 2026-08-03 against exactly the shape `buildProgramJsonLd` produces (see
 * T4_CLAIMS_MATRIX.md's "交付时人工验证项" section for that dated record) —
 * it flagged `inLanguage` (not valid on `EducationalOccupationalProgram`)
 * and `unitText` (not valid on `PriceSpecification`), both since removed.
 *
 * This whitelist is *pinned from that one external run*, not a live
 * revalidation — there is no network call here. What it buys automatically,
 * going forward: if this file's mapping ever grows a property outside this
 * list, the test below fails immediately instead of silently shipping an
 * unrecognized key that nobody re-checks against schema.org until the next
 * manual run. Growing the list back requires re-running the real validator
 * once and noting the date, same as the first time — not just editing this
 * array to make the test pass.
 */
const SCHEMA_ORG_ALLOWED_PROPERTIES = {
  EducationalOccupationalProgram: [
    "name",
    "provider",
    "educationalCredentialAwarded",
    "timeToComplete",
    "applicationDeadline",
    "offers",
    "url",
  ],
  EducationalOrganization: ["name", "alternateName", "address", "url"],
  PostalAddress: [
    "addressLocality",
    "addressCountry",
    "streetAddress",
    "postalCode",
    "addressRegion",
  ],
  Offer: ["priceSpecification", "price", "priceCurrency", "url"],
  PriceSpecification: ["priceCurrency", "minPrice", "maxPrice", "price"],
};
const JSON_LD_KEYWORDS = new Set(["@type", "@id", "@context"]);

function assertKnownSchemaOrgProperties(node, path = "$") {
  if (Array.isArray(node)) {
    node.forEach((item, i) => assertKnownSchemaOrgProperties(item, `${path}[${i}]`));
    return;
  }
  if (node === null || typeof node !== "object") return;

  const type = node["@type"];
  const allowedForType = type && SCHEMA_ORG_ALLOWED_PROPERTIES[type];
  for (const [key, value] of Object.entries(node)) {
    if (!JSON_LD_KEYWORDS.has(key) && allowedForType) {
      assert.ok(
        allowedForType.includes(key),
        `${path}.${key}: 不在 ${type} 的 schema.org 白名单里(pinned 2026-08-03)`,
      );
    }
    assertKnownSchemaOrgProperties(value, `${path}.${key}`);
  }
}

describe("schema.org 已知属性白名单(A10 的自动化回归护栏,离线,不调用外部服务)", () => {
  test("A10 buildProgramJsonLd 的输出只使用白名单里的属性名(kitchen-sink fixture,形态①费用)", () => {
    const jsonLd = buildProgramJsonLd(
      kitchenSinkProgram(),
      "/v3-preview/juilliard/voice-bm",
    );
    assertKnownSchemaOrgProperties(jsonLd);
  });
});

describe("I1/I3:JSON-LD 与 sitemap 的路径完全来自 programDetailHref,不硬编码当前路由", () => {
  test("I1a lib/program-v3/json-ld.ts 源码不含字面量 v3-preview", () => {
    const src = readFileSync(
      fileURLToPath(new URL("../lib/program-v3/json-ld.ts", import.meta.url)),
      "utf-8",
    );
    assert.equal(src.includes("v3-preview"), false);
  });

  test("I1b lib/program-v3/sitemap-entries.ts 源码不含字面量 v3-preview", () => {
    const src = readFileSync(
      fileURLToPath(new URL("../lib/program-v3/sitemap-entries.ts", import.meta.url)),
      "utf-8",
    );
    assert.equal(src.includes("v3-preview"), false);
  });

  test("I3 buildProgramJsonLd 的 url/@id 完全由传入的 pageUrl 参数决定 —— 换一个假想的未来路由,输出原样跟着变", () => {
    // T3b 迁移后的形状,这里只是证明 json-ld.ts 没有把 /v3-preview 拼死在
    // 任何地方——它不知道、也不关心调用者传的是哪个路由方案。
    const hypotheticalFutureUrl = "/schools/juilliard/voice-bm";
    const jsonLd = buildProgramJsonLd(program(), hypotheticalFutureUrl);
    assert.equal(jsonLd.url, `${SITE_URL}${hypotheticalFutureUrl}`);
    assert.equal(jsonLd["@id"], `${SITE_URL}${hypotheticalFutureUrl}#program`);
  });
});

describe("app/robots.ts", () => {
  const result = robots();

  test("F1 通配规则放行常规抓取,disallow 只列 /api/ 与预览路由", () => {
    const wildcard = result.rules.find((r) => r.userAgent === "*");
    assert.equal(wildcard.allow, "/");
    assert.deepEqual(wildcard.disallow, ["/api/", "/v3-preview/"]);
  });

  test("F2 每个具名 AI 爬虫都显式放行,且与通配规则的 disallow 一致", () => {
    for (const ua of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      const rule = result.rules.find((r) => r.userAgent === ua);
      assert.ok(rule, `missing rule for ${ua}`);
      assert.equal(rule.allow, "/");
      assert.deepEqual(rule.disallow, ["/api/", "/v3-preview/"]);
    }
  });

  test("F3 sitemap 字段指向 SITE_URL 之下的 /sitemap.xml", () => {
    assert.equal(result.sitemap, `${SITE_URL}/sitemap.xml`);
  });

  /**
   * T4-R1 (Codex): the original E5 claim ("curl 模拟 GPTBot UA") was a
   * one-off manual command against a dev server, nothing pinned it. This
   * runs our route data through Next's *actual* text serializer
   * (`resolveRobots`, imported above) and asserts on the real bytes a
   * crawler receives — offline, no server, no curl.
   */
  test("F4 resolveRobots 产出的真实 robots.txt 文本含预期的 Disallow / Sitemap 行", () => {
    const text = resolveRobots(result);
    assert.ok(text.includes("Disallow: /v3-preview/"));
    assert.ok(text.includes("Disallow: /api/"));
    assert.ok(text.includes("User-Agent: GPTBot"));
    assert.ok(text.includes("User-Agent: ClaudeBot"));
    assert.ok(text.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
  });
});

describe("app/sitemap.ts", () => {
  /**
   * T3b (2026-08-05 ruling): partial migration. The sitemap includes the root
   * plus every real (Mode-F-backed) program page at its
   * `/schools/{school}/{slug}` production URL. `data/v3/mock-programs.ts`
   * never appears here: it only ever backed the disallowed `/v3-preview/`
   * surface and has no production route, so listing it would repeat the
   * self-contradiction this test used to guard against.
   *
   * 2026-08-06:真实语料从 1 所 4 个专业扩到 20 所 1778 个。G1/G4 原来逐条
   * 列出 5 个 URL,于是**数据变多本身**让它们变红 —— 而这两条要守的东西
   * (根域名在、每个可路由的真实项目都在且只有它们、mock/v3-preview 一个不
   * 进)与语料规模无关。期望集合改为从 `realProgramsV3` 现算:逐条列 1779 个
   * URL 既读不动,也会在下次加校时再红一次。
   */
  const EXPECTED_SITEMAP_URLS = [
    SITE_URL,
    ...realProgramsV3
      .filter((program) => program.publishing.slug !== null)
      .map(
        (program) =>
          `${SITE_URL}/schools/${program.school.slug}/${program.publishing.slug}`,
      ),
  ].sort();

  test("G1 根域名 + 全部真实(有生产路由)项目,mock 项目不出现", () => {
    const result = sitemap();
    const urls = result.map((entry) => entry.url).sort();
    assert.deepEqual(urls, EXPECTED_SITEMAP_URLS);
    for (const url of urls) {
      assert.ok(!url.includes("v3-preview"), url);
    }
  });

  /**
   * T4-R1 (Codex): the original G4 claim ("sitemap 通过 XML schema 校验")
   * was a one-off manual jsdom parse of a curl'd response body, nothing
   * pinned it. This runs the real Next XML serializer (`resolveSitemap`)
   * offline and validates the actual produced XML with jsdom's
   * `DOMParser` — the same check, but reproducible in CI without a server.
   */
  test("G4 resolveSitemap 产出的真实 XML 是合法文档,符合 sitemaps.org schema", () => {
    const xml = resolveSitemap(sitemap());
    const dom = new JSDOM();
    const doc = new dom.window.DOMParser().parseFromString(xml, "application/xml");
    assert.equal(doc.getElementsByTagName("parsererror").length, 0);
    assert.equal(doc.documentElement.tagName, "urlset");
    assert.equal(
      doc.documentElement.getAttribute("xmlns"),
      "http://www.sitemaps.org/schemas/sitemap/0.9",
    );
    const locs = [...doc.getElementsByTagName("loc")].map((n) => n.textContent).sort();
    assert.deepEqual(locs, EXPECTED_SITEMAP_URLS);
  });
});

describe("public/llms.txt", () => {
  const content = readFileSync(
    fileURLToPath(new URL("../public/llms.txt", import.meta.url)),
    "utf-8",
  );

  test("H1 非空,且点名站点定位(先留学 / studyabroadfirst.cn)", () => {
    assert.ok(content.length > 0);
    assert.ok(content.includes("先留学"));
    assert.ok(content.includes("studyabroadfirst.cn"));
  });

  test("H2 说明数据可溯源到官网来源与核实日期", () => {
    assert.ok(content.includes("retrieved_date") || content.includes("核实日期") || content.includes("核实"));
    assert.ok(content.includes("来源"));
  });

  test("H3 声明编辑观点与事实的隔离(不进入 JSON-LD / 导语)", () => {
    assert.ok(content.includes("编辑观点"));
    assert.ok(content.includes("JSON-LD"));
  });
});
