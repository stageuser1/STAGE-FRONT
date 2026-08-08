import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The Listening dataset is read from disk with `fs` at request time, which
   * output file tracing cannot see. Without this, a serverless render of the
   * listening routes (e.g. an unknown setId falling through to on-demand
   * rendering) throws ENOENT because the JSON items are missing from the
   * function bundle.
   */
  outputFileTracingIncludes: {
    "/ielts-lab/listening": ["./data/ielts/listening/items/**"],
    "/ielts-lab/practice/listening/[setId]": [
      "./data/ielts/listening/items/**",
    ],
    // 2026-08-08(OSS 迁移):院校数据不再从仓库文件读(数据在 OSS,契约
    // schema 由 lib/contract/validate.ts 运行时 readFileSync),原三条
    // `./data/v3/real/**` include 随 data/v3/real-programs.ts 一并删除。
    // 契约文件本身要进函数包 —— 校验器在所有院校路由与 sitemap 里运行:
    "/schools": ["./data/contract/*.json"],
    "/schools/[slug]": ["./data/contract/*.json"],
    "/schools/[slug]/[programSlug]": ["./data/contract/*.json"],
    "/schools/[slug]/[programSlug]/opengraph-image": ["./data/contract/*.json"],
    "/schools/[slug]/[programSlug]/share-card": ["./data/contract/*.json"],
    "/schools-preview/[slug]": ["./data/contract/*.json"],
    "/schools-preview/[slug]/[programSlug]": ["./data/contract/*.json"],
    "/sitemap.xml": ["./data/contract/*.json"],
    "/profile": ["./data/contract/*.json"],
    "/": ["./data/contract/*.json"],
  },

  /** /search 已下线(裁决 2026-08-08):永久重定向到 /schools,重建另立项。 */
  async redirects() {
    return [{ source: "/search", destination: "/schools", permanent: true }];
  },
  /**
   * Per-page budget for static generation.
   *
   * This was 300s — five times Next's default — because the pre-R1 school
   * route pulled whole legacy-CMS collections (a ~20MB source_records read)
   * into every prerender and pages genuinely took minutes. R1 replaced that with
   * bounded route-specific loaders, so the number is now measured rather than
   * guessed.
   *
   * Measured 2026-07-28 (R3):
   *   - `.next/trace` on two from-clean builds: the whole `static-generation`
   *     phase takes 4.6–4.7s for all 261 prerendered pages, which is a hard
   *     ceiling on any single page.
   *   - Cold on-demand renders of the heaviest route (program detail, which
   *     does the same work a build-time prerender does) over 20 pages against
   *     `next start`: 203–279ms, worst 279ms.
   *
   * 60s is therefore ~200x the measured worst page. It is also Next's default,
   * which is the point: nothing about this app needs a raised budget any more,
   * so a page that trips this is a real regression rather than a slow link.
   *
   * Build-time budget only: no runtime behaviour, caching semantics or data
   * changes.
   */
  staticPageGenerationTimeout: 60,

  /**
   * Baseline security headers, applied to every response.
   *
   * Deliberately NOT here: Content-Security-Policy. The IELTS runner under
   * `public/ielts/` is a vendored IIFE bundle that registers exam data through
   * globals and runs inside a same-origin iframe; any useful CSP has to be
   * tested against that runtime before it can be enforced, so it is a separate
   * piece of work rather than a line in this list.
   *
   * X-Frame-Options is SAMEORIGIN rather than DENY precisely because of that
   * iframe — the runner is framed by our own pages and DENY would break it.
   *
   * HSTS carries no `preload`: submitting to the preload list is effectively
   * one-way and belongs to a deployment decision, not to the app config.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
