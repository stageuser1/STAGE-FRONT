# 04 — Interaction flows

Six flows, each as: trigger → steps → state transitions → persistence → failure paths.
"State" means observable UI state plus the storage key that changed. Every write named
here is defined in `06_DATA_REQUIREMENTS.md`.

Notation: `S#` = a UI state · `→` = transition · `⟨key⟩` = a storage write ·
`✗` = failure branch.

---

## Flow A — Profile creation (P-04)

**Trigger points** (all carry `?return=<path>`):
`/schools` nudge row · Fit Panel `[2 分钟建立档案]` · Dashboard onboarding ·
Suite result `[建立档案并保存这个估算]` · `MobileBottomNav → 我的` (WP4 retarget).

```
S0 no profile
   └─ open /profile?return=/schools/msm/programs/1042
      → read ⟨stage.profile⟩ … null
      → S1 step ① pristine
S1 step ① 主修
   ├─ select chip           → patch discipline.fieldSlugs ⟨stage.profile⟩ → savedAt=now
   ├─ [跳过]                → steps.discipline = "skipped"  → S2
   └─ [下一步]              → steps.discipline = "answered" → S2
S2 step ② 目标学位 + 入学学期        (same three edges)
S3 step ③ 国家 + 预算
S4 step ④ 学术背景
S5 step ⑤ 英语情况
   ├─ 有成绩? = 否           → english.hasScore=false; target score still asked
   ├─ 有成绩? = 是 → test → current/target steppers
   │                        → english.currentSource = "self_reported"
   └─ [完成]                → S6
S6 complete
   → profileCompleteness() recomputed (derived, never stored)
   → router.replace(returnPath ?? "/dashboard")
   → the originating surface re-reads ⟨stage.profile⟩ on mount and re-renders with
     the personal column filled
```

**Autosave contract (C1 draft rule, applied to the profile).**
Write on every change · flush on `visibilitychange === "hidden"` · flush on `beforeunload` ·
display `已自动保存 · HH:mm` · never clear on exit. There is no "save" button because
there is no unsaved state.

**Re-entry.** Opening `/profile` with an existing profile resumes at the first step whose
`steps[id] === "pristine"`; if none, it opens step ① in edit mode with values populated
and the footer CTA reading `[完成]`.

**Cross-tab.** A `storage` event on `stage.profile` triggers a re-read in every open
surface; the Fit Panel's verdict line is `aria-live="polite"` so the change is announced.

**Failure paths.**
`✗ localStorage write throws` (quota / Safari private) → persistent inline banner
`无法保存到本机浏览器，本次填写在离开页面后会丢失`; the flow continues in memory and every
step still advances. **Never** a modal, never a blocked step.
`✗ schemaVersion is newer than the running build` → read-only banner
`档案由更新版本创建，请刷新页面`; no write is attempted (a downgrade must not corrupt).
`✗ schemaVersion is older and unmigratable` → `档案格式已更新，请重新填写` with a
`[下载旧档案]` JSON button before anything is overwritten.

---

## Flow B — Match run with fallback consent (P-05, Phase 2)

```
S0 /match opened
   → read ⟨stage.profile⟩
   ├─ null              → S0a: constraint panel prefilled with nothing +
   │                      “先建立档案可以自动填入条件 [建立档案]”; manual entry still allowed
   └─ present           → S1 constraints seeded from profile, each tagged 来自档案
S1 editing
   ├─ toggle hard/soft   → constraint.hardness  (local state only)
   ├─ edit value         → constraint.fromProfile = false; [恢复档案值] appears
   └─ [生成推荐]         → S2
S2 generating
   → runMatch(profile, constraints, MATCH_ALGORITHM_VERSION)
     1. filter: drop every program failing a `hard` constraint
     2. score: language / timing / academic / budget / field  → weighted 0–1
     3. rank; attach per-item reasons with evidence refs
   ├─ results ≥ target(10)  → S4
   └─ results <  target     → S3
S3 shortage  (C-10 FallbackConsentDialog, modal)
   shows: “按你的条件只找到 4 个项目。放宽以下条件可以增加：”
     ☐ IELTS ≥6.5 → ≥6.0        (+7 个项目)
     ☐ 预算 ≤$50k → ≤$60k       (+3 个项目)
   ├─ [取消]                     → S4 with the 4 results, unrelaxed, and a note
   │                               “已按你的原始条件显示” — never an empty screen
   └─ check ≥1 + [按放宽后的条件继续]
                                  → re-run with only the checked relaxations
                                  → S4, each relaxed constraint marked 已放宽 on the card
S4 results
   → ⟨stage.match.runs⟩ append immutable snapshot {runId, createdAt, profileVersion,
      algorithmVersion, constraints, relaxations, items[]}
   ├─ [换一批]  → re-run with exclude = every programId already shown in this run chain
   │              (a new immutable run; the previous run is not mutated)
   ├─ card      → P-03 (the fit panel there recomputes independently and must agree)
   ├─ [收藏]    → ⟨stage.saved.programs⟩
   └─ 历史运行 ▾ → browse previous runs read-only
```

