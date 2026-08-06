"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  browseChipDeadline,
  browseChipTitle,
  browseHref,
  parseBrowsePath,
  resolveBrowseSelection,
  type BrowseSchool,
  type BrowseSelection,
} from "@/lib/schools-browse/model";
import { BrowseProgramCard } from "./BrowseProgramCard";
import styles from "./browse.module.css";

/**
 * T7 院校与专业浏览页 —— 四层结构 + 三层联动 + URL 同步。
 *
 * ## 反 cloaking(核心原则 4,硬红线)
 *
 * **本校**每一个专业的大卡都无条件渲染进 DOM,并且因为整棵树是服务端渲染的,
 * 它们全部出现在 `curl` 取到的原始 HTML 里。校内切专业只做一件事:改 `hidden`
 * 属性。没有条件渲染(那会把节点从 DOM 里摘掉)、没有 `innerHTML` 替换、
 * 没有点击后 fetch。这不是性能取舍,是红线。
 *
 * **跨校不在这条红线的范围内(裁决 2026-08-06)。** 每个 URL 只承载一所学校,
 * 其余 19 所以真实 `<a href>` 出现在 tab 行里。原则 4 要求的是「本页的折叠
 * 内容必须在 SSR DOM 中」—— 防的是给爬虫看的和给人看的不一样。收窄之后,
 * 每个 URL 下人和爬虫读到的仍然完全相同;别的学校顺着链接爬过去,那是正常
 * 站点结构。完整理由(以及不这么做的实测代价:单页 8.49 MB、1778 页 14.74 GB、
 * 构建 `ENOSPC`)写在 `lib/schools-browse/model.ts` 的 `scopeToSchool` 上。
 *
 * ## URL
 *
 * `pushState` 到 `/schools/{school-slug}/{program-slug}`(与
 * `programDetailHref()` 同一形状),`popstate` 反向解析回选中态。首屏不
 * push:那会往历史栈里塞一条用户没有走过的记录,后退键第一下就会变成原地
 * 打转。
 *
 * 解析不出来的 slug 一律回退到第一所第一个(`resolveBrowseSelection`),
 * 页面不空白 —— 这是**客户端**的契约;服务端对没生成过的 slug 仍然 404
 * (2026-08-05 裁决),所以这条回退不会把垃圾 URL 变成 200。
 */
/**
 * 横向滚动容器 + 右缘渐隐遮罩(裁决 2026-08-06)。
 *
 * 隐藏滚动条(T7 规格)让「右边还有内容」变得不可见:实测滚动能力本身一直
 * 正常(1200px 下 tab 行 `maxScrollLeft = 4275`,375px 下 5069,键盘聚焦也会
 * 自动滚入视野),缺的是**告诉用户可以滑**。40px 渐隐带就是那个提示,滚到底
 * 时消失。不用箭头按钮 —— 那会增加一次点击。
 *
 * 遮罩由 `data-overflow` 驱动,初值 `false`:**服务端不渲染遮罩**。这样不会
 * 出现「不该有遮罩的行(比如只有 4 个专业的小卡条)先闪一下再消失」。挂载后
 * 量一次、滚动与窗口变化时各量一次。
 *
 * 遮罩是 `::after` 的纯装饰层,`pointer-events: none`,不进可访问性树,
 * 也不影响反 cloaking —— 里面的内容一个都没少,只是边缘画了个渐变。
 */
function HScroller({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // 1px 容差:子像素宽度会让 scrollLeft + clientWidth 差一点点到不了
      // scrollWidth,不留容差的话滚到底遮罩也不消失。
      setOverflow(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });

    // `ResizeObserver` 更准(容器自身变宽也能量到),但不是哪里都有 ——
    // jsdom 没有它,更老的浏览器也没有。缺了就退回 window resize:覆盖
    // 「转屏 / 拉窗口」这个真正会改变溢出状态的场景。**不在测试里打补丁**
    // 假装它存在:那样掩盖的是组件在真实环境里也会炸这件事。
    const hasRO = typeof ResizeObserver !== "undefined";
    const ro = hasRO ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    if (!ro) window.addEventListener("resize", measure);

    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
      if (!ro) window.removeEventListener("resize", measure);
    };
  }, [children]);

  return (
    <div className={styles.scrollerWrap} data-overflow={overflow}>
      <div className={className} ref={ref} {...rest}>
        {children}
      </div>
    </div>
  );
}

