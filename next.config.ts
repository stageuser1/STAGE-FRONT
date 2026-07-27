import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The Directus instance answers the bulk collection queries slowly (the
   * source_records payload alone is ~20MB, ~27s warm), and the school route
   * prerenders every school in parallel build workers. Next's default 60s
   * per-page budget expires under that load and the build aborts on an
   * arbitrary school.
   *
   * Build-time budget only: no runtime behaviour, caching semantics or data
   * changes. The durable fix belongs in the data layer (a narrower query, or
   * making the school route ISR-only) and is out of scope for this upgrade.
   */
  staticPageGenerationTimeout: 300,

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
