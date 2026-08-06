/**
 * T7 浏览页里只有一份文档能证明的东西。
 *
 * `tests/t7_schools_browse.test.mjs` 已经钉死了所有「是一个函数」的规则。
 * 它看不见的恰好是这个 ticket 的硬红线:**哪些节点进了服务端渲染的 HTML**,
 * 以及切换时到底是改可见性还是换内容。两者都是关于一份文档的陈述。
 *
 * 两种渲染模式,分工与 T3 那份 DOM 测试一致:
 *
 * - `renderToStaticMarkup` = 没有 JavaScript 的爬虫看到的东西。effect 不跑,
 *   所以它是 SSR 契约的诚实检验 —— 反 cloaking 的断言全部走这一条。
 * - `render()` 会 hydrate 并跑 effect,三层联动、pushState、popstate 走这一条。
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test } from "vitest";

import { SchoolsBrowse } from "@/components/schools/browse/SchoolsBrowse";
import {
  RESERVED_PROGRAM_SLUGS,
  realProgramsV3,
} from "@/data/v3/real-programs";
import type { ProgramV3 } from "@/data/v3/types";
import {
  browseLede,
  buildBrowseModel,
  resolveBrowseSelection,
  type BrowseSchool,
} from "@/lib/schools-browse/model";

/**
 * **交互类断言跑固定小语料,SSR 不变量跑全量语料**(裁决 2026-08-06)。
 *
 * 这个文件里的联动、选中态、pushState、文案断言,当初都是按茱莉亚那一个包
 * (1 所 / 4 个专业)写的。2026-08-06 真实语料扩到 20 所 1778 个专业后,它们
 * 以两种方式失效,而**两种都与它们要证明的行为无关**:
 *
 * - `screen.getByText("声乐 · BM")` 变歧义 —— 259 个小卡标题在 20 所之间重复
 *   (「小提琴 · MM」出现 30 次)。不同学校开同一个专业本来就该重名;查询从前
 *   不歧义,只是因为语料里只有一所学校。
 * - 在 jsdom 里渲染 1778 张卡超过 vitest 的 5 秒上限,没超时的也跑到 11–29 秒。
 *
 * 所以交互断言回到 `JUILLIARD` —— 它们原本的语料;而规模无关的那条红线
 * (反 cloaking)单独提到文件末尾「全量语料 SSR 不变量」一组去跑,断言同时
 * 从「有 4 个 article」升级成「article 数必须等于专业数」。后者是不变量,
 * 加多少学校都不会失效,**覆盖比原来强而不是弱**。
 */
const JUILLIARD = realProgramsV3.filter(
  (program) => program.school.slug === "juilliard",
);
const SCHOOLS = buildBrowseModel(JUILLIARD);
const LEDE = browseLede(SCHOOLS, new Date("2026-08-05T00:00:00Z"));

/** 第二所学校 —— 小语料只有一所,而 tab 联动需要有东西可切。 */
function twoSchools(): BrowseSchool[] {
  const clone = structuredClone(JUILLIARD[0]) as ProgramV3;
  clone.school = {
    ...clone.school,
    slug: "mdw-wien",
    school_name_zh: "维也纳音乐与表演艺术大学",
  };
  clone.publishing = { ...clone.publishing, slug: "voice-mm-wien" };
  clone.offering = { ...clone.offering, degree_abbreviation: "MM" };
  return buildBrowseModel([...JUILLIARD, clone]);
}

function mount(schools: BrowseSchool[], school?: string, program?: string) {
  return render(
    <SchoolsBrowse
      initialSelection={resolveBrowseSelection(schools, school, program)}
      lede={LEDE}
      schools={schools}
    />,
  );
}

function staticMarkup(schools: BrowseSchool[], school?: string, program?: string) {
  return renderToStaticMarkup(
    <SchoolsBrowse
      initialSelection={resolveBrowseSelection(schools, school, program)}
      lede={LEDE}
      schools={schools}
    />,
  );
}

