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
import { RESERVED_PROGRAM_SLUGS } from "@/lib/program-v3/reserved-slugs";
import { fixtureProgramsV3 as realProgramsV3 } from "../fixtures/real-programs";
import type { ProgramV3 } from "@/data/v3/types";
import { sourceUrlForField } from "@/lib/program-v3/format";
import {
  browseLede,
  buildBrowseModel,
  resolveBrowseSelection,
  scopeToSchool,
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

  /**
   * 裁决 2026-08-06:曲目要求做 §3.3 的 80 字截断,「完整要求」链到官网原页。
   *
   * 这条此前断言的是「印全文、不截断」,依据是裁决 T3-R4.4(无下一跳的项目
   * 印全文)—— 而当时确实没有下一跳:详情页已被折进这张卡。现在有了:官网
   * 原页(该专业试音/曲目要求的 `source_url`)才是真正有全文的地方,链过去
   * 比在卡上铺一整段英文原文更接近读者要的东西。
   *
   * 截断不是 cloaking:被截掉的部分不在本站任何地方、不靠交互才出现,链接
   * 明写去向。找不到来源 URL 时**回退成印全文**,而不是留一个点不开的省略号
   * —— 那才会既没有全文也没有去处。
   */
  test("曲目要求 80 字截断 + 「完整要求」外链,链到官网原页", () => {
    const withRepertoire = SCHOOLS[0].programs.filter(
      ({ program }) => program.audition.repertoire_summary,
    );
    expect(withRepertoire).toHaveLength(4);
    const text = staticText(markup);
    for (const { program } of withRepertoire) {
      const full = program.audition.repertoire_summary as string;
      expect(full.length).toBeGreaterThan(80); // 否则这条断言证明不了「截断了」
      const href = sourceUrlForField(program, "repertoire", "audition");
      expect(href, `${program.publishing.slug} 应有曲目来源 URL`).toBeTruthy();

      // 前 80 字在,全文不在
      expect(text).toContain(full.slice(0, 80));
      expect(text).not.toContain(full);
      // 去处写明了,而且是站外真实地址
      expect(markup).toContain(`href="${href}"`);
    }
    expect(text).toContain("完整要求");
  });

  /**
   * 裁决 2026-08-06:「详细要求」只有三行(蓝图 §1.5 的 expand 层)。
   *
   * 此前这里调用 `buildRequirementRows()`,把 §1.5 **3 分钟层**(详情页
   * `RequirementsTable`)的字段全集展开成 20 多行,其中大量是英文原文整段
   * 照搬。这条钉住新范围,并且钉住**其余 label 一个都不出现** —— 否则下次
   * 有人往卡上加一行,不会有任何测试拦住。
   */
  test("详细要求只有三行,3 分钟层的字段不在卡上", () => {
    const host = document.createElement("div");
    host.innerHTML = markup;

    for (const card of host.querySelectorAll("article")) {
      // 只看「详细要求」区自己的 `<dt>` —— 断言整页文本会误伤:「申请季」
      // 出现在导语里,「推荐信」「作品集」出现在材料清单的值里,那些都是
      // 事实而不是被删掉的行。
      const labels = [
        ...card.querySelectorAll<HTMLElement>('[class*="requirementLabel"]'),
      ].map((dt) => dt.textContent);
      expect(labels).toEqual(["申请材料清单", "曲目要求", "英语要求"]);
    }

    // 三分钟层的行连同两条条件说明,一条都不该出现在卡上
    expect(host.querySelectorAll('[class*="conditionList"]')).toHaveLength(0);
  });

  /**
   * 裁决 2026-08-06:语言条件并回英语要求行。
   *
   * 「TOEFL 102」而不说「设有豁免条件」,对中国学生是完全不同的两件事 ——
   * 很多人正是靠豁免政策申请的。决策价值极高而只占一行,所以它是三行里唯一
   * 带外链的:信号在卡上,全文在官网。
   *
   * 这条存在的意义是不让它在下一次压体积时被顺手拿掉 —— 它正是上一轮被
   * 「详细要求只留三行」误伤、又被单独捞回来的那一条。
   */
  test("英语要求行带豁免信号与官网外链", () => {
    const host = document.createElement("div");
    host.innerHTML = markup;

    for (const card of host.querySelectorAll("article")) {
      const labels = [
        ...card.querySelectorAll<HTMLElement>('[class*="requirementLabel"]'),
      ];
      const englishDd = labels.find((dt) => dt.textContent === "英语要求")
        ?.nextElementSibling as HTMLElement | undefined;
      expect(englishDd).toBeTruthy();
      const text = englishDd?.textContent ?? "";
      // 分数与豁免信号同在一行,不再拆成四五行
      expect(text).toMatch(/TOEFL \d+/);
      expect(text).toContain("设有");
      // 去处是站外真实地址,不是站内死链
      const link = englishDd?.querySelector("a");
      expect(link?.textContent).toBe("官网来源");
      expect(link?.getAttribute("href")).toMatch(/^https?:\/\//);
      // 整段豁免原文不上卡 —— 上一轮压掉的英文长段落不许从这里回来
      expect(text.length).toBeLessThan(120);
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

  /**
   * 裁决 2026-08-06:一页只承载一所学校的内容,别校只出 tab 链接。
   *
   * 原来这条断言两所学校的 5 张大卡都在同一份 HTML 里。收窄之后,同一份
   * HTML 里应当**只有本校的 4 张**,而另一所仍然以校名 + 可跟随的链接出现
   * —— 这两件事必须同时成立:少了前者是页面过重,少了后者是爬虫爬不出去。
   */
  test("一页只含本校大卡,别校以可跟随的链接出现", () => {
    const two = staticMarkup(scopeToSchool(twoSchools(), "juilliard"));
    expect(two).toContain("茱莉亚学院");
    // 别校:校名在,链接在
    expect(two).toContain("维也纳音乐与表演艺术大学");
    expect(two).toContain('href="/schools/mdw-wien/voice-mm-wien"');
    // 但它的大卡不在 —— 本校 4 个专业,就是 4 张
    expect(two.match(/<article/g)).toHaveLength(4);
  });

  test("JSON-LD 每张卡一块,一页多块(T4 §2.4)", () => {
    expect(markup.match(/application\/ld\+json/g)).toHaveLength(4);
  });
});

/**
 * 裁决 2026-08-06:横向滚动条隐藏后加右缘渐隐提示。
 *
 * 排查记录留在这里,免得下一个人重走一遍:**滚动能力从来没坏过**。真实浏览器
 * 实测(1200 / 768 / 375 三个宽度)`overflow-x: auto` 生效、祖先无 `overflow`
 * 约束、`flex-shrink: 0` + `white-space: nowrap` 让子项溢出而不是被压缩、
 * `touch-action` 是 `auto`、键盘聚焦最后一个 tab 会自动滚入视野。缺的只是
 * **线索** —— 滚动条一隐藏,「右边还有 14 所」就没有任何可见提示。
 *
 * jsdom 不做布局(所有元素宽度为 0),所以「滚到底遮罩消失」这类行为只能在真
 * 浏览器里验(已验,三个宽度都对)。这里能钉死的是**结构契约**:遮罩层存在、
 * 不吃点击、不进可访问性树、不改变 SSR 里的内容。
 */
describe("t7:dom — 横向滚动的视觉提示", () => {
  test("每个横向滚动行都有遮罩外壳,且遮罩不吃点击", () => {
    const host = document.createElement("div");
    host.innerHTML = staticMarkup(SCHOOLS);

    const wraps = host.querySelectorAll("[data-overflow]");
    // tab 行 + 本校小卡条,各一个
    expect(wraps).toHaveLength(2);
    for (const wrap of wraps) {
      // 服务端不渲染遮罩:避免「不该有遮罩的行先闪一下再消失」
      expect(wrap.getAttribute("data-overflow")).toBe("false");
    }

    // 滚动的仍然是原来那个元素,role/aria 没有被外壳接管
    expect(host.querySelector('[role="tablist"]')?.parentElement).toBe(wraps[0]);
    expect(
      host.querySelector('[aria-label$="的专业"]')?.parentElement,
    ).toBe(wraps[1]);
  });

  test("遮罩不改变 SSR 内容:20 个 tab 与本校 4 张卡一个不少", () => {
    const markupWithMask = staticMarkup(scopeToSchool(twoSchools(), "juilliard"));
    // 外壳只是包了一层 <div>,里面的东西一个都没变
    expect(markupWithMask.match(/role="tab"/g)).toHaveLength(2);
    expect(markupWithMask.match(/<article/g)).toHaveLength(4);
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

  /**
   * 裁决 2026-08-06:跨校不再是同页切换,而是一次真实导航。
   *
   * 原来这条断言「点另一所学校的 tab → 小卡条换成该校的」,前提是每一页都
   * 持有全站数据。收窄成一页一所之后,这一页根本没有别校的专业可切 —— 它
   * 只有一个链接。所以断言的对象从「切换后的状态」变成「链接本身是否正确、
   * 是否可被爬虫跟随」。
   *
   * 用 `<a href>` 而不是 `onClick` + `router.push` 是硬要求:爬虫要能顺着
   * tab 行爬到其余 19 所学校,这正是收窄之后反 cloaking 依然成立的前提。
   */
  test("跨校 tab 是真实 <a href>,指向该校第一个专业", () => {
    const schools = scopeToSchool(twoSchools(), "juilliard");
    const { container } = mount(schools);

    const otherTab = screen.getByRole("tab", {
      name: "维也纳音乐与表演艺术大学",
    });
    // 必须是锚点,不是按钮 —— 按钮爬虫跟不了
    expect(otherTab.tagName).toBe("A");
    expect(otherTab.getAttribute("href")).toBe("/schools/mdw-wien/voice-mm-wien");
    expect(otherTab.getAttribute("aria-selected")).toBe("false");

    // 当前校的 tab 仍是按钮(它不需要导航,已经在这一页上)
    const currentTab = screen.getByRole("tab", { name: "茱莉亚学院" });
    expect(currentTab.tagName).toBe("BUTTON");
    expect(currentTab.getAttribute("aria-selected")).toBe("true");

    // 这一页只有本校的小卡条与大卡 —— 别校没有数据可渲染
    const rows = [...container.querySelectorAll('[aria-label$="的专业"]')];
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute("aria-label")).toBe("茱莉亚学院的专业");
    // 点击链接不该改写 URL(那是浏览器导航的事,不是 pushState)
    expect(window.location.pathname).toBe("/schools");
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
 * 反 cloaking 的红线,按**全量真实语料**守 —— 口径已按裁决 2026-08-06 修正。
 *
 * 修正前这条断言的是「`<article>` 数 == 全站专业数」,即每一页都含全站内容。
 * 那个口径把页面推到单页 8.49 MB / 全量 14.74 GB,构建两次 `ENOSPC`,而同样
 * 这 8.49 MB 会原样发给每个手机用户。
 *
 * 修正后的口径,两条同时成立才算过:
 *
 *   1. **本页完整** —— 该校每个专业各有一个 `<article>` 和一块 JSON-LD,
 *      未选中的靠 `hidden` 而不是从 DOM 摘掉。这是原则 4 真正要求的东西:
 *      本页的折叠内容必须在 SSR DOM 里,人和爬虫读到的完全相同。
 *   2. **出得去** —— 全部 20 所学校都在 tab 行里,别校是可跟随的 `<a href>`。
 *      爬虫顺着链接就能到达其余每一所,这是正常站点结构,不是隐藏。
 *
 * 少了第 1 条是 cloaking;少了第 2 条是把内容锁死在一页里爬不出去。逐校渲染
 * 20 次,所以「某一所学校漏了内容」不会被平均掉。
 */
describe("t7:dom — 全量语料 SSR 不变量(反 cloaking 红线)", () => {
  const routable = realProgramsV3.filter((p) => p.publishing.slug !== null);
  const all = buildBrowseModel(realProgramsV3);

  test(
    "逐校:本校专业数 == 该页 <article> 数 == JSON-LD 块数,且 20 所 tab 链接齐全",
    () => {
      let seen = 0;
      for (const school of all) {
        const scoped = scopeToSchool(all, school.slug);
        const markup = renderToStaticMarkup(
          <SchoolsBrowse
            initialSelection={resolveBrowseSelection(scoped, school.slug)}
            lede={browseLede(all, new Date("2026-08-05T00:00:00Z"))}
            schools={scoped}
          />,
        );
        const n = school.programs.length;
        seen += n;

        // 1. 本页完整:本校每个专业各一张大卡、各一块 JSON-LD
        expect(markup.match(/<article/g), school.slug).toHaveLength(n);
        expect(
          markup.match(/application\/ld\+json/g),
          school.slug,
        ).toHaveLength(n);
        // 未选中的卡是 hidden,不是被摘掉 —— 摘掉就是 cloaking
        if (n > 1) {
          expect(markup.match(/hidden=""/g)?.length, school.slug).toBeGreaterThan(0);
        }

        // 2. 出得去:20 所全在 tab 行,别校都是可跟随的链接
        //    校名走 textContent —— 「Guildhall School of Music & Drama」里的
        //    `&` 在原始标记里是 `&amp;`,对 HTML 串做 toContain 会假阴性。
        const text = staticText(markup);
        for (const other of all) {
          expect(text, `${school.slug} 缺 ${other.slug}`).toContain(
            other.nameZh,
          );
          if (other.slug !== school.slug) {
            expect(markup, `${school.slug} → ${other.slug}`).toContain(
              `href="${other.href}"`,
            );
          }
        }

        // 预览面数据没有生产路由,一个都不该混进来
        expect(markup).not.toContain("v3-preview");
      }

      // 逐校加总必须等于全部可路由专业 —— 没有哪一所被整体漏掉
      expect(seen).toBe(routable.length);

      // 保留字 slug 会被 Next 的静态段优先解析走(T3b-R1),一个都不许有
      for (const program of routable) {
        expect(RESERVED_PROGRAM_SLUGS).not.toContain(program.publishing.slug);
      }
    },
    300_000,
  );
});
