import { NextResponse } from "next/server";
import { loadWritingModelAnswers, loadWritingSet } from "@/lib/writing-data";

/**
 * Model answers for one writing set, fetched on demand.
 *
 * This endpoint exists for one reason: the prose must not be in the page
 * payload before the learner has earned it. Rendering it on the server and
 * passing it into the client component put the whole model answer into the
 * prerendered `/model` route regardless of the gate — the "try first, then
 * unlock" rule (writing-spec §四) was true of the DOM but not of the bytes.
 *
 * With the answer behind a request instead, the page ships with nothing to
 * reveal and the client asks for it only after the local completion condition
 * passes.
 *
 * There is deliberately no authentication here — STAGE has no learner accounts
 * and this stage does not introduce any. The gate remains a client-side rule;
 * what changes is that a learner who has not completed their writing never
 * receives the text, rather than receiving it and being asked not to look.
 */
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ setSlug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { setSlug } = await params;
  const slug = decodeURIComponent(setSlug);

  // Unknown or unpublished set: 404 rather than an empty list, so the client
  // can tell "no such practice" from "this one has no model answer".
  const set = await loadWritingSet(slug);
  if (!set) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    { answers: await loadWritingModelAnswers(slug) },
    // Never cached by a shared cache: the response is only ever requested by a
    // learner who has already completed the practice, and a CDN copy would be
    // one more place the prose sits waiting.
    { headers: { "Cache-Control": "no-store" } },
  );
}
