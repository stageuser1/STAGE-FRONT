# IELTS Lab — competitor parity matrix

Source of truth for the competitor column: `D:\STAGE TARGET` (source + `reverse_analysis/`)
and the supplied UI screenshots. Source of truth for the STAGE column: this repository.

Priorities follow the brief: **P0** required for a mature IELTS experience, **P1**
important, **P2** optional.

## 1. Entry experience

| Feature | Competitor | STAGE (before) | STAGE (after) | Priority |
|---|:--:|:--:|:--:|:--:|
| Dedicated overview screen, separate from the catalog | YES | NO | YES | P0 |
| Persistent section nav (Overview / Browse / History) | YES | NO | YES | P0 |
| P1/P2/P3 category cards with corpus counts | YES | counts in a header line | YES | P0 |
| Per-category progress (practiced / total) | YES | NO | YES | P0 |
| Per-category "browse" + "random practice" actions | YES | NO | YES | P0 |
| Endless mode entry point | YES | NO | YES | P1 |
| Suite (3-part test) entry point | YES | NO | YES | P1 |
| Recent activity on the entry screen | YES | NO | YES | P0 |
| Resume / continue last unfinished flow | YES | NO | YES | P1 |
| Onboarding tour | YES | NO | NO | P2 |

## 2. Exam overview / browse system

| Feature | Competitor | STAGE (before) | STAGE (after) | Priority |
|---|:--:|:--:|:--:|:--:|
| Title search | YES | YES | YES | P0 |
| Category filter (P1/P2/P3) | YES | YES | YES | P0 |
| Frequency filter (high / medium / low) | YES | YES | YES | P0 |
| Sort control (default / frequency / difficulty / progress) | YES | NO | YES | P1 |
| Skill-type filter (reading / listening) | YES (listening dormant) | NO | NO — no listening corpus | P2 |
| Difficulty shown on the card | YES | NO | YES | P1 |
| Ordinal index on the card | YES | NO | YES | P2 |
| Practiced marker | YES (dot) | NO | YES | P0 |
| Best accuracy / attempt count on the card | partial | NO | YES | P1 |
| "Practised / not practised" filter | YES | NO | YES | P1 |
| Result count | YES | YES | YES | P1 |
| Clear-filters action | YES | NO | YES | P1 |
| Browse state remembered across navigation | YES | NO | YES | P1 |
| Non-interactive item handled explicitly | YES (PDF fallback) | YES (disabled card) | YES (disabled card) | P0 |
| PDF viewing | YES | NO — no PDF corpus in STAGE | NO | P2 |

## 3. Selection flow

| Feature | Competitor | STAGE (before) | STAGE (after) | Priority |
|---|:--:|:--:|:--:|:--:|
| Direct launch from a card | YES | YES | YES | P0 |
| Random practice (global) | YES | NO | YES | P0 |
| Random practice scoped to a category | YES | NO | YES | P1 |
| Prefer unpractised items when selecting randomly | YES (suite) | NO | YES | P1 |
| Re-open a previous attempt for review | YES | NO | YES | P0 |
| Suite: scope selection (high / high+medium / all / custom) | YES | NO | YES | P1 |
| Suite: automatic one-per-category selection | YES | NO | YES | P1 |
| Suite: custom one-per-category selection | YES | NO | YES | P2 |
| Suite: flow mode (classic / simulation / stationary) | YES | NO | classic only | P2 |

## 4. Test taking

The runner (`public/ielts/runtime/unifiedReadingPage.js`) is used unmodified and already
owns almost all of this. The parity gaps were in the **shell around it**.