**Invariants.**
1. A hard constraint is never relaxed without a checked box — no silent widening, ever.
2. A run is immutable. Re-running creates a new `runId`; nothing edits an old one.
3. The rule sentence and `MATCH_ALGORITHM_VERSION` are visible on the results header.
4. Every item carries ≥1 reason, and every eligibility reason carries an evidence ref.
5. `ineligible` items are collapsed behind a disclosure, never deleted from the run.

**Failure paths.** `✗ profile missing required inputs` → the shortage dialog is skipped
and the panel names the missing input with a link to that profile step.
`✗ zero results even fully relaxed` → `EmptyState` naming the single most restrictive
constraint and offering to drop it.

---

## Flow C — Reading fit and gaps on a program page (P-03)

```
S0 server render
   → getProgramById → toPublicProgramDto
   → the page paints in full: header, decision bar, checklist requirements,
     all detail sections.   ← discovery is never gated
S1 client mount
   → read ⟨stage.profile⟩
   ├─ null    → S2a anonymous
   └─ present → S2b personalised
S2a anonymous
   Fit Panel structure renders; each dimension reads 建立档案后可比对
   Checklist rows show the *requirement* and state = "unknown" for the personal half
   CTA [2 分钟建立档案] → Flow A with return = this URL
S2b personalised
   → checklist = buildRequirementChecklist(program, profile)      (pure)
   → bandGap   = ieltsGap(program, profile)                        (pure)
   → dimensions= scoreDimensions(program, profile)                 (pure)
   → verdict   = worst(dimension states)
S3 reading a gap
   row “语言成绩 · 有差距” ▸
     → ProseBlock detail + evidence quote + source link + 核验于 2026-03-11
     → [如何满足 →]  ──► /ielts-lab/suite?target=6.5&from=program:1042
S4 acting
   ├─ [加入我的清单] → ⟨stage.saved.programs⟩ append {programId, schoolId, savedAt,
   │                    snapshot:{names, deadlines, ieltsMinimum, lastCheckedAt}}
   │                  → the chip flips to 已收藏; dashboard picks it up on next mount
   └─ [去雅思实验室提分] → Flow E (suite), which returns via Flow F
```

**State derivation rules (must hold exactly).**

| Input | State |
|---|---|
| requirement recorded **and** profile value present **and** value ≥ requirement | `satisfied` |
| requirement recorded **and** profile value present **and** value < requirement | `gap` |
| requirement recorded **and** profile value absent | `unknown` (+ `补全档案` link to the step) |
| requirement explicitly negative (`prescreening_required = "No"`) | `not_required` |
| requirement field null / unparseable | `unknown` + `暂未收录` |

`unknown` never renders amber or red. "Not verified" and "not met" are different claims.

**Failure paths.** `✗ minimum_score is prose` (e.g. `"6.5 (no band below 6.0)"`) →
`parseBandScore` extracts the leading number for the meter and renders the **full
original string** in the row summary; the meter shows `按 6.5 比对，另有单项要求 ▸`.
Never silently drop a section requirement.
`✗ fit computation throws` → the panel's own error boundary renders `匹配暂不可用，要求信息仍可查看`;
the rest of the page is untouched.

---

## Flow D — Practice → review → wrongbook → redo (P-08 → P-09 → P-10)

