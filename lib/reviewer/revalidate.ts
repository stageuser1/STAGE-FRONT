"use server";

import { revalidateTag } from "next/cache";
import {
  collectionTag,
  REVALIDATABLE_COLLECTIONS,
  type RevalidatableCollection,
} from "@/lib/directus/client";

function isRevalidatable(value: string): value is RevalidatableCollection {
  return (REVALIDATABLE_COLLECTIONS as readonly string[]).includes(value);
}

/**
 * Reviewer-to-public freshness contract.
 *
 * Reviewer edits go straight from the browser to Directus, so the Next.js
 * Data Cache holding the public reads knows nothing about them. Public reads
 * revalidate on a 900s window; without this, a reviewer could save a record,
 * see `router.refresh()` re-render, and still be served the pre-edit values
 * for up to fifteen minutes — the gap the audit recorded as TD-19.
 *
 * Every public Directus read is tagged with its collection. Dropping those
 * tags after a successful PATCH means the `router.refresh()` that follows
 * re-renders against Directus rather than the cache.
 *
 * Propagation expectation: the reviewer's own next render is fresh. Other
 * visitors' already-rendered pages are not pushed to; they pick the change up
 * on their next navigation, because the tag has been dropped for everyone.
 * Statically generated school and program pages still serve their existing
 * HTML until their own revalidation, so a reviewer verifying a change should
 * do it on the page they edited, which is the one that re-renders.
 *
 * Called from the client only after Directus has confirmed the write. The
 * collection list is an allowlist: this is a server action, so its argument is
 * attacker-controllable and must never be turned into a cache key verbatim.
 */
export async function revalidateReviewedCollections(
  collections: string[],
): Promise<void> {
  for (const collection of new Set(collections)) {
    if (!isRevalidatable(collection)) continue;
    revalidateTag(collectionTag(collection));
  }
}
