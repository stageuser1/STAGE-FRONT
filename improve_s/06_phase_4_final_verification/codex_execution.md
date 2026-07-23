# Phase 4 — Final Verification · Codex Execution

**Status:** ⬜ Not started

---

## This is a verification phase — no optimization work

**Codex changes no application code in this phase.** If verification reveals a
problem, Codex reports it. Claude re-plans. A fix becomes its own approved
batch with its own gate.

---

## Files Codex MAY change

| Path | Permitted action |
|---|---|
| `improve_s/06_.../report.md` | Write |
| `improve_s/logs/*` | Append |
| `improve_s/README.md` | Update the status table |

## Files Codex MUST NOT change

- Anything under `app/`, `components/`, `lib/`, `data/`
- Any configuration or environment file
- Any Directus schema or permission
- **Directus records** — except the single safe field used in the
  cache-freshness test, with explicit owner permission, **restored afterward**

---

## Batch 1 — Production route verification

For each route in production, record status code, rendering mode (from cache
headers), and whether the page renders completely:

- `/`
- `/search` (and one filtered variant)
- `/schools/royal_college_of_music`
- one program detail page
- `/login`
- `/pilot/*` — only if retained by the Phase `05_` decision

**Stop and report** any non-200 or incomplete render.

---

## Batch 2 — Performance comparison

≥5 runs per route, cold and warm, in production. Report medians against the
Phase `01_` baseline. Record link throughput.

---

## Batch 3 — Cache header and rendering-mode audit

For each route, capture response headers from the **deployed origin** and
confirm the rendering mode matches the intention recorded in Phase `04_`.

This specifically guards against **production-only dynamic rendering** — a
route that is static locally but dynamic in production.

---

## Batch 4 — Content and security verification

- HTML content diff vs. the Phase `01_` baseline captures for one school page
  and one program page
- Capture anonymous RSC payloads for every public route; grep for
  `review_record`, `review_records`, `evidence_metadata`, `confidence`,
  `internal_`, `admin_` — **all counts must be zero**
- Confirm every Directus reference resolves over `https://`
- Confirm public citations render and their links resolve

---

## Batch 5 — Reviewer round-trip (owner present, test account required)

1. Log in as reviewer
2. Confirm editable cards appear
3. Make an edit on a safe field
4. Save; confirm success
5. Confirm the value persisted in Directus
6. Confirm token refresh works
7. Log out
8. **Restore the original value**

If no reviewer account is available: record this as **not verified** and flag it
as an open condition. Do not claim it passed.

---

## Batch 6 — Cache-freshness test (owner permission required)

1. Record the current public value of a safe field on one school page
2. Change it in Directus
3. Confirm the public page still shows the old value (expected)
4. Wait one full revalidation window
5. Confirm the public page shows the new value
6. **Restore the original value**

Record the **actual observed delay**.

---

## Batch 7 — Closure

Write the program closure report: full before/after table, residual risk
register, deferred items, recommendations. Update the `README.md` status table.

---

## Stop conditions

Halt and report if: any route fails in production; cache headers contradict the
intended rendering mode; any content is missing vs. baseline; any internal field
appears in an anonymous payload; the reviewer round-trip fails; content does not
refresh after a full revalidation window.

**Do not fix anything in this phase.** Report, and let Claude re-plan.

---

## Required report fields

Route verification table · performance comparison vs. Phase `01_` · cache header
audit · content diff results · security payload scan · reviewer round-trip
result · cache-freshness observed delay · residual risks · **confirmation that
zero application files were modified**.
