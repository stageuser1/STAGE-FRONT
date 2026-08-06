/**
 * Canonical production origin, used wherever an AI-ready projection needs an
 * absolute URL (JSON-LD `url`/`@id`, sitemap `loc`, robots `sitemap`).
 *
 * `studyabroadfirst.cn` (先留学) is the domain named in the T4 brief itself —
 * not a guess. Override via `NEXT_PUBLIC_SITE_URL` for any environment where
 * that isn't the real host (previews, staging) so absolute URLs never point
 * at the wrong origin.
 *
 * The override itself is just Next's standard `NEXT_PUBLIC_*` env var
 * convention — a plain `process.env` read — so it isn't separately unit
 * tested here (T4-R2 narrowed the matrix claim to what's actually pinned:
 * every AI-ready projection reads `SITE_URL` from this one export, not a
 * copy-pasted literal; see `T4_CLAIMS_MATRIX.md` §H). Testing "does
 * `process.env` work" would be testing Next/Node, not this file.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.studyabroadfirst.cn"
).replace(/\/+$/, "");
