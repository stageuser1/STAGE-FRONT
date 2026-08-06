/**
 * What only a rendered document can prove about the V3 card and detail page.
 *
 * `tests/program_v3_rendering.test.mjs` already pins every rule that is a
 * function. What it cannot see is the thing §3.1 and the anti-cloaking red
 * line are actually about: **which elements reach the DOM**. A rule can
 * return `null` correctly and still leave an empty bordered `<div>` behind,
 * and a string can sit in `textContent` while being invisible on screen.
 * Both are assertions about a document, so they live here.
 *
 * Two render modes are used deliberately:
 *
 * - `renderToStaticMarkup` is what a crawler with no JavaScript sees.
 *   Effects never run, so this is the honest test of the SSR contract.
 * - `render()` hydrates and runs effects, which is where the
 *   client-computed deadline badge appears.
 *
 * The pair is the only way to state ruling T3-R3.7 as a test: the deadline
 * *date* must be in the server markup, the derived *badge* must not, and
 * the badge must nonetheless appear for a real user.
 */
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ProgramCardV3 } from "@/components/program/v3/ProgramCardV3";
import { ProgramDetailV3 } from "@/components/program/v3/ProgramDetailV3";
import { mockProgramsV3 } from "@/data/v3/mock-programs";
import { realProgramsV3 } from "@/data/v3/real-programs";
import type { ProgramV3 } from "@/data/v3/types";
import { buildProgramJsonLd } from "@/lib/program-v3/json-ld";

function bySlug(schoolSlug: string, slug: string | null): ProgramV3 {
  const found = mockProgramsV3.find(
    (p) => p.school.slug === schoolSlug && p.publishing.slug === slug,
  );
  if (!found) throw new Error(`fixture not found: ${schoolSlug}/${slug}`);
  return found;
}

/** Fixture 1 — the fullest card: every block populated. */
const FULL = bySlug("juilliard", "voice-bm");
/** Fixture 2 — cost 形态②, related to FULL. */
const FORM2 = bySlug("juilliard", "piano-bm");
/** Fixture 6 — the emptiest publishable card: no deadline, no materials,
 * no sources, no badges, no editorial note, no audition data, no zh names. */
const SPARSE = bySlug("mdw-wien", "voice-mm");
/** Fixture 4 — a non-language `conditional_notes` (portfolio). */
const PORTFOLIO_CONDITION = bySlug("manhattan-school-of-music", "composition-mm");
/** Fixture 8 — no slug, so no detail page to link to. */
const NO_SLUG = bySlug("royal-college-of-music", null);
/** Fixture 9 — official living cost but no tuition component. */
const NO_TUITION = bySlug("mdw-wien", "composition-mm");

/**
 * Elements that carry text or are structural containers. `<script>` is
 * excluded because T4's JSON-LD is machine-only by design (tier
 * `machine-only`, §1.5) and carries no rendered text.
 */
function emptyElementsIn(root: Element): string[] {
  const empties: string[] = [];
  root
    .querySelectorAll("div,dl,dt,dd,ul,li,p,section,span,details")
    .forEach((el) => {
      if (el.closest("script")) return;
      if ((el.textContent ?? "").trim() !== "") return;
      if (el.querySelector("svg")) return; // icon-only wrappers
      if (el.getAttribute("aria-hidden") === "true") return; // decorative dot
      empties.push(`${el.tagName}.${el.className}`);
    });
  return empties;
}

function staticDoc(markup: string): Document {
  return new DOMParser().parseFromString(markup, "text/html");
}

/** Rendered article text with the JSON-LD payload removed — that block is a
 * machine-only projection and must never satisfy a visible-text assertion. */
function visibleText(doc: Document): string {
  doc.querySelectorAll("script").forEach((s) => s.remove());
  return doc.querySelector("article")?.textContent ?? "";
}

function card(program: ProgramV3): Document {
  return staticDoc(renderToStaticMarkup(<ProgramCardV3 program={program} />));
}

