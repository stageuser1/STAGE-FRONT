import type { ProgramV3 } from "@/data/v3/types";
import {
  browseLede,
  buildBrowseModel,
  resolveBrowseSelection,
  scopeToSchool,
} from "@/lib/schools-browse/model";
import { SchoolsBrowse } from "./SchoolsBrowse";

/**
 * The server half of T7 — shared verbatim by `/schools`,`/schools/{slug}` and
 * `/schools/{slug}/{program-slug}`, which are the same page differing
 * only in which pair of slugs it opens on.
 *
 * 2026-08-08(OSS 迁移):数据不再由本组件自取(原先直接 import
 * `data/v3/real-programs.ts`),改为路由层从 OSS 装配好 `programs` 传入 ——
 * 只换数据通道,渲染逻辑与视觉未动。
 *
 * **每个 URL 只渲染本校的完整内容(裁决 2026-08-06)。** 该校全部专业的大卡
 * 都在 SSR DOM 里,校内切专业仍是零转场;其余学校只出 tab 名与真实
 * `<a href>` 链接,点击是一次页面跳转。理由与反 cloaking 的口径说明写在
 * `scopeToSchool` 的注释里 —— 简短版:原来每页 8.49 MB × 1778 页 = 14.74 GB,
 * 构建撞 `ENOSPC`,而同样这 8.49 MB 也会原样发给每个手机用户。
 *
 * 提示句的院校数用**收窄前**的完整模型算 —— 「已收录 N 所」说的是数据库
 * 收录了多少所,不是这一页渲染了多少所。
 */
export function SchoolsBrowsePage({
  programs,
  schoolSlug,
  programSlug,
}: {
  programs: ProgramV3[];
  schoolSlug?: string;
  programSlug?: string;
}) {
  const allSchools = buildBrowseModel(programs);
  const selection = resolveBrowseSelection(allSchools, schoolSlug, programSlug);

  return (
    <SchoolsBrowse
      initialSelection={selection}
      lede={browseLede(allSchools, new Date())}
      schools={scopeToSchool(allSchools, selection?.schoolSlug)}
    />
  );
}