/**
 * SSR 字符串的可读文本。直接对 HTML 串做 `toContain` 会被实体转义绊倒
 * (曲目里有 `’`、材料里有 `&`),而这些断言问的是「读者/爬虫读到的文字」,
 * 那正是 textContent。
 */
function staticText(markup: string): string {
  const host = document.createElement("div");
  host.innerHTML = markup;
  return host.textContent ?? "";
}

/** 未被 `hidden` 的那张大卡的主标题 —— 「同一时刻只有一张大卡可见」的读数。 */
function visibleCardTitles(container: HTMLElement): string[] {
  return [...container.querySelectorAll("article")]
    .filter((article) => !(article.parentElement as HTMLElement).hidden)
    .map((article) => article.querySelector("h2")?.textContent ?? "");
}

beforeEach(() => {
  window.history.replaceState(null, "", "/schools");
});

describe("t7:dom — 反 cloaking(核心原则 4)", () => {
  const markup = staticMarkup(SCHOOLS);

  test("四个专业的大卡全部在服务端 HTML 里,不是只有选中那个", () => {
    expect(markup.match(/<article/g)).toHaveLength(4);
    const text = staticText(markup);
    // 四条真实数据的中文名全是「声乐」,学位中文名才是屏幕上区分它们的东西。
    for (const degree of ["音乐学士", "音乐硕士", "研究生文凭", "音乐艺术博士"]) {
      expect(text).toContain(degree);
    }
    // 每张卡的 JSON-LD 指向自己的地址,四条互不相同。
    for (const { slug } of SCHOOLS[0].programs) {
      expect(markup).toContain(`/schools/juilliard/${slug}`);
    }
  });

  test("每个专业的曲目要求印全文,不截断、不留待点击后取", () => {
    const withRepertoire = SCHOOLS[0].programs.filter(
      ({ program }) => program.audition.repertoire_summary,
    );
    expect(withRepertoire).toHaveLength(4);
    const text = staticText(markup);
    for (const { program } of withRepertoire) {
      const full = program.audition.repertoire_summary as string;
      expect(full.length).toBeGreaterThan(80); // 否则这条断言证明不了「没截断」
      expect(text).toContain(full);
      expect(text).not.toContain("…");
    }
  });

  test("每个专业的材料清单全条在 HTML 里", () => {
    const text = staticText(markup);
    for (const { program } of SCHOOLS[0].programs) {
      expect(program.application.required_materials.length).toBeGreaterThan(0);
      for (const item of program.application.required_materials) {
        expect(text).toContain(item);
      }
    }
  });

  test("未选中的卡片是 hidden 属性,不是被从 DOM 里摘掉", () => {
    expect(markup.match(/hidden=""/g)?.length).toBeGreaterThan(0);
  });

  test("每所学校的小卡条都在 HTML 里(切换不改 innerHTML)", () => {
    const two = staticMarkup(twoSchools());
    expect(two).toContain("维也纳音乐与表演艺术大学");
    expect(two).toContain("茱莉亚学院");
    expect(two.match(/<article/g)).toHaveLength(5);
  });

  test("JSON-LD 每张卡一块,一页多块(T4 §2.4)", () => {
    expect(markup.match(/application\/ld\+json/g)).toHaveLength(4);
  });
});