function detail(program: ProgramV3, related: ProgramV3[] = []): Document {
  return staticDoc(
    renderToStaticMarkup(
      <ProgramDetailV3 program={program} relatedPrograms={related} />,
    ),
  );
}

describe("§3.1 该块不渲染:空容器不得留在 DOM 里(T3-R3.1 / R4.2)", () => {
  test("J1 最稀疏的卡片不留任何空元素", () => {
    expect(emptyElementsIn(card(SPARSE).querySelector("article")!)).toEqual([]);
  });

  test("J2 每个 fixture 的卡片都不留空元素", () => {
    for (const program of mockProgramsV3) {
      expect(
        emptyElementsIn(card(program).querySelector("article")!),
        `${program.school.slug}/${program.publishing.slug}`,
      ).toEqual([]);
    }
  });

  test("J3 每个 fixture 的详情页都不留空元素", () => {
    for (const program of mockProgramsV3) {
      expect(
        emptyElementsIn(detail(program).querySelector("article")!),
        `${program.school.slug}/${program.publishing.slug}`,
      ).toEqual([]);
    }
  });

  test("J4 无内容的块整体消失,而不是渲染成空壳", () => {
    const text = visibleText(card(SPARSE));
    expect(text).not.toContain("编辑观点");
    expect(card(SPARSE).querySelector("details")).toBeNull();
    // 三数字块只剩费用一格,不渲染空的截止/试音格
    expect(text).not.toContain("申请截止");
    expect(text).not.toContain("试音形式");
  });
});

describe("§0.4 反 cloaking:折叠内容真实存在于服务端 DOM", () => {
  test("K1 <details> 未展开,但其全部内容在服务端 markup 里", () => {
    const details = card(FULL).querySelector("details")!;
    expect(details.hasAttribute("open")).toBe(false);
    expect(details.textContent).toContain("官方成绩单");
    expect(details.textContent).toContain("试音形式为");
    expect(details.textContent).toContain("TOEFL 100");
  });

  test("K2 服务端 markup 不含任何 CSS 截短/隐藏可见文本的类(T3-R3.9)", () => {
    for (const program of mockProgramsV3) {
      const markup = renderToStaticMarkup(<ProgramCardV3 program={program} />);
      const visible = markup.replace(/<script[\s\S]*?<\/script>/g, "");
      for (const banned of [
        "truncate",
        "line-clamp",
        "sr-only",
        "text-transparent",
        "display:none",
        "visibility:hidden",
      ]) {
        expect(visible, `${program.school.slug} 含 ${banned}`).not.toContain(
          banned,
        );
      }
    }
  });

  test("K3 原文证据的引文在折叠状态下已在详情页 DOM 中", () => {
    const doc = detail(FULL);
    const quotes = [...doc.querySelectorAll("blockquote")];
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0]!.closest("details")!.hasAttribute("open")).toBe(false);
    expect(quotes[0]!.textContent).toContain("prescreening video");
  });
});

describe("§3.4 截止角标:事实进 SSR,派生状态归客户端(T3-R3.7)", () => {
  test("L1 服务端 markup 含截止日期本身", () => {
    expect(visibleText(card(FULL))).toContain("2026年12月1日");
  });

  test("L2 服务端 markup 不含角标三态中的任何一个", () => {
    const markup = renderToStaticMarkup(<ProgramCardV3 program={FULL} />);
    for (const badge of ["开放中", "距截止", "本季已截止"]) {
      expect(markup).not.toContain(badge);
    }
  });

  test("L3 水合后角标出现 —— 真实用户看得到", () => {
    render(<ProgramCardV3 program={FULL} />);
    expect(screen.getByText("开放中")).toBeTruthy();
  });

  test("L4 无截止日 → 水合后也没有角标(不是延迟出现,是根本没有)", () => {
    render(<ProgramCardV3 program={SPARSE} />);
    expect(screen.queryByText("开放中")).toBeNull();
    expect(screen.queryByText(/距截止/)).toBeNull();
    expect(screen.queryByText(/本季已截止/)).toBeNull();
  });
});

