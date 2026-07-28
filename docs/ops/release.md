# STAGE FRONT — release runbook

**Owner:** Codex (verification) · Opus (implementation) · Fable (budget sign-off)
**Established:** 2026-07-28 (remediation phase R3)
**Audit refs:** P0-1 (build not reproducible or startable), P1-7 (no CI gate),
P1-11 (page payloads), P2-5 (stale generated types), P2-6 (runtime discipline).

Nothing is publicly deployed yet. This runbook describes the gate a build must
pass to be considered a release candidate, and what to do when one is promoted.

---

## 1. Build budget

Measured 2026-07-28 on the development machine (Windows 10, 6 cores / 12
threads, 16 GB, Node 22.23.0, npm 10.9.8), against the live Directus instance.

| Stage | Measured | Budget |
|---|---:|---:|
| `npm ci` from a warm npm cache | 9 s | 60 s |
| `npm run build:clean` (clean output, warm `.next/cache`) | 20.8 s / 20.3 s | 90 s |
| — of which webpack compilation | 11.8–12 s | — |
| — of which static generation, all 261 pages | 4.6–4.7 s | 30 s |
| Worst single page (cold render, program detail) | 279 ms | 60 s (`staticPageGenerationTimeout`) |
| `npm test` (89 tests) | ~3 s | 60 s |
| `node scripts/smoke.mjs` (12 checks) | ~1 s | 120 s incl. server start |

Two consecutive from-clean builds are the gate, not one. Both must end with
`artifact: startable`.

For context: the pre-R1 build was about 25 minutes and frequently did not
finish at all. The gain is R1's — bounded route-specific Directus loaders — not
this phase's.

### The build's two network dependencies

**Directus** (`http://47.86.26.168:8055`) is the dependency the build is
supposed to have. Static generation prerenders 20 school pages and 3 program
pages from it. A build without Directus access is not a valid release
candidate; do not mock it.

**Google Fonts** is the dependency it should not have. `app/layout.tsx` loads
Noto Sans SC and Geist Mono through `next/font/google`; a build with an empty
`.next/cache` downloads **106 woff2 files (~4.7 MB)** from `fonts.gstatic.com`
during compilation. On this link those downloads intermittently reset, and
**Next 15.5.22 does not fail honestly when one does** — the build's async chain
is dropped, the event loop drains, and node exits with status 0 having printed
nothing and written no `prerender-manifest.json`.

Measured: **4 of 10** from-cold builds died that way (at 6 s, 6 s, 13 s, 21 s),
one logging `read ECONNRESET / Retrying 1/3...` first. With `.next/cache`
preserved, **6 of 6** builds completed in 16.5–17.8 s.

Two mitigations are in place:

- `npm run clean` deletes everything under `.next` **except** `.next/cache`.
  That cache is content-addressed and its inputs are pinned by the lockfile and
  the source tree, so keeping it changes how long a build takes, never what it
  produces. CI restores it with `actions/cache`. `npm run clean:all` drops it
  when you actually want to re-download the fonts.
- `scripts/assert-artifact.mjs` runs after every build and fails if
  `BUILD_ID`, `prerender-manifest.json`, `routes-manifest.json` or
  `required-server-files.json` is missing. A silent zero-exit build is now a
  red build. This is precisely the P0-1 signature the audit recorded.

**Durable fix, not done here:** self-host the two families so no build touches
Google. It must preserve the **309 `unicode-range` `@font-face` rules** Next
generates — `next/font/local` cannot express those, so a naive port would make
every visitor download all 4.7 MB instead of the ranges they need. That makes
it design-system work; it belongs with master-roadmap Phase 2, not with a
remediation phase whose remit is minimal safe fixes.

---

## 2. Build, start, smoke

Prerequisites: Node 22.x (enforced by `engines` + `.npmrc engine-strict`),
Python 3.11 for the validator suite, `.env.local` with `DIRECTUS_URL`,
`NEXT_PUBLIC_DIRECTUS_URL` and `DIRECTUS_TOKEN`, and network access to
Directus.

```bash
npm ci && npm audit --omit=dev --audit-level=high && npm run typecheck && npm test && npm run build:clean
```

Then, in one shell:

```bash
npm start
```

and in another:

```bash
npm run smoke
```

`npm run smoke` accepts `--base <url>` (or `SMOKE_BASE_URL`) and `--wait
<seconds>`, so the same script checks a deployed origin.

### What the smoke suite asserts

HTTP 200 plus a server-rendered content marker on `/`, `/pricing`, `/contact`,
`/schools`, one school detail, one program detail, `/search?q=piano`,
`/search?keyword=piano`, `/dashboard`, `/ielts-lab`, `/ielts-lab/browse`; and
HTTP 404 on `/schools/does-not-exist`.

The detail routes are discovered from `/schools` at run time rather than pinned,
so an import that changes ids cannot turn a data edit into a red build.

The 404 check is currently an **expected failure** — invalid detail URLs answer
200 until R4 lands `notFound()`. The suite prints `XFAIL` and stays green. When
R4 merges, remove `expectedFail` from that entry in `scripts/smoke.mjs`; if the
check starts passing before then, the suite prints a `NOTE` telling you to.

`/search?q=piano` is the canonical smoke URL from the remediation plan. The page
actually reads `keyword`, so `q` exercises the no-query branch; the
`keyword=piano` check covers the ranked-result path. Both are kept.

### CI

`.github/workflows/ci.yml` runs the same sequence. It is split into two jobs
because the second needs Directus. Read the header comment before trusting a
green run: whether a GitHub-hosted runner can reach `47.86.26.168:8055` has not
been verified, so the build+smoke job runs on the runner named by the
`STAGE_BUILD_RUNNER` repository variable and preflights the connection. Until a
runner with access is registered, **build + start + smoke is a manual gate** —
run section 2 by hand and record the result on the PR.

