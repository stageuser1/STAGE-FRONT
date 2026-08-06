import { mockProgramsV3 } from "./mock-programs";
import type { ProgramV3 } from "./types";

/**
 * `/v3-preview` 这张预览面上的全部项目 = T3 的 9 个 mock 边界用例。
 *
 * **2026-08-06:真实数据不再进这张注册表 —— 这是构建预算决定,不是覆盖率
 * 决定。** 此前它是 `mock + realProgramsV3`,真实语料从 4 条扩到 1778 条后,
 * 这张**被 `robots.ts` 明令 Disallow、页面上没有任何入口**的开发预览面,
 * 自己就要静态生成 1787 份详情页 + 1787 张分享卡 + 1787 张 OG 图。当天那次
 * Vercel 构建 9724 页里一半以上出自这里,14 分 39 秒才跑到 4153 页,后段降到
 * 200 页/分钟,按此推算约 43 分钟,而 Hobby 上限是 45 分钟 —— 一个没人访问
 * 的面把整个部署顶到悬崖边。
 *
 * 换掉的是什么,要说清楚:T5 当初把真实数据接进来,是为了让它也走一遍完整
 * 渲染管线(而不是另写脚本单独出图)。那个覆盖**没有消失,只是换了地方**——
 * 真实数据现在有 T3b 的生产路由 `/schools/{school-slug}/{program-slug}`
 * (详情页 + 分享卡 + OG 图三条路由俱全,由 `data/v3/real-programs.ts` 直供),
 * 它比预览面更接近用户实际看到的东西。预览面回到它本来的职责:mock 边界
 * 用例的可视检查。
 *
 * 随之取消的还有 `-t1b` 校名后缀 —— 它存在的唯一理由是真实包的 `juilliard`
 * 与 T3 mock 的茱莉亚声乐 BM 在同一个预览路由下撞车。注册表里不再有真实数据,
 * 也就没有可撞的东西了。
 */
export const previewProgramsV3: ProgramV3[] = [...mockProgramsV3];

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
