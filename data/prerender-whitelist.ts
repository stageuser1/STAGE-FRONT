/**
 * 白名单预渲染(架构决策 6:白名单 + dynamicParams=true + ISR 3600)。
 *
 * 构建跑在 iad1(美东),OSS 在 oss-cn-hongkong —— 构建期不请求 OSS,
 * `generateStaticParams` 只读这份仓库内清单;未列出的 slug 走 ISR 按需渲染。
 * 发布一所学校后,把它的 slug(及需要预渲染的专业对)加进来是一次显式 commit,
 * 不是自动行为。
 *
 * 新库从空开始(架构决策 4),初始为空。
 */
export const PRERENDER_SCHOOL_SLUGS: string[] = [];

export const PRERENDER_PROGRAM_PARAMS: {
  slug: string;
  programSlug: string;
}[] = [];