| Feature | Competitor | STAGE (before) | STAGE (after) | Priority |
|---|:--:|:--:|:--:|:--:|
| Split passage / question layout | YES | YES (runner) | YES | P0 |
| All 13 corpus question kinds | YES | YES (runner) | YES | P0 |
| Timer | YES | YES (runner) | YES | P0 |
| Question palette + answered state | YES | YES (runner) | YES | P0 |
| Marked / flagged questions | YES | YES (runner), discarded on save | YES, persisted | P1 |
| Highlight + notes | YES | YES (runner) | YES | P1 |
| Font size, theme, resizable split | YES | YES (runner) | YES | P2 |
| Reset attempt | YES | YES (runner) | YES | P1 |
| `INIT_SESSION` handshake (stops the runner's init retry loop) | YES | **NO** | YES | P0 |
| Full-height test surface (no marketing footer) | YES | NO | YES | P0 |
| Exit / back with confirmation on an in-progress attempt | YES | NO | YES | P1 |
| Mobile layout for the shell | YES | partial | YES | P1 |

## 5. Result experience

| Feature | Competitor | STAGE (before) | STAGE (after) | Priority |
|---|:--:|:--:|:--:|:--:|
| Score summary (correct / total / %) | YES | badge only | YES | P0 |
| Duration on the result | YES | NO | YES | P0 |
| Per-question outcome table | YES (runner, in-frame) | YES (runner) | YES | P0 |
| Static Chinese explanations | YES | YES (runner) | YES | P0 |
| Per-question-type breakdown for **this** attempt | partial | NO | YES | P1 |
| Explicit next action after submit | YES | NO | YES | P0 |
| Retry the same passage | YES | NO | YES | P1 |
| Continue to another random passage | YES (endless) | NO | YES | P1 |

## 6. History and progress

| Feature | Competitor | STAGE (before) | STAGE (after) | Priority |
|---|:--:|:--:|:--:|:--:|
| Summary: total practices | YES | YES | YES | P0 |
| Summary: average accuracy | YES | YES | YES | P0 |
| Summary: study minutes | YES | YES | YES | P0 |
| Summary: streak days | YES | **NO** | YES | P0 |
| Attempt list, newest first | YES | YES | YES | P0 |
| Filter by category | YES | NO | YES | P1 |
| Filter by result band | YES | NO | YES | P1 |
| Sort (date / accuracy / duration) | YES | NO | YES | P1 |
| Attempt detail with per-question answers | YES | YES | YES | P0 |
| Re-open attempt in the runner for review | YES | NO | YES | P0 |
| Delete a single record | YES | NO | YES | P1 |
| Bulk select + delete | YES | NO | YES | P1 |
| Clear all | YES | YES | YES | P1 |
| Markdown export | YES | NO | YES | P1 |
| JSON export | YES | NO | YES | P1 |
| JSON import (merge, de-duplicated) | YES | NO | YES | P1 |
| Accuracy / score trend charts | NO | YES | YES | — STAGE ahead |
| Question-type weakness breakdown | partial | YES | YES | — STAGE ahead |
| Backup slots (create / restore / delete) | YES | NO | NO | P2 |

## 7. Mobile

| Feature | Competitor | STAGE (before) | STAGE (after) | Priority |
|---|:--:|:--:|:--:|:--:|
| Responsive shell nav | YES | n/a | YES (scrollable tab row) | P1 |
| Responsive catalog grid | YES | YES | YES | P1 |
| Responsive history / filters | YES | partial | YES | P1 |
| In-test mobile layout | YES | runner-owned | runner-owned | P1 |

## 8. Deliberately excluded

Out of scope per the brief (no unrelated product directions), or unsupported by the
STAGE corpus:

- Vocabulary dashboard + SM-2 scheduler — a separate product surface, not IELTS reading parity.
- Achievements, full-screen clock, mini-games, theme/background switcher.
- PDF viewer/fallback — STAGE ships no PDF corpus (`public/ielts` has none).
- Listening — no listening corpus exists in either package.
- Local question-bank folder import / library switching — STAGE's corpus is build-time static.
- Writing AI scoring — dead code in the competitor (commented out), not a real feature.
- Backup slots — superseded by JSON export/import, which is reversible and portable.
