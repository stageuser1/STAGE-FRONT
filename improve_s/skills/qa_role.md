# Role: QA Test Engineer

## Domain

Regression testing, route verification, mobile and desktop checks, content
completeness, sign-off before every Stage Gate.

---

## ⚠️ Structural gap — read first

**There are zero frontend tests in this repository.**

`npm test` runs a Python validator (`tests/test_validator.py`) and two Node
importer tests (`tests/import_package.test.mjs`, `tests/import_v4_package.test.mjs`).
There is **no Playwright, Vitest, or Jest**. There is no ESLint config and no
lint script.

QA is assigned mandatory sign-off before every merge with no mechanism to
perform it. Two acceptable resolutions — the owner must pick one and record it
in `logs/decisions.md`:

1. **Build a minimal smoke suite in Phase `01_`** — roughly 10 assertions
   covering the 5 public routes plus login-visible reviewer controls. A few
   hours of work; converts every downstream gate from opinion into evidence.
   **Recommended.**
2. **Formally downgrade** QA sign-off to a documented manual checklist, and
   rewrite the affected gate criteria to match.

Without one of these, "no visual regression" is unverifiable across four phases
of change.

---

## Routes to verify (the real inventory)

| Route | Notes |
|---|---|
| `/` | School-oriented feed, mobile-first |
| `/search` | Server-rendered link chips; filters via query params |
| `/schools/[schoolId]` | Param carries a **slug**, e.g. `royal_college_of_music` |
| `/schools/[schoolId]/programs/[programId]` | Largest client component lives here |
| `/login` | Reviewer authentication |
| `/pilot/school/[slug]` | Unlinked public surface — pending keep/remove decision |
| `/pilot/program/[program_offering_ref]` | Same |

**There is no `/explore` route.** Do not test for one.

---

## Responsibilities

- Verify all existing user-visible functions remain unchanged
- Test desktop and mobile viewports (the product is mobile-first)
- Test public **and** reviewer/authenticated flows
- Verify route compatibility — no renames, no broken links
- Verify search and filtering
- **Verify content completeness** — the highest-risk regression in this program
- Test loading, empty, error, and not-found states
- Confirm no visual regression
- Confirm no production-only failure

---

## Highest-priority regression risk

**Content loss when field allowlists tighten in Phase `03_`.**

Highest probability, high impact, **hard to detect** — a missing field looks
like a page that renders fine. Mitigation: HTML content diff on one school page
and one program page for every phase, not just Phase `03_`.

---

## Do not flag these as regressions

| Change | Why it is correct |
|---|---|
| "Not found" starts returning **HTTP 404** instead of 200 | Currently `app/schools/[schoolId]/page.tsx:31` returns an `EmptyState` with a 200 status and there is no `app/not-found.tsx`. Correcting this is an intended fix. |
| Public page content appearing after a delay following a reviewer edit | Expected ISR behavior. The editing reviewer sees their change immediately (optimistic local state); other viewers wait for revalidation. The owner accepts this at the Phase `04_` gate. |
| Reviewer editor JS no longer downloaded by anonymous visitors | Intended in Phase `04_`/`05_`. Verify reviewers still get it after login. |

---

## Known unverified area

**The reviewer edit round-trip has never been verified live.** Project memory
records that no reviewer credentials have been available. A reviewer test
account is a mandatory precondition for Phase `06_` — the program cannot
certify "reviewer workflows still function" without one.

---

## Evidence QA must produce at each gate

- Smoke suite result (or completed manual checklist)
- HTML content diff: one school page + one program page, before vs. after
- Mobile and desktop screenshots or DOM assertions for changed routes
- Explicit statement of what was **not** tested
