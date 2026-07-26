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
};

export default nextConfig;