export function SchoolsBrowse({
  schools,
  initialSelection,
  lede,
}: {
  schools: BrowseSchool[];
  initialSelection: BrowseSelection | null;
  lede: string;
}) {
  const [selection, setSelection] = useState<BrowseSelection | null>(
    initialSelection,
  );

  // 这一页真正携带数据的学校 —— 收窄之后只有一所(`scopeToSchool`)。
  // tab 行仍然列出全部 20 所,其余以链接出现。
  const withPrograms = schools.filter((school) => school.programs.length > 0);

  const select = useCallback(
    (next: BrowseSelection) => {
      setSelection(next);
      window.history.pushState(null, "", browseHref(next));
    },
    [],
  );

  useEffect(() => {
    function onPopState() {
      const { schoolSlug, programSlug } = parseBrowsePath(
        window.location.pathname,
      );
      setSelection(resolveBrowseSelection(schools, schoolSlug, programSlug));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [schools]);

  return (
    <div className={styles.shell}>
      <BrowseNav />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* 1. 顶部提示句 */}
          <p className={styles.lede}>{lede}</p>

          {/* 2. 学校 tab 行 —— 当前校是按钮,其余是真实链接 */}
          <HScroller aria-label="学校" className={styles.tabRow} role="tablist">
            {schools.map((school) =>
              school.slug === selection?.schoolSlug ? (
                <button
                  aria-selected
                  className={styles.tab}
                  data-selected
                  key={school.slug}
                  role="tab"
                  type="button"
                >
                  {school.nameZh}
                </button>
              ) : (
                // 真实 `<a href>`,不是 JS 跳转:爬虫要能顺着它爬到那所学校
                // (裁决 2026-08-06)。这一页没有它们的数据,点击是一次
                // 页面跳转,不是同页切换。
                <a
                  aria-selected={false}
                  className={styles.tab}
                  data-selected={false}
                  href={school.href}
                  key={school.slug}
                  role="tab"
                >
                  {school.nameZh}
                </a>
              ),
            )}
          </HScroller>

          {/* 3. 专业小卡条 —— 只有本校那一条(别校在这一页没有数据) */}
          {withPrograms.map((school) => (
            <HScroller
              aria-label={`${school.nameZh}的专业`}
              className={styles.chipRow}
              hidden={school.slug !== selection?.schoolSlug}
              key={school.slug}
            >
              {school.programs.map(({ slug, program }) => (
                <button
                  aria-selected={slug === selection?.programSlug}
                  className={styles.chip}
                  data-selected={slug === selection?.programSlug}
                  key={slug}
                  onClick={() =>
                    // 点专业 = 仅大卡切换(联动规则 3)
                    select({ schoolSlug: school.slug, programSlug: slug })
                  }
                  type="button"
                >
                  <span className={styles.chipTitle}>
                    {browseChipTitle(program)}
                  </span>
                  <span className={styles.chipDeadline}>
                    {browseChipDeadline(program)}
                  </span>
                </button>
              ))}
            </HScroller>
          ))}

          {/* 4. 大信息卡 —— 本校全部专业无条件渲染,同一时刻只有一张可见 */}
          <div className={styles.cardStack}>
            {withPrograms.flatMap((school) =>
              school.programs.map(({ slug, program }) => (
                <div
                  hidden={
                    school.slug !== selection?.schoolSlug ||
                    slug !== selection?.programSlug
                  }
                  key={`${school.slug}/${slug}`}
                >
                  <BrowseProgramCard program={program} />
                </div>
              )),
            )}
          </div>
        </div>
      </main>

      <BrowseFooter />
    </div>
  );
}

/**
 * 顶部导航。「申请日历」渲染成纯文字而不是链接 —— 这个页面在本仓库里还不
 * 存在,给它一个 href 就是发一条 404(2026-08-05 裁决)。页脚的两项同理。
 */
function BrowseNav() {
  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <a className={styles.brand} href="/">
          <span className={styles.brandMark}>STAGE</span>
          <span className={styles.brandSub}>海外音乐院校招生数据库</span>
        </a>
        <nav className={styles.navLinks}>
          <a className={styles.navLink} href="/">
            首页
          </a>
          <span aria-current="page" className={styles.navCurrent}>
            院校与专业
          </span>
          <span className={styles.navInert}>申请日历</span>
        </nav>
      </div>
    </header>
  );
}

function BrowseFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <span className={styles.footerMark}>STAGE</span>
          <div className={styles.footerLinks}>
            <span className={styles.footerLink}>数据来源说明</span>
            <span className={styles.footerLink}>更新频率</span>
            <a className={styles.footerLink} href="/contact">
              联系我们
            </a>
          </div>
        </div>
        <p className={styles.footerNote}>
          <span>
            本站信息均来自院校官网,标注核实时间;费用为估算,以院校公布为准。
          </span>
          <span>studyabroadfirst.cn</span>
        </p>
      </div>
    </footer>
  );
}