describe("t7:dom — 四层结构", () => {
  test("提示句 / tab 行 / 小卡条 / 大卡 四层齐备", () => {
    const { container } = mount(SCHOOLS);
    expect(screen.getByText(LEDE)).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByRole("tab").textContent).toBe("茱莉亚学院");
    expect(container.querySelectorAll("article")).toHaveLength(4);
  });

  test("小卡两行:第一行「中文名 · 学位」,第二行「截止 {日期}」", () => {
    mount(SCHOOLS);
    expect(screen.getByText("声乐 · BM")).toBeTruthy();
    expect(screen.getByText("声乐 · DMA")).toBeTruthy();
    expect(screen.getAllByText("截止 2025年12月2日")).toHaveLength(4);
  });

  test("截止日为 null 的小卡显示「截止日期未公布」", () => {
    const noDeadline = structuredClone(realProgramsV3[0]) as ProgramV3;
    noDeadline.application = {
      ...noDeadline.application,
      application_deadline: null,
    };
    noDeadline.publishing = { ...noDeadline.publishing, slug: "voice-nodate" };
    mount(buildBrowseModel([noDeadline]));
    expect(screen.getByText("截止日期未公布")).toBeTruthy();
  });

  test("外壳:导航当前项、无路由的项渲染成纯文字、页脚说明与域名", () => {
    const { container } = mount(SCHOOLS);
    const current = container.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe("院校与专业");
    // 「申请日历」「数据来源说明」「更新频率」在仓库里没有路由 → 不给 href
    for (const label of ["申请日历", "数据来源说明", "更新频率"]) {
      expect(screen.getByText(label).tagName).toBe("SPAN");
    }
    expect(screen.getByText("联系我们").getAttribute("href")).toBe("/contact");
    expect(screen.getByText("studyabroadfirst.cn")).toBeTruthy();
    expect(
      screen.getByText(/本站信息均来自院校官网,标注核实时间/),
    ).toBeTruthy();
  });
});

describe("t7:dom — 三层联动", () => {
  test("加载即选中第一所第一个,且只有一张大卡可见", () => {
    const { container } = mount(SCHOOLS);
    expect(visibleCardTitles(container)).toEqual(["茱莉亚学院 · 声乐"]);
    expect(container.querySelector("article")?.textContent).toContain("音乐学士");
  });

  test("点专业小卡:仅大卡切换,同一时刻仍只有一张可见", () => {
    const { container } = mount(SCHOOLS);
    fireEvent.click(screen.getByText("声乐 · DMA"));
    const visible = [...container.querySelectorAll("article")].filter(
      (a) => !(a.parentElement as HTMLElement).hidden,
    );
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain("音乐艺术博士");
  });

  test("点学校 tab:小卡条换成该校的,并自动选中该校第一个专业", () => {
    const schools = twoSchools();
    const { container } = mount(schools);
    expect(screen.getByText("声乐 · BM").closest("div")?.hidden).toBe(false);

    fireEvent.click(screen.getByRole("tab", { name: "维也纳音乐与表演艺术大学" }));

    const rows = [...container.querySelectorAll('[aria-label$="的专业"]')];
    const visibleRows = rows.filter((row) => !(row as HTMLElement).hidden);
    expect(visibleRows).toHaveLength(1);
    expect(visibleRows[0].getAttribute("aria-label")).toBe(
      "维也纳音乐与表演艺术大学的专业",
    );
    expect(window.location.pathname).toBe("/schools/mdw-wien/voice-mm-wien");
  });

  test("选中态标记落在 tab 与小卡上(供 CSS 画选中样式)", () => {
    mount(SCHOOLS);
    fireEvent.click(screen.getByText("声乐 · MM"));
    const selected = document.querySelectorAll('[data-selected="true"]');
    // 一个 tab + 一张小卡
    expect(selected).toHaveLength(2);
    expect(screen.getByText("声乐 · MM").closest("button")?.dataset.selected).toBe(
      "true",
    );
  });
});