describe("§2.1 卡片结构冻结为七块(T3-R3.6)", () => {
  test("M1 七个块按冻结顺序出现", () => {
    // 结构断言而非文本位置:导语本身就含「申请截止」「年总费用」等词,
    // 用 indexOf 找标记会命中句内,量到的不是块序。
    const blocks = [...card(FULL).querySelector("article")!.children].filter(
      (el) => el.tagName !== "SCRIPT",
    );
    const shape = blocks.map((el) => {
      const text = el.textContent ?? "";
      if (text.startsWith("茱莉亚音乐学院的声乐")) return "1a 导语";
      if (text.startsWith("来源:")) return "1b 引用块";
      if (el.querySelector("h3")) return "2 身份";
      if (text.startsWith("编辑观点")) return "3 编辑观点";
      if (text.includes("预筛可视频提交")) return "4 金标签";
      if (el.tagName === "DL") return "5 三数字块";
      if (el.tagName === "DETAILS") return "6 折叠区";
      if (text.includes("加入对比")) return "7 状态条";
      return `未知块:${el.tagName}`;
    });
    expect(shape).toEqual([
      "1a 导语",
      "1b 引用块",
      "2 身份",
      "3 编辑观点",
      "4 金标签",
      "5 三数字块",
      "6 折叠区",
      "7 状态条",
    ]);
  });

  test("M2 状态条之后不再有任何元素(无第八块、无游离 CTA)", () => {
    const article = card(FULL).querySelector("article")!;
    const children = [...article.children].filter(
      (el) => el.tagName !== "SCRIPT",
    );
    const last = children.at(-1)!;
    expect(last.tagName).not.toBe("A");
    expect(last.textContent).toContain("加入对比");
  });

  test("M4 材料清单零硬编码,且推荐信不重复计数(T3-R3.11)", () => {
    const details = card(FULL).querySelector("details")!;
    const text = details.textContent ?? "";
    // fixture 1 的 required_materials 已含「两封推荐信」散文写法
    expect(FULL.application.required_materials).toContain("两封推荐信");
    expect(FULL.application.recommendation_letters).toBe(2);
    expect(text).toContain("两封推荐信");
    expect(text).not.toContain("推荐信 ×2");

    // 散文里没提推荐信时,结构化计数才补上
    const withCount = card(bySlug("juilliard", "opera_studies-mm")).querySelector(
      "details",
    )!.textContent!;
    expect(withCount).toContain("三封推荐信");
    expect(withCount).not.toContain("推荐信 ×3");

    // 清单本身完全来自数据:稀疏 fixture 没有任何硬编码条目
    expect(card(SPARSE).querySelector("details")).toBeNull();
  });

  test("M3 详情页入口是标题与折叠区内的链接,不是尾部 CTA", () => {
    const doc = card(FULL);
    const article = doc.querySelector("article")!;
    expect([...article.children].some((el) => el.tagName === "A")).toBe(false);
    expect(doc.querySelector("h3 a")).not.toBeNull();
    expect(doc.querySelector("details")!.textContent).toContain("查看完整要求");
  });
});

describe("§3.2 条件归属:归错比啰嗦更糟(T3-R4.1 / R5.1)", () => {
  test("N1 作品集条件独立成行,不挂在英语要求名下", () => {
    const text = visibleText(card(PORTFOLIO_CONDITION));
    expect(text).toContain("申请条件说明:作品集要求视申请方向而定");
    // 该 fixture 英语状态为 Unknown,不应出现英语要求小标题
    expect(text).not.toContain("英语要求");
  });

  test("N2 纯语言条件仍与英语基础值同行呈现", () => {
    const details = card(FULL).querySelector("details")!;
    expect(details.textContent).toContain("需要语言成绩 · TOEFL 100 / IELTS 7");
    expect(details.textContent).toContain("· 语言成绩要求仅适用于国际申请者");
    expect(details.textContent).not.toContain("申请条件说明");
  });

  test("N3 详情页的条件行逐条标明它限定的是哪项要求", () => {
    const text = visibleText(detail(FULL));
    expect(text).toContain("语言条件说明:语言成绩要求仅适用于国际申请者");
    expect(text).toContain("试音条件说明:仅预筛通过者需参加现场试音");
  });

  test("N4 条件文本永不丢失:每个 fixture 的非空 conditional_notes 都上页", () => {
    for (const program of mockProgramsV3) {
      const text = visibleText(card(program));
      for (const note of [
        program.application.conditional_notes,
        program.audition.conditional_notes,
      ]) {
        if (note) {
          expect(text, `${program.school.slug} 丢了条件:${note}`).toContain(note);
        }
      }
    }
  });
});

