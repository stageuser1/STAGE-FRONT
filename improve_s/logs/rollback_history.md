# Rollback History

Two purposes:

1. **Before** each phase — record the rollback commit SHA, so a clean revert is
   always available.
2. **After** any rollback — record what was reverted, why, and what changed
   before the next attempt.

**A phase must not begin until its rollback point is recorded here.**

---

## Rollback points

| Phase | Branch | Rollback SHA | Recorded on | Recorded by |
|---|---|---|---|---|
| `01_` Baseline | `perf/s0-baseline` | `86c1db9` | 2026-07-23 | Claude |
| `02_` Transport security | none (infra) | n/a — DNS/proxy revert | | |
| `04_` Speed architecture | `perf/s1-speed-track` | `742e901bf036daed924ea7732f7b33ec1f800107` | 2026-07-23 | Codex |
| `03_` Data boundary | `perf/s2-data-boundary` | `ac46f9e09551cdb67cba48fe05858f3366c489d1` | 2026-07-24 | Codex |
| `05_` Cleanup | `perf/s4-cleanup` | | | |
| `06_` Final verification | none (verification) | last known-good `main` | | |

---

## Program baseline ✅ ESTABLISHED

- **Baseline commit SHA:** `86c1db9ccda8e71a73603454a625652e7df8177b`
- **Short SHA:** `86c1db9`
- **Message:** "Add optimization program control workspace"
- **Recorded on:** 2026-07-23
- **Branch at time of recording:** `main` (tip); Phase 0 branch
  `perf/s0-baseline` cut from this commit
- **Working tree clean:** ☑ yes — `git status --short` empty
- **Pushed to origin:** ☐ **NO — local only.** See D-003 open risk before pushing.

**This is the commit every later phase reverts to.**

### How the baseline was reached (D-003)

`00b341a` → four commits applying the D-003 classification:

```
86c1db9  Add optimization program control workspace          ← BASELINE
e884935  Ignore local Directus import scratch directory
524efcd  Add V4 extraction packages for ten schools          (62 files, +118,288)
32bd745  Add UK conservatoire and nine-school extraction tooling
00b341a  Import nine STAGE V4 schools into Directus          (previous HEAD)
```

`tmp/` (34 MB of dry-run scratch) was gitignored rather than committed.
No application code, configuration, or Directus setting was touched.

Pre-program state (**corrected 2026-07-23** — `HEAD` advanced during workspace
setup; an earlier draft of this file recorded `c123ec8`, which is now stale):

```
00b341a 2026-07-23 Import nine STAGE V4 schools into Directus   ← CURRENT HEAD
c123ec8 2026-07-22 Implement Figma Explore mobile design
8a9d9f1 2026-07-21 Add UK conservatoire programme extraction and audit report
```

`00b341a` committed `scripts/import_v4_package.mjs` (previously modified) and
added the nine-school import tooling and reports. It imported nine schools into
live Directus — see `docs/imports/stage-v4-nine-school-verification.json`.

Uncommitted at the time of this correction — must be resolved before Phase `01_`
Batch 1 (decision D-003):

```
?? improve_s/
?? output/
?? scripts/build_uk_music_conservatoires.mjs
?? scripts/enrich_nine_school_official_requirements.py
?? scripts/generate_v4_companion_reports.py
?? scripts/verify_uk_extraction_urls.mjs
?? tmp/
```

**Note:** `scripts/import_v4_package.mjs` is no longer modified — it was
committed in `00b341a`. The item count is now 6 untracked entries (including
`improve_s/` itself) and **zero** modified tracked files.

Stale branch to dispose of at some point: `pilot/reduced-data-model`
(exists locally and on `origin`).

---

## The cleanest rollback lever

**Phase `04_` (speed architecture) reverts perfectly.** Restoring
`export const dynamic = "force-dynamic"` on the four public routes and
`cache: "no-store"` in `lib/data.ts:165` reproduces pre-program behavior
exactly. No schema, dependency, or configuration change is involved anywhere in
that phase.

If the site misbehaves after the speed work and the cause is unclear, this is
the first lever to pull.

---

## Rollback event template

```markdown
### R-___ · [YYYY-MM-DD] — <what was rolled back>

- **Phase / batch:** 
- **Reverted to SHA:** 
- **Trigger:** which stop condition or gate criterion failed
- **Symptom observed:** 
- **Diagnosis (Claude):** 
- **What is different in the next attempt:** 
- **Time lost:** 
- **Approved by:** owner
```

---

## Rollback events

_None yet._