```
S0 /ielts-lab/practice/p1-high-01
   → iframe boots; STAGE sends INIT_SESSION on a 500ms retry loop (max 20)
   ├─ SESSION_READY          → S1 ready
   └─ ✗ no reply in ~10s     → S0e “题目加载失败 [重新加载]”  (today this fails silently)
S1 attempt in progress          (the runner owns the timer, navigator and drafts)
   ├─ SIMULATION_DRAFT_SYNC → ⟨stage.ielts.drafts⟩ {examId, updatedAt, answered}   [OQ-3, WP2]
   │                          → bar shows 上次作答保存于 12:04
   │                          → catalog cards for this exam flip to C-06 "pending"
   └─ [← 退出] → inline confirm row (not window.confirm) → /ielts-lab/browse
S2 PRACTICE_COMPLETE
   → toPracticeRecord(data, ctx, questionTypeOf)      (runner is the scoring authority)
   → ⟨stage.ielts.practice-records⟩ prepend           IMMUTABLE from here
   → clear ⟨stage.ielts.drafts⟩ for this exam
   → ResultPanel over the frame: 正确率 / 得分 / 用时 / 按题型
   → actions: [查看逐题回顾] [在原题中回顾] [再做一次] [继续练习]
S3 /ielts-lab/review/{recordId}                        ← the new native review
   → getRecord(recordId)
   ├─ found     → S3a
   └─ not found → S3e “找不到这条练习记录…” [返回记录] [导入记录]
S3a masked review
   all correct answers masked ●●● on every mount, always
   ├─ [显示] on a row      → reveal that answer only        (never persisted)
   ├─ [全部显示答案]        → reveal all; button flips to [隐藏全部答案]
   ├─ 原文定位 ▸           → lazy loadExplanation(examId)
   │      ├─ ready       → paragraph label + Chinese explanation + [在原题中查看高亮]
   │      └─ ✗ unavailable → “这篇暂无解析” + the runner link (row keeps tier 1)
   ├─ C-16 pager ◀ ▶       → another attempt of the same exam (a different record)
   └─ [重做这篇]           → full document load of practiceHref(examId)  → S0
                              (router.push is a no-op when the URL is unchanged —
                               this is why the existing RetryButton uses location.assign)
S4 /ielts-lab/mistakes
   → buildWrongbook(loadRecords())
       for each examId: latest record by createdAt; include iff ≥1 isCorrect === false
       sort by that record’s createdAt desc
   ├─ ▸ expand row  → the wrong questions only, same reveal discipline as S3a
   ├─ [回顾]        → S3 for that record
   └─ [重做]        → S0 for that exam
S5 redo completes (S0→S2 again)
   → a NEW record is prepended; the old one is never modified
   → next render of S4 recomputes: if the new latest attempt has 0 wrong,
     the exam leaves the wrongbook. Nothing was “marked resolved”.
```

**Invariants.**
1. Attempts are immutable. Redo appends; it never edits.
2. Wrongbook, three-state status and category accuracy are **derived on read**. Nothing
   about them is stored.
3. Reveal state is per-visit and never persisted.
4. A record's stored `answerComparison` is what the review shows — a later corpus answer-key
   correction cannot retroactively change what the learner was told (existing
   `sendReplayRecord` behaviour, matched by the native review).

**Failure paths.** `✗ corrupt localStorage` → `loadRecords()` already returns `[]`; add a
one-line `无法读取本机练习记录` notice so silent data loss is visible.
`✗ quota exceeded on save` → the record stays in memory and renders; the panel shows
`本次记录未能保存到本机 [导出 JSON]` so the attempt can be rescued.

---

## Flow E → F — Suite compose → run → band → profile update (P-11)