describe("§3.1 无单位的数字不是事实(T3-R3.2)", () => {
  test("O1 申请费缺币种 → 整行不渲染,也不渲染裸数字", () => {
    expect(SPARSE.application.application_fee).not.toBeNull();
    expect(SPARSE.application.application_fee_currency).toBeNull();
    const text = visibleText(detail(SPARSE));
    expect(text).not.toContain("申请费");
    expect(text).not.toMatch(/申请费[^0-9]*50/);
  });

  test("O2 中文校名/专业名缺失时回退英文(核心原则 6,不视为编造)", () => {
    expect(SPARSE.school.school_name_zh).toBeNull();
    expect(SPARSE.offering.program_name_zh).toBeNull();
    const text = visibleText(card(SPARSE));
    expect(text).toContain("Universität für Musik und darstellende Kunst Wien");
    expect(text).toContain("Gesang");
  });
});

describe("§3.3 截断必须有出口(T3-R4.4)", () => {
  test("P1 有详情页 → 80 字截断 + 完整要求链接", () => {
    const details = card(FULL).querySelector("details")!;
    expect(details.textContent).toContain("…");
    expect(details.querySelector('a[href*="#repertoire"]')).not.toBeNull();
  });

  test("P2 无详情页 → 不截断,整段可读,且没有指向空处的链接", () => {
    const details = card(NO_SLUG).querySelector("details")!;
    const full = NO_SLUG.audition.repertoire_summary!;
    expect(full.length).toBeGreaterThan(80);
    expect(details.textContent).toContain(full);
    expect(details.textContent).not.toContain("…");
    expect(details.querySelector('a[href*="#repertoire"]')).toBeNull();
    expect(details.textContent).not.toContain("查看完整要求");
  });
});

describe("§2.2 详情页模块顺序冻结(T3-R3.5)", () => {
  test("Q1 模块按冻结顺序,要求表之前不插入其它模块", () => {
    const headings = [...detail(FULL, [FORM2]).querySelectorAll("h1,h2")].map(
      (h) => (h.textContent ?? "").trim(),
    );
    expect(headings).toEqual([
      "茱莉亚音乐学院 · 声乐",
      "完整要求",
      "曲目 / 作品集细则",
      "原文证据",
      "特殊条件",
      "相关专业",
    ]);
  });

  test("Q2 编辑观点与金标签不出现在详情页(§2.2 未列入,故未另造模块)", () => {
    const text = visibleText(detail(FULL));
    expect(text).not.toContain("编辑观点");
    expect(text).not.toContain(FULL.editorial_note!.short_positioning);
  });

  test("Q3 相关专业中无 slug 的条目不产生空列表", () => {
    const doc = detail(FULL, [NO_SLUG]);
    // 唯一的相关专业没有 slug,整个模块因此不渲染
    expect(visibleText(doc)).not.toContain("相关专业");
    expect(doc.querySelector("ul:empty")).toBeNull();
  });
});