Secrets required: `DIRECTUS_URL`, `NEXT_PUBLIC_DIRECTUS_URL`, `DIRECTUS_TOKEN`.

---

## 3. Rollback

There is no deployment target yet, so rollback is defined against the artefact
and the commit.

1. **Identify the last good release.** A release candidate is a commit whose
   `.next` was produced by `npm run build:clean` and passed `npm run smoke`.
   Record the commit SHA and the `.next/BUILD_ID` together when you promote one.
2. **Artefact rollback (fastest).** Keep the previous `.next` directory (or its
   archive) alongside the deploy. Stop the server, restore the previous `.next`,
   `npm start`, then `npm run smoke --base <origin>`. Nothing else on disk
   differs between builds — `node_modules` is reproduced from the lockfile.
3. **Commit rollback.** `git revert` the offending commits on `main` (do not
   force-push a shared branch), then rebuild from clean and re-run the gate in
   section 2. Expect ~21 s for the build, so a rebuild is a legitimate rollback
   path rather than a last resort.
4. **Verify the rollback**, don't assume it: `npm run smoke` against the
   restored origin, and confirm `.next/BUILD_ID` matches the one recorded for
   that release.

Data is not part of a rollback. Directus is a live external system; reverting
the frontend does not revert an import. See section 4.

---

## 4. Post-deploy: verify Directus relationships after an import

Any deploy that follows a Directus import must be followed by the existing
relationship verifier. The importer performs idempotent natural-key upserts but
executes sequentially and can report `partial_commit_possible=true` after a
failure (audit P1-5) — the verifier is how a partial commit is detected.

```bash
node scripts/verify_v4_batch_directus.mjs
```

It reads `DIRECTUS_URL` and `DIRECTUS_TOKEN` from `.env.local`, compares the
nine-school V4 packages under `output/` against what Directus actually holds,
and writes `docs/imports/stage-v4-nine-school-verification.json` and `.md`.
Pass `--report <path>` to write elsewhere. **Exit status 1 means FAIL** — check
the `checks` block in the JSON for the specific integrity failure (duplicate
program refs, broken program/school relations, orphan requirements, source-key
mismatches).

A FAIL after a deploy is a data problem, not a frontend problem: do not roll
back the app for it. Follow the import recovery runbook (backup → dry run →
commit → verifier → journal review).

---

## 5. Route payload budgets — report only

From the 2026-07-28 build. **These are recorded, not enforced.** Enforcement
lands during reconstruction (audit P1-11 / TD-09); the point of writing them
down now is that reconstruction can be judged against a real starting line.

| Route artifact | 2026-07-27 audit | 2026-07-28 (R3) | Note |
|---|---:|---:|---|
| `/schools.html` | 1.43 MB | **1.43 MB** | Unchanged. Whole catalog serialised to a client filter. |
| `/schools.rsc` | 1.14 MB | **1.14 MB** | Unchanged. |
| Manhattan school HTML | 573 KB | **573 KB** | Largest school detail. |
| Peabody school HTML | — | 451 KB | |
| New England Conservatory HTML | — | 383 KB | |
| Juilliard school HTML | 379 KB | **379 KB** | Unchanged. |
| Colburn school HTML | 175 KB | 175 KB | Unchanged. |
| Landing HTML | 113 KB | **113 KB** | Unchanged. |
| `/ielts-lab.html` | — | 71 KB | |
| `/ielts-lab/browse.html` | — | 67 KB | |
| `/pricing.html` | — | 56 KB | |
| `/dashboard.html` | — | 24 KB | |
| `/contact.html` | — | 24 KB | |
| **Total prerendered HTML + RSC** | — | **16.86 MB over 114 files** | |

First Load JS is 103 KB shared, 107–134 KB per route.

R1 changed how data is *fetched*, not how much of it is *serialised into the
page*, so these figures are expected to be flat against the audit — and they
are. The two numbers that matter for reconstruction:

- `/schools` at 1.43 MB HTML + 1.14 MB RSC is the single worst offender, and
  the cause is architectural: the catalog ships every school and program to a
  client-side filter. Fixing it means moving the filter boundary to the server,
  which is a Phase 3/4 interaction-design decision (TD-10 covers the sibling
  problem of rendering 508 rows at once).
- School detail pages scale with how much content a school has. Manhattan at
  573 KB is 3× Yale at 243 KB; the ceiling grows with each import.

Suggested budgets to adopt when enforcement starts — deliberately above today's
numbers so they gate regressions rather than demand a rewrite on day one:

| Surface | Proposed budget |
|---|---:|
| Marketing pages (HTML) | 150 KB |
| School detail (HTML) | 600 KB |
| Program detail (HTML) | 150 KB |
| `/schools` (HTML) | 1.5 MB, to be reduced by design |
| First Load JS, any route | 150 KB |

---

## 6. Known gaps at the time of writing

- **Invalid detail URLs answer 200.** R4 owns it; the smoke suite tracks it as
  an expected failure.
- **Build reaches Google Fonts.** Mitigated, not removed. Section 1.
- **Directus reachability from CI runners is unverified.** Section 2.
- **`npm ls --omit=dev` reports `@emnapi/runtime` and `@img/sharp-wasm32` as
  extraneous.** Verified on a clean `npm ci`, so this is reproducible from the
  lockfile — an artefact of the `sharp` override pulling its wasm fallback
  variant — not local pollution. Zero vulnerabilities; no action.
- **No observability.** Audit P1-6, scheduled for Phase 5 launch prep. Until
  then the smoke suite is the only health signal, and it is not scheduled.
