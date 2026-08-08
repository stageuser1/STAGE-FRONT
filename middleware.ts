import { NextResponse, type NextRequest } from "next/server";

/**
 * draft 预览的路由分流(架构决策 6 与 8 的调和,2026-08-08)。
 *
 * 决策 8 定死了预览 URL 契约:`/schools/...?preview=<token>`。但 Next 15 里
 * 页面一读 `searchParams` 就整条退化为动态渲染,决策 6 的
 * ISR(revalidate=3600)随之失效。所以:公开路由永不读 searchParams,
 * 带 `?preview=` 的请求在这里被 rewrite 到 `/schools-preview/*`
 * (force-dynamic、noindex、token 校验在那边用 OSS 读函数完成)。
 * URL 栏里始终是 `/schools/...?preview=...`,契约不变。
 *
 * matcher 限定 `/schools/:path+`:不匹配 `/schools` 本身(浏览页只有
 * published,无预览语义),不触碰站内其他路由。token 不在 middleware 比对
 * (edge 层不做鉴权判断),只做路径分流。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 机读端点(决策 10):`/schools/{slug}.json` → route handler。目录段名
  // 不能是 `[slug].json`(Next 动态段必须占满整段),所以公开 URL 在这里
  // 分流到 `/schools-json/{slug}`。只认单层 slug,`.json` 后缀精确匹配。
  const machineReadable = pathname.match(/^\/schools\/([^/]+)\.json$/);
  if (machineReadable) {
    const url = request.nextUrl.clone();
    url.pathname = `/schools-json/${machineReadable[1]}`;
    return NextResponse.rewrite(url);
  }

  if (!request.nextUrl.searchParams.has("preview")) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = pathname.replace(/^\/schools/, "/schools-preview");
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/schools/:path+"],
};