describe("§3.6 费用块在页面上的呈现", () => {
  test("R1 形态② 的两条小字都在页面上,一条都不能少", () => {
    const text = visibleText(card(FORM2));
    expect(text).toContain("¥58–63 万元人民币");
    expect(text).toContain("生活费为第三方估算,非院校官方数据");
    expect(text).toContain("按 2026-07 月均汇率估算");
  });

  test("R2 降级为原币种时,页面上不出现人民币与构成措辞", () => {
    const text = visibleText(card(SPARSE));
    expect(text).toContain("EUR 1,500/学期");
    expect(text).not.toContain("万元人民币");
    expect(text).not.toContain("含住宿");
    expect(text).not.toContain("月均汇率");
  });

  test("R3 无学费组件 → 整个费用格不渲染(T3-R5.2)", () => {
    const text = visibleText(card(NO_TUITION));
    expect(text).not.toContain("年总费用");
    expect(text).not.toContain("万元人民币");
    expect(text).not.toContain("含住宿");
  });
});

describe("§3.1 全量扫描:没有任何 fixture 会把占位符渲染上页", () => {
  test("S1 卡片与详情页均不含禁用占位词", () => {
    const banned = ["暂无", "N/A", "n/a", "待确认", "不详", "待定", "以官网为准"];
    for (const program of mockProgramsV3) {
      const cardText = visibleText(card(program));
      const detailText = visibleText(detail(program));
      for (const word of banned) {
        expect(cardText, `${program.school.slug} 卡片`).not.toContain(word);
        expect(detailText, `${program.school.slug} 详情页`).not.toContain(word);
      }
    }
  });
});

/**
 * T4-R1 (Codex): the T4 self-test's original A2/E5 claims ("JSON-LD 挂在卡片
 * 与详情页上"、"curl 模拟 GPTBot 取到含全文的 HTML") were one-off manual
 * commands against a locally started dev server — nothing in the repo
 * re-ran them. `renderToStaticMarkup` is exactly what a crawler with no
 * JavaScript sees (this file's own header comment says so, for the
 * pre-existing L-group tests), so it replaces the curl step entirely: no
 * server, no network, same guarantee.
 */
