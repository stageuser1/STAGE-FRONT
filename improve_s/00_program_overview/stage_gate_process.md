# Stage Gate Process

No phase proceeds without owner acceptance. This document defines how that
acceptance is granted, what evidence is required, and what triggers rollback.

---

## 1. Gate flow

```
Claude writes repository-aware plan   (claude_plan.md)
        ↓
Owner approves phase entry            (logs/decisions.md)
        ↓
Codex executes in dedicated branch    (codex_execution.md)
        ↓
Typecheck + build                     (must pass)
        ↓
Verification / measurement            (acceptance_checklist.md)
        ↓
Claude review → recommended verdict   (report.md)
        ↓
Owner Stage Gate decision             ← THE ONLY APPROVAL THAT COUNTS
        ↓
Merge to main + deploy   |   Iterate   |   Rollback
        ↓
Next phase
```

---

## 2. Verdicts

Every gate ends in exactly one signed verdict, recorded in `logs/decisions.md`:

| Verdict | Meaning | Consequence |
|---|---|---|
| **PASS** | All acceptance criteria met with evidence | Merge, deploy, proceed |
| **PASS WITH CONDITIONS** | Criteria met; named follow-ups outstanding | Merge, proceed; conditions logged with an owner and a deadline |
| **FAIL** | One or more criteria unmet | Do not merge. Return to Claude for diagnosis. |
| **DEFER** | Phase is valid but should not run now | Branch preserved; reason logged |

A verdict requires: the date, the owner's explicit statement, and a link to the
evidence in that phase's `report.md`.

---

## 3. Evidence requirements

**A gate cannot pass on assertion.** Each phase's `acceptance_checklist.md`
lists its specific evidence. Universal requirements:

| Requirement | Form of evidence |
|---|---|
| Build passes | `npm run build` output, exit code |
| Typecheck passes | `npm run typecheck` output, exit code |
| No visible regression | HTML content diff on one school page + one program page |
| Performance claim | ≥5 runs per route, medians, vs. recorded baseline |
| Scope respected | `git diff --stat` confined to the batch allowlist |
| Rollback available | Commit SHA in `logs/rollback_history.md` |

---

## 4. Signatories per phase

| Phase | Claude reviews | Owner approves as |
|---|---|---|
| `01_` Baseline | Measurement validity | SRE + TPM |
| `02_` Transport security | Design correctness | SRE + Security |
| `03_` Data boundary | Payload evidence | Security + QA |
| `04_` Speed architecture | Diff + cache behavior | Engineer + SRE + QA |
| `05_` Cleanup | Deletion evidence | TPM + QA |
| `06_` Final verification | Full comparison | All |

The owner holds every role. The column exists so the owner knows **which
question they are answering** at each gate.

---

## 5. Rollback triggers

| Phase | Rollback trigger |
|---|---|
| `01_` | No valid baseline can be produced → phase FAILS rather than proceeding on the discredited "1–2s" figure |
| `02_` | TLS/proxy breaks reviewer login → revert DNS/proxy; frontend untouched |
| `03_` | Any approved public content disappears from a page |
| `04_` | Stale or incorrect content served; measurements worse than baseline; build output shows unexpected rendering mode |
| `05_` | Any unexplained build error, missing route, or broken link after a deletion batch |
| `06_` | Production-only failure not reproducible in Preview |

---

## 6. Known gate weaknesses (must be resolved or formally waived)

These were identified in the V2 review. Each blocks the gates that depend on it:

| Gap | Affects | Resolution |
|---|---|---|
| **No Preview environment evidenced in the repo** | Every phase gate that requires Preview | Confirm/create, or formally downgrade gates to local production builds and rewrite the criteria |
| **Zero frontend tests** | QA sign-off at every gate | Build a minimal smoke suite in `01_`, or formally downgrade QA sign-off to a documented manual checklist |
| **Baseline in the original brief is stale** | All performance gates | Discard the "1–2s" figure. Re-measure in `01_`. |
| **No reviewer test account** | `06_` reviewer round-trip verification | Obtain before `06_`. The round-trip has never been verified live. |

Record the resolution of each in `logs/decisions.md` before the phase it blocks.

---

## 7. Gate checklist template

Copy into the phase's `acceptance_checklist.md` and fill in:

```text
PHASE: ____________________          DATE: ____________
BRANCH: ___________________          ROLLBACK SHA: ____________

□ Plan approved by owner before execution        (logs/decisions.md ref: ____)
□ All batches confined to the file allowlist     (git diff --stat attached)
□ npm run typecheck passes                       (output attached)
□ npm run build passes                           (output attached)
□ Phase-specific criteria met                    (see checklist below)
□ No visible content regression                  (HTML diff attached)
□ Measurements recorded vs. baseline             (≥5 runs, medians)
□ Rollback commit recorded
□ report.md complete

CLAUDE RECOMMENDED VERDICT: ______________________
OWNER VERDICT: PASS / PASS WITH CONDITIONS / FAIL / DEFER
CONDITIONS (if any): _______________________________
OWNER SIGNATURE / DATE: ____________________________
```
