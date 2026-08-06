import {
  findProductionProgramV3,
  productionProgramRouteParams,
} from "@/data/v3/real-programs";
import { renderShareCardPortrait } from "@/lib/program-v3/share-card-image";

/**
 * 竖版 3:4 分享卡图片服务,生产路由:
 * `GET /schools/{schoolId}/{programSlug}/share-card` → PNG.
 * Same rationale as the `/v3-preview` original (WeChat JS-SDK `imgUrl`,
 * force-static, no download entry point) — see that route for detail.
 *
 * `generateStaticParams` shares `productionProgramRouteParams()` with the
 * detail page and the OG image route (T3b-R1) — same reserved-slug
 * collision guard, one implementation. This route's own literal segment
 * name (`share-card`) is itself one of the reserved words that guard
 * checks for, since it is this same route tree's sibling.
 */
export const dynamic = "force-static";

// Must be a real zero-arg function, not a direct-assignment alias — Next
// calls this with a props object, not zero arguments, which silently
// overrides `productionProgramRouteParams`'s default parameter and crashes
// at build time (`a.filter is not a function`). See `page.tsx` for the full
// story of why this looked fine to `tsc` and was wrong anyway.
export function generateStaticParams() {
  return productionProgramRouteParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schoolId: string; programSlug: string }> },
) {
  const { schoolId, programSlug } = await params;
  const program = findProductionProgramV3(schoolId, programSlug);
  if (!program) {
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardPortrait(program);
}