describe("t7:dom — URL 同步", () => {
  test("切换用 pushState 写 /schools/{school}/{program}", () => {
    mount(SCHOOLS);
    expect(window.location.pathname).toBe("/schools");
    fireEvent.click(screen.getByText("声乐 · GD"));
    expect(window.location.pathname).toBe("/schools/juilliard/voice-gd");
  });

  test("首屏不 push —— 否则后退键第一下会原地打转", () => {
    const before = window.history.length;
    mount(SCHOOLS);
    expect(window.history.length).toBe(before);
    expect(window.location.pathname).toBe("/schools");
  });

  test("直达 URL:首屏即选中对应学校与专业", () => {
    const { container } = mount(SCHOOLS, "juilliard", "voice-mm");
    expect(container.querySelector("article")).toBeTruthy();
    const visible = [...container.querySelectorAll("article")].filter(
      (a) => !(a.parentElement as HTMLElement).hidden,
    );
    expect(visible[0].textContent).toContain("音乐硕士");
  });

  test("popstate:选中态跟着地址栏走,不 push 新记录", () => {
    const { container } = mount(SCHOOLS);
    window.history.pushState(null, "", "/schools/juilliard/voice-dma");
    fireEvent.popState(window);
    expect(visibleCardTitles(container)).toHaveLength(1);
    const visible = [...container.querySelectorAll("article")].filter(
      (a) => !(a.parentElement as HTMLElement).hidden,
    );
    expect(visible[0].textContent).toContain("音乐艺术博士");
    expect(window.location.pathname).toBe("/schools/juilliard/voice-dma");
  });

  test("popstate 到解析不出来的地址:回退到第一所第一个,不空白", () => {
    const { container } = mount(SCHOOLS, "juilliard", "voice-dma");
    window.history.pushState(null, "", "/schools/nope/nope");
    fireEvent.popState(window);
    const visible = [...container.querySelectorAll("article")].filter(
      (a) => !(a.parentElement as HTMLElement).hidden,
    );
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain("音乐学士");
  });
});

describe("t7:dom — 大卡复用 T3 逻辑", () => {
  test("§2.1 的块都在:导语 · 引用块 · 编辑观点 · 三数字块 · 详细要求 · 状态条", () => {
    const { container } = mount(SCHOOLS);
    const card = container.querySelector("article") as HTMLElement;
    const program = SCHOOLS[0].programs[0].program;

    if (program.publishing.answer_sentence_zh) {
      expect(card.textContent).toContain(program.publishing.answer_sentence_zh);
    }
    expect(card.textContent).toMatch(/来源:/);
    expect(card.textContent).toMatch(/核实于 \d{4}年\d{1,2}月/);
    expect(card.textContent).toContain("申请截止");
    expect(card.textContent).toContain("试音形式");
    expect(card.querySelectorAll("dl").length).toBeGreaterThanOrEqual(2);
    if (program.editorial_note) {
      expect(card.textContent).toContain("编辑观点");
    }
  });

  test("详细要求是常展开的 label-value,没有 <details> 折叠区", () => {
    const { container } = mount(SCHOOLS);
    expect(container.querySelector("details")).toBeNull();
    const card = container.querySelector("article") as HTMLElement;
    expect(card.textContent).toContain("申请材料清单");
    expect(card.textContent).toContain("申请季");
  });

  // 裁决 2026-08-05(T7 交付确认第 3 条)。过滤只发生在这张卡上:详情页的
  // 完整要求表(§2.2 模块 2)那边没有三数字块,那一行必须留着。
  test("「申请截止日期」只在三数字块出现一次,详细要求表里不再重复", () => {
    const { container } = mount(SCHOOLS);
    const card = container.querySelector("article") as HTMLElement;
    const terms = [...card.querySelectorAll("dt")].map((dt) => dt.textContent);
    expect(terms).toContain("申请截止"); // 三数字块
    expect(terms).not.toContain("申请截止日期"); // 详细要求表
    // 日期本身仍在卡上,删的是重复的行、不是事实。
    expect(card.textContent).toContain("2025年12月2日");
  });

  test("共享的行定义本身没被改动 —— 详情页那边仍有「申请截止日期」", async () => {
    const { RequirementsTable } = await import(
      "@/components/program/v3/RequirementsTable"
    );
    const markup = renderToStaticMarkup(
      <RequirementsTable program={SCHOOLS[0].programs[0].program} />,
    );
    expect(staticText(markup)).toContain("申请截止日期");
  });

  test("空值降级仍是 T3 的:没有内容的块整块不渲染,不留空壳", () => {
    const sparse = structuredClone(realProgramsV3[0]) as ProgramV3;
    sparse.publishing = {
      ...sparse.publishing,
      slug: "voice-sparse",
      answer_sentence_zh: null,
      badges: [],
      cost_estimate_rmb: null,
      freshness_flag: {
        status: "unknown",
        last_verified: null,
        days_since_update: null,
      },
    };
    sparse.editorial_note = null;
    const markup = renderToStaticMarkup(
      <SchoolsBrowse
        initialSelection={{ schoolSlug: "juilliard", programSlug: "voice-sparse" }}
        lede={LEDE}
        schools={buildBrowseModel([sparse])}
      />,
    );
    expect(markup).not.toContain("编辑观点");
    expect(markup).not.toContain("年总费用");
    expect(markup).not.toContain("暂无");
    expect(markup).not.toContain("N/A");
  });

  test("截止角标由前端 now() 算(§3.4 / 裁决 T3-R3.7):不在 SSR HTML 里,但日期在", () => {
    const markup = staticMarkup(SCHOOLS);
    expect(markup).not.toContain("开放中");
    expect(markup).not.toContain("本季已截止");
    expect(markup).toContain("2025年12月2日");
  });
});

