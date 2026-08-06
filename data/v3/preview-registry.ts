import { mockProgramsV3 } from "./mock-programs";
import { realProgramsV3 } from "./real-programs";
import type { ProgramV3 } from "./types";

/**
 * 校名 slug 碰撞规避,预览面专用。真实包的 `school_ref` 是 `juilliard`,
 * 与 T3 mock 的茱莉亚声乐 BM 完全撞车,同一个预览路由下会互相覆盖。数据
 * 本身(`data/v3/real-programs.ts`)一个字不改,只在拼这张预览注册表时
 * 加后缀区分。T3b 生产路由(`/schools/...`)不经过这一层,直接读未加后缀
 * 的 `realProgramsV3`,所以生产 URL 用的是真实的 `juilliard`。
 */
const PREVIEW_SLUG_SUFFIX = "-t1b";

const suffixedRealProgramsV3: ProgramV3[] = realProgramsV3.map((program) => ({
  ...program,
  school: {
    ...program.school,
    slug: `${program.school.slug}${PREVIEW_SLUG_SUFFIX}`,
  },
}));

/**
 * `/v3-preview` 这张预览面上的全部项目 = T3 的 9 个 mock 边界用例 +
 * T1b 的 4 条茱莉亚真实数据(加了预览面专用的碰撞规避后缀)。
 *
 * 之所以要有这么一层:T5 的自测要求真实数据也走一遍完整渲染管线(不是
 * 另写一个脚本单独出图),而 T3 的路由只认 `mockProgramsV3`。加一个注册表
 * 比在每个路由里各拼一次数组安全 —— 详情页、分享卡路由、OG 路由三处必须
 * 看到同一批项目,否则会出现「有分享卡但点进去 404」。
 *
 * 生产接线(`/schools/{school-slug}/{program-slug}`)是 T3b,读的是未加
 * 后缀的 `realProgramsV3` 直接,不经过这张注册表 —— 见
 * `app/(explore)/schools/[schoolId]/[programSlug]/`。
 */
export const previewProgramsV3: ProgramV3[] = [
  ...mockProgramsV3,
  ...suffixedRealProgramsV3,
];

export function findPreviewProgramV3(
  schoolSlug: string,
  programSlug: string,
): ProgramV3 | undefined {
  return previewProgramsV3.find(
    (program) =>
      program.school.slug === schoolSlug &&
      program.publishing.slug === programSlug,
  );
}

/**
 * 有详情页出口的项目 —— 即 Mode F 生成过 slug 的那些。
 *
 * 分享卡与 OG 图的 `generateStaticParams` 都用它:没有 slug 就没有详情页,
 * 也就没有图片路由(与 T4 的 A8「无 slug 不输出 url」、G2「无 slug 不进
 * sitemap」同一条纪律)。
 */
export function previewImageParams(): {
  schoolSlug: string;
  programSlug: string;
}[] {
  return previewProgramsV3
    .filter((program) => program.publishing.slug !== null)
    .map((program) => ({
      schoolSlug: program.school.slug,
      programSlug: program.publishing.slug as string,
    }));
}