describe("T4 AI-ready 层:JSON-LD 注入 + GPTBot 全文可达", () => {
  test("T1 每个 fixture 的卡片都恰好注入一个合法 JSON-LD <script>", () => {
    for (const program of mockProgramsV3) {
      const scripts = [
        ...card(program).querySelectorAll('script[type="application/ld+json"]'),
      ];
      expect(scripts.length, program.school.slug).toBe(1);
      expect(() => JSON.parse(scripts[0]!.textContent ?? "")).not.toThrow();
    }
  });

  test("T2 每个 fixture 的详情页都恰好注入一个合法 JSON-LD <script>", () => {
    for (const program of mockProgramsV3) {
      const scripts = [
        ...detail(program).querySelectorAll('script[type="application/ld+json"]'),
      ];
      expect(scripts.length, program.school.slug).toBe(1);
      expect(() => JSON.parse(scripts[0]!.textContent ?? "")).not.toThrow();
    }
  });

  test("T3 服务端 markup(=GPTBot 无 JS 看到的东西)含完整导语,不是被截断的片段", () => {
    const cardText = card(FULL).querySelector("article")!.textContent ?? "";
    expect(cardText).toContain(FULL.publishing.answer_sentence_zh);
  });

  test("T4 服务端 markup 含完整曲目全文(详情页不截断,§3.3 的截断只发生在卡片上)", () => {
    const detailText = detail(FULL).querySelector("article")!.textContent ?? "";
    expect(FULL.audition.repertoire_summary).not.toBeNull();
    expect(detailText).toContain(FULL.audition.repertoire_summary);
  });

  test("T5 编辑观点原文不出现在任一 fixture 的 JSON-LD <script> 内容里(卡片 + 详情页)", () => {
    for (const program of mockProgramsV3) {
      if (!program.editorial_note) continue;
      const cardScript =
        card(program).querySelector('script[type="application/ld+json"]')!
          .textContent ?? "";
      const detailScript =
        detail(program).querySelector('script[type="application/ld+json"]')!
          .textContent ?? "";
      for (const text of [
        program.editorial_note.short_positioning,
        program.editorial_note.key_difficulty,
      ]) {
        if (!text) continue;
        expect(cardScript, `${program.school.slug} 卡片`).not.toContain(text);
        expect(detailScript, `${program.school.slug} 详情页`).not.toContain(text);
      }
    }
  });

  test("T6 引用块(来源域名 + 核实月份)在卡片上只出现一次 —— FreshnessBar 不再重复打印同一行", () => {
    const text = visibleText(card(FULL));
    const occurrences = text.split("来源:juilliard.edu").length - 1;
    expect(occurrences).toBe(1);
  });

  test("T8 answer_sentence_zh 在卡片和详情页里各自只渲染一次(同页不重复,不同页各渲染各的不算重复)", () => {
    const sentence = FULL.publishing.answer_sentence_zh!;
    const cardOccurrences = visibleText(card(FULL)).split(sentence).length - 1;
    const detailOccurrences = visibleText(detail(FULL)).split(sentence).length - 1;
    expect(cardOccurrences).toBe(1);
    expect(detailOccurrences).toBe(1);
  });

  /**
   * T4-R2 (Codex): D1 声称引用块含「核实月份」,但此前只有 T6 数了域名出现
   * 次数,没有任何断言确认月份文本真的在——GEO 可溯源性一半靠这个月份
   * (读者/AI 判断信息是否够新,不能只看来源域名)。三个 fixture 分别覆盖:
   * `freshness_flag.last_verified` 直接给出、另一个不同的 `last_verified`
   * 值(证明不是巧合命中同一个硬编码字符串)、以及 `last_verified` 为
   * null 时回退到 `latestRetrievedDate(sources)` 的路径。
   */
  test("T9 引用块的核实月份文本真的出现在卡片上,不只是域名(T4-R2)", () => {
    const OPERA_MM = bySlug("juilliard", "opera_studies-mm");
    const cases = [
      { program: FULL, expectedMonth: "2026年7月" }, // freshness_flag.last_verified: "2026-07-17"
      { program: OPERA_MM, expectedMonth: "2026年6月" }, // freshness_flag.last_verified: "2026-06-01"
      { program: PORTFOLIO_CONDITION, expectedMonth: "2025年9月" }, // last_verified: null → 回退到 sources[0].retrieved_date: "2025-09-02"
    ];
    for (const { program, expectedMonth } of cases) {
      const text = visibleText(card(program));
      expect(text, `${program.school.slug}/${program.publishing.slug}`).toContain(
        `核实于 ${expectedMonth}`,
      );
    }
  });

  test("T7 校名含字面量 </script> 时,序列化输出转义,不会提前截断 <script> 标签(防 XSS/结构破坏)", () => {
    const adversarial: ProgramV3 = {
      ...FULL,
      school: {
        ...FULL.school,
        school_name_zh: "危险</script><script>alert(1)</script>校名",
      },
    };
    const markup = renderToStaticMarkup(<ProgramCardV3 program={adversarial} />);
    const scriptOpen = markup.indexOf('<script type="application/ld+json">');
    expect(scriptOpen).toBeGreaterThanOrEqual(0);
    // 转义后,字面量 "</script>" 不应在 JSON-LD 内容里原样出现;
    // 反而应能找到转义后的 "\u003c/script\u003e"。
    const afterOpen = markup.slice(scriptOpen + '<script type="application/ld+json">'.length);
    const firstRealClose = afterOpen.indexOf("</script>");
    const contentBeforeRealClose = afterOpen.slice(0, firstRealClose);
    // 只有 "<" 会被转义为 "\u003c"(见 ProgramJsonLd.tsx),">" 保留原样也是
    // 安全的——HTML 解析器认标签边界靠字面量 "<",不靠 ">"。所以断言的是
    // "没有裸的 <" 紧跟 "/script",而不是要求两个字符都被转义。
    expect(contentBeforeRealClose).not.toMatch(/<\/script/i);
    expect(contentBeforeRealClose).toContain("\\u003c/script");
    // 且危险校名本身仍然是一个合法的、被正确解析的 JSON 字符串值
    const parsed = JSON.parse(contentBeforeRealClose);
    expect(parsed.provider.name).toContain("危险");
  });
});