/**
 * 反 cloaking 的红线,按**全量真实语料**守(裁决 2026-08-06)。
 *
 * 上面那些断言用小语料换取「不歧义 + 跑得快」,代价是它们不再证明「20 所全都
 * 进了 HTML」。这一组补上,而且只断言与规模无关的不变量:每个可路由的专业各
 * 有一个 `<article>` 和一块 JSON-LD、mock/预览面一个不进、没有保留字冲突。
 * 加学校时这些断言自动跟着涨,不需要有人回来改数字 —— 而「有 4 个 article」
 * 那种写法每加一次学校就要改一次,还会让人误以为是数据出了问题。
 *
 * 显式放宽 timeout:在 jsdom 里把 1778 张卡渲成字符串本来就要十几秒。这是
 * **这一条测试有意为之的代价**,不是把一个偶发超时藏起来 —— 上面的交互测试
 * 已经不再背这个负担了。渲染量本身的隐患(全量静态 import、16.9MB bundle、
 * Vercel 构建可能 OOM)记在移交文档的待办里,不靠「留一条会超时的测试」提醒。
 */
describe("t7:dom — 全量语料 SSR 不变量(反 cloaking 红线)", () => {
  const routable = realProgramsV3.filter((p) => p.publishing.slug !== null);

  test(
    "每个可路由专业各有一个 <article> 与一块 JSON-LD,全部在服务端 HTML 里",
    () => {
      const all = buildBrowseModel(realProgramsV3);
      const markup = renderToStaticMarkup(
        <SchoolsBrowse
          initialSelection={resolveBrowseSelection(all)}
          lede={browseLede(all, new Date("2026-08-05T00:00:00Z"))}
          schools={all}
        />,
      );
      expect(markup.match(/<article/g)).toHaveLength(routable.length);
      expect(markup.match(/application\/ld\+json/g)).toHaveLength(routable.length);
      // 每所学校都在 tab 行里,一所不落
      for (const school of all) {
        expect(markup).toContain(school.nameZh);
      }
      // 未选中的卡是 hidden,不是被摘掉 —— 摘掉就是 cloaking
      expect(markup.match(/hidden=""/g)?.length).toBeGreaterThan(0);
      // 预览面数据没有生产路由,一个都不该混进来
      expect(markup).not.toContain("v3-preview");
      // 保留字 slug 会被 Next 的静态段优先解析走(T3b-R1),一个都不许有
      for (const program of routable) {
        expect(RESERVED_PROGRAM_SLUGS).not.toContain(program.publishing.slug);
      }
    },
    120_000,
  );
});
