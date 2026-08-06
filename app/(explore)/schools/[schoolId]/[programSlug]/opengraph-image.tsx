import {
  findProductionProgramV3,
  productionProgramRouteParams,
} from "@/data/v3/real-programs";
import { renderShareCardOg } from "@/lib/program-v3/share-card-image";
import { SHARE_CARD_OG } from "@/lib/program-v3/share-card-tokens";

/**
 * OG image(§2.3 横版变体),same Next `opengraph-image` convention as the
 * `/v3-preview` original — see that file for why. Production data source
 * only (`realProgramsV3`), never mock.
 *
 * `generateStaticParams` shares `productionProgramRouteParams()` with the
 * detail page and the share-card route (T3b-R1) — same reserved-slug
 * collision guard, one implementation.
 */
export const size = SHARE_CARD_OG;
export const contentType = "image/png";
export const alt = "STAGE 先留学 · 项目速览";

// Must be a real zero-arg function, not a direct-assignment alias — Next
// calls this with a props object, not zero arguments, which silently
// overrides `productionProgramRouteParams`'s default parameter and crashes
// at build time (`a.filter is not a function`). See `page.tsx` for the full
// story of why this looked fine to `tsc` and was wrong anyway.
export function generateStaticParams() {
  return productionProgramRouteParams();
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ schoolId: string; programSlug: string }>;
}) {
  const { schoolId, programSlug } = await params;
  const program = findProductionProgramV3(schoolId, programSlug);
  if (!program) {
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardOg(program);
}
