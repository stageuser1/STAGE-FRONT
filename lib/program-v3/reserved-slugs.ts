import type { ProgramV3 } from "../../data/v3/types.ts";

/**
 * `publishing.slug` 保留字(T3b-R1,2026-08-05;2026-08-08 随 OSS 迁移从
 * `data/v3/real-programs.ts` 原样迁出,逻辑未改)。
 *
 * `"share-card"` / `"opengraph-image"` 是 `/schools/[slug]/[programSlug]/`
 * 自己的字面量子路由段:程序 slug 等于其一时,其子路径会被 Next 优先解析成
 * 静态段,拿到错误的路由。`"programs"` 是旧路由
 * `/schools/{schoolId}/programs/{programId}` 的字面段 —— 该路由已随 OSS
 * 迁移物理删除,但已冻结的 slug 无法回收,保留字保留(重新放开毫无收益,
 * 只会让历史 URL 语义摇摆)。
 *
 * **本目录新增子路由(另一图片变体、API route 等)时,其字面段名必须同步
 * 加进这里**,否则对应 slug 的程序会静默复现这个 bug。清单与磁盘路由树的
 * 一致性由 `tests/program_v3_reserved_slugs.test.mjs` 钉着。
 */
export const RESERVED_PROGRAM_SLUGS = ["programs", "share-card", "opengraph-image"];

/**
 * 命中保留字即响亮失败,绝不静默丢路由。§1.4:slug 由生成端产出后冻结,
 * 前端只能检测不能改;源头拒绝生成保留字 slug 是写入 API(阶段二)的责任,
 * 写入 API 与本检查用同一份清单。
 */
/**
 * 写入闸门用的原始形态检查(阶段二):对**未经适配的包**里
 * `publishing.programs[].slug` 直接查表,返回命中的保留字。
 *
 * 阶段一的注释里写过"源头拒绝生成保留字 slug 是写入 API 的责任" —— 这就是
 * 那个源头。与下面的渲染期守卫共用同一份 `RESERVED_PROGRAM_SLUGS`,
 * 不允许两处清单漂移。
 */
export function findReservedSlugs(slugs: readonly string[]): string[] {
  return [...new Set(slugs.filter((slug) => RESERVED_PROGRAM_SLUGS.includes(slug)))];
}

export function assertNoReservedSlugCollisions(programs: ProgramV3[]): void {
  const offenders = programs.filter(
    (program) =>
      program.publishing.slug !== null &&
      RESERVED_PROGRAM_SLUGS.includes(program.publishing.slug),
  );
  if (offenders.length === 0) return;
  const detail = offenders
    .map(
      (p) =>
        `  - ${p.school.slug}/${p.publishing.slug} (school_ref=${p.offering.school_ref}, field_ref=${p.offering.field_ref}, degree_level_ref=${p.offering.degree_level_ref})`,
    )
    .join("\n");
  throw new Error(
    `[T3b-R1] publishing.slug 命中保留字,无法安全路由到 ` +
      `/schools/{school}/{slug}(share-card / OG 子路径会被 Next 解析成静态段):\n${detail}\n` +
      `保留字清单:${RESERVED_PROGRAM_SLUGS.join(", ")}。` +
      `slug 已冻结,必须在生成端避免;前端只能检测,不能安全地为已冻结的 slug 挑新值。`,
  );
}