```
E0 /ielts-lab/suite  (optionally ?target=6.5&from=program:1042)
   → banner when `from` present: 为 MM Violin 提分 · 目标 6.5
E1 compose
   scope chips (仅高频 / 高频+次高频 / 全部)
   [抽取三篇] → composeSuite(exams, progress, scope)
   ├─ null      → E1e shortage: names the category + scope that failed, offers 全部题目
   └─ ExamSummary[3] → E2
E2 preview   (NEW — today compose starts immediately)
   P1 / P2 / P3 rows, each with [换一篇] (pickRandomExam excluding the current three)
   [重新抽取] redraws all three
   [开始套题] → startSuite(entries, scope) ⟨stage.ielts.session⟩ → composition frozen
E3 run
   → practiceHref(entry.examId, "suite") for each entry in order
   → each submit writes its own PracticeRecord carrying SuiteRef{id,index,total}
   → session.entries[i].recordId set; index advances
   → after the third: isSuiteComplete → E4
E4 result
   correct = Σ record.correctAnswers ; total = Σ record.totalQuestions
   band    = estimateBand(correct, total)          // lib/ielts/band.ts
   ├─ total === 40 → exact table lookup
   └─ total !== 40 → scale to 40, render “按 {total} 题折算”
   render: 总分 / 正确率 / 总用时 / 估算分数 + table version + 估算仅供参考
           per-passage rows → [逐题回顾] → Flow D S3
F0 [用这个估算更新我的档案]     ← the fusion step; ALWAYS explicit
   ├─ profile exists → patchProfile({
   │     english: { labEstimate: {band, recordCount, computedAt, algorithmVersion},
   │                currentOverall: band, currentSource: "lab_estimate" }})
   │                → ⟨stage.profile⟩
   │                → confirmation row: 已更新 · 3 个项目的语言差距已重新计算
   │                                    [查看这些项目]
   └─ no profile → /profile?return=/ielts-lab/suite&prefillBand=6.5
                   (step ⑤ prefilled, still editable, still skippable)
F1 downstream recomputation                           (all pure, all on next render)
   ├─ P-03 Fit Panel  → BandGapMeter re-reads profile.english
   ├─ P-02 fit strip  → counts recomputed
   └─ P-06 dashboard  → readiness + the “提高雅思” action card disappears once satisfied
```

**Invariants.**
1. A suite result never silently overwrites a self-reported score. The write is one
   explicit button, and the profile records `currentSource` so the origin stays visible.
2. Abandoning a suite keeps every completed passage in history (existing behaviour).
3. The band estimate always renders with: the table version, the number of questions it
   was computed from, and the word 估算.

**Failure paths.** `✗ a mid-suite record was deleted from history` → the row renders
`记录已删除` and is excluded from the total (existing behaviour), and the band line reads
`部分成绩缺失，暂不估算` rather than reporting a wrong total.
`✗ an exam left the corpus between compose and start` → `题库中已无此篇 [换一篇]`.

---

## Flow G — Dashboard next-action loop (P-06)

```
G0 /dashboard mount
   → read ⟨stage.profile⟩ ⟨stage.saved.programs⟩ ⟨stage.ielts.practice-records⟩
   ├─ all empty → G0a onboarding: 建立档案 → 收藏项目 → 开始练习   (one card, three steps)
   └─ any data  → G1
G1 build actions                                  lib/dashboard/actions.ts (pure)
   generators, each emitting 0..n ActionItem with a why-line that cites its evidence:
     ielts_gap    : max(required) over saved programs − current estimate > 0
                    why: “3 个项目要求 6.5 · 你的估算 6.0（12 次练习）”
     deadline     : nearest deadline within 90 days
                    why: “还有 98 天 · 核验于 2026-03-11”
     weak_type    : weakestType(buildQuestionTypeStats(records), minAttempted = 5)
                    why: “信息匹配 52%（作答 23 题）”
     profile_hole : first pristine/skipped step that blocks a dimension
                    why: “缺少预算区间，2 个维度无法评估”
     stale_data   : saved snapshot older than 30 days
                    why: “信息可能已更新”
   → sort by priority, drop dismissed (⟨stage.profile⟩.nudges), take 3
G2 acting
   ├─ ielts_gap    → /ielts-lab/browse?type=matching   → Flow D → Flow E/F
   ├─ deadline     → P-03                              → Flow C
   ├─ weak_type    → /ielts-lab/browse?type=…
   ├─ profile_hole → /profile?step=geography&return=/dashboard → Flow A
   └─ stale_data   → P-03 (visiting refreshes the snapshot)
G3 return
   → the underlying storage changed → the generator no longer emits that item
   → the card is gone on the next mount. Nothing is “marked done”; the loop closes
     because the condition that produced the card stopped being true.
G4 dismissal
   [忽略] → ⟨stage.profile⟩.nudges[id] = ISO date
   → hidden, and recoverable under 已隐藏的建议 (N) ▸
```

**Invariant — the loop is derived, not stored.** No action item is persisted as
"completed". The card list is a pure function of profile + saves + records, so it can
never disagree with the surfaces it points at. This is the same rule that governs the
wrongbook, and it is what keeps the two consistent for free.

**Failure paths.** `✗ one generator throws` → it contributes zero items and logs; the
other generators still render.
`✗ no generator produces anything` (a complete, on-track student) → a single positive
card: `目前没有需要立即处理的事项 · 下一个截止在 98 天后`.