/**
 * T3-R6 (Codex, 跨 ticket): `cost_estimate_rmb.min/max` 是元,不是万。T3 的
 * mock 数据与 `costBlockLine` 的渲染逻辑曾共享同一个错误假设(两边都把它当
 * 「万」),61 条声称矩阵与四轮 Codex 评审都没发现——因为 mock 与代码互相
 * 印证,没有任何东西不一致。真实 T1b 数据(570000/600000 元)一接入,生产
 * 构建的 Web Card 就渲染出「¥570000–600000 万元人民币」(= 57 亿元)。
 *
 * 这组测试直接读 `data/v3/real/juilliard-vocal-arts-pilot.json`(经
 * `realProgramsV3`,零改动),不经过 mock —— 这正是防止同一个错误假设
 * 再次同时出现在两处的手段:mock 可以被静默改错,真实包不能。
 */
describe("T3-R6 真实数据渲染:cost_estimate_rmb 单位是元,不是万", () => {
  const VOICE_BM = realProgramsV3.find((p) => p.publishing.slug === "voice-bm")!;

  test("U1 T1b 真实包确实原样带着元单位的数字(570000/600000),校验测试没有悄悄改了数据", () => {
    expect(VOICE_BM.publishing.cost_estimate_rmb?.min).toBe(570000);
    expect(VOICE_BM.publishing.cost_estimate_rmb?.max).toBe(600000);
  });

  test("U2 Web Card 渲染出 ¥57–60 万元人民币,不是 ¥570000–600000 万元人民币", () => {
    const text = visibleText(card(VOICE_BM));
    expect(text).toContain("¥57–60 万元人民币");
    expect(text).not.toContain("570000");
    expect(text).not.toContain("600000");
  });

  test("U3 详情页同样渲染正确金额", () => {
    const text = visibleText(detail(VOICE_BM));
    expect(text).toContain("¥57–60 万元人民币");
    expect(text).not.toContain("570000");
  });

  test("U4 JSON-LD 的 offers.priceSpecification 是真实人民币金额,不再 ×10000", () => {
    const jsonLd = buildProgramJsonLd(VOICE_BM, "/schools/juilliard-t1b/voice-bm");
    // 该 fixture 的费用确实是形态①,offers 必须存在——这不是可选检查
    expect(jsonLd.offers).toBeDefined();
    const priceSpec = jsonLd.offers!.priceSpecification!;
    expect(priceSpec.minPrice).toBe(570000);
    expect(priceSpec.maxPrice).toBe(600000);
    // 回归红线:5,700,000,000(重复换算后的荒谬结果)不得出现
    expect(priceSpec.minPrice).not.toBe(5_700_000_000);
  });

  // 2026-08-06:真实语料扩到 20 所 1778 个专业后,遍历全量在 jsdom 里渲染
  // 超时(vitest 5 秒上限)。这条要证明的是「T1b 那四条真实数据不留空容器」,
  // 与语料规模无关,所以回到它原本的语料 —— 茱莉亚那个包。全量语料的 SSR
  // 红线由 `tests/dom/schools-browse.dom.test.tsx` 的「全量语料 SSR 不变量」
  // 一组守,那里断言的是 article 数 == 专业数,不是任何写死的数字。
  //
  // 标题里的「cost 为 null 的一个」指 DMA:T2c 裁决(2026-08-03)之后它不再
  // 是 null,而是形态④全额学费减免(无金额、无币种),仍然是四条里最特殊的
  // 那个 —— 空容器风险没变,措辞跟上事实。
  test("U5 全部四个 T1b 真实项目(含全额减免那个)都不留空容器", () => {
    const juilliard = realProgramsV3.filter((p) => p.school.slug === "juilliard");
    expect(juilliard).toHaveLength(4);
    for (const program of juilliard) {
      expect(
        emptyElementsIn(card(program).querySelector("article")!),
        `${program.school.slug}/${program.publishing.slug}`,
      ).toEqual([]);
    }
  });
});
