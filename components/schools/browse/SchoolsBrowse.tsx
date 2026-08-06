"use client";

import { useCallback, useEffect, useState } from "react";
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
 * 每一所学校的小卡条、每一个专业的大卡,都无条件渲染进 DOM,并且因为整棵树
 * 是服务端渲染的,它们全部出现在 `curl` 取到的原始 HTML 里。切换只做一件事:
 * 改 `hidden` 属性。没有条件渲染(那会把节点从 DOM 里摘掉)、没有
 * `innerHTML` 替换、没有点击后 fetch。
 *
 * 这也是这个组件必须持有全部数据、而不是「点哪个取哪个」的原因 —— 它不是
 * 性能取舍,是红线。
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

          {/* 2. 学校 tab 行 */}
          <div aria-label="学校" className={styles.tabRow} role="tablist">
            {schools.map((school) => (
              <button
                aria-selected={school.slug === selection?.schoolSlug}
                className={styles.tab}
                data-selected={school.slug === selection?.schoolSlug}
                key={school.slug}
                onClick={() =>
                  select({
                    schoolSlug: school.slug,
                    // 点学校 = 自动选中该校第一个专业(联动规则 2)
                    programSlug: school.programs[0].slug,
                  })
                }
                role="tab"
                type="button"
              >
                {school.nameZh}
              </button>
            ))}
          </div>

          {/* 3. 专业小卡条 —— 每所学校一条,全部在 DOM 里,只有选中校那条可见 */}
          {schools.map((school) => (
            <div
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
            </div>
          ))}

          {/* 4. 大信息卡 —— 全部渲染,同一时刻只有一张可见 */}
          <div className={styles.cardStack}>
            {schools.flatMap((school) =>
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
