# Opus Stage Prompts — STAGE Visual Replacement Program

**How to use:** open a fresh Claude Code session (Opus) per stage, paste the stage prompt as the first message, and let it run to completion. Run stages in order T0 → T1 → T2 → T3 → T4 → T5; T2 and T3 may run in parallel sessions after T1 (they share no files). T6/T7 are gated on backend approvals and each stops mid-session to ask for yours. Every prompt is self-contained; the binding rules live in `docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md` (referred to below as "the Plan").

---

## T0 — Design foundation: tokens + compliance guard

```
You are executing stage T0 of the STAGE visual replacement program.

READ FIRST, in order, before writing any code:
1. docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md — the binding constitution for this
   program (rulings §1, scope §2, gates §4–5, preservation list §6, environment §8).
   Everything below is subordinate to it.
2. docs/upgrade/01_DESIGN_SYSTEM.md — the current two-token-family system.
3. tailwind.config.ts and app/globals.css.

MISSION: extract the visual language from the approved design export into updated
App-family design tokens, and build the compliance guard script.

TASKS
1. Open design-reference/STAGE IELTS Lab.html in the in-app browser (a self-contained
   ~8.6MB SPA export; serve it via the preview mechanism or a throwaway static route).
   CRITICAL: browser-pane screenshots HANG on this machine — never take screenshots.
   Inspect with read_page / get_page_text / javascript_tool (getComputedStyle on
   representative elements: page background, sidebar, cards, primary and secondary
   buttons, chips, headings, body text, muted text, borders, radii, shadows, spacing).
   Note: the export's left-sidebar navigation structure is NOT to be adopted (ruling
   C3+C6) — you are harvesting its visual language only.
2. Write docs/roadmap/T0_TOKEN_MAP.md: a table of every stage-* token — old value,
   new value, where in the export it came from, or "unchanged".
3. Update ONLY App-family tokens (stage-* CSS variables in app/globals.css, stage-*
   entries in tailwind.config.ts). Do NOT touch Explore-family tokens (brand.*, ink.*,
   line, page), do not add a third token family, no new fonts, no new npm dependencies.
4. Create scripts/guard.mjs plus a "guard" npm script implementing Plan §4.2 exactly:
   (a) competitor-name scan across the whole repo including docs/ — the blocklist is
       stored base64-encoded inside the script and is NEVER written decoded anywhere:
       ["6Jm+5ruR5ZCs5Yqb","5Lmd5YiG5a2m6ZW/","SUVMVFMgTWFzdGVy","T25lSUVMVFM=",
        "TW9ja0lFTFRT","VmVyc2Vv","TGFuZ2FyZA=="]
       (decode at runtime, match case-insensitively);
   (b) `labEstimate|estimateBand|BAND_TABLE` scan over code files (.ts/.tsx/.js/.mjs);
   (c) banned Lab UI words — 估算, 倒计时, 模考, 待核验, 待公布, 雅思实验室 — scanned
       ONLY under components/ielts/** and app/(ielts)/** (ruling C5: the explore-side
       vocabulary is exempt and must not be flagged);
   (d) structural checks: a second route-group directory containing ielts-lab; any file
       named export.ts.
   Exclusions: node_modules, .next, design-reference/, scripts/guard.mjs itself.
   Non-zero exit with a file:line report.
   Pre-existing violations that later stages will remove (估算 strings in Lab components
   until T1/T3; 雅思实验室 in content/landing.ts until T2) go into an explicit whitelist
   array inside the script, each entry commented with the stage that must delete it.
5. Gate: npm run typecheck && npm run build && npm run test && npm run guard — all
   green. Confirm the production build actually emitted artifacts (this machine has a
   known failure mode where a Google-Fonts download reset makes build exit 0 with no
   output; keep .next/cache). Spot-check via preview + read_page that Explore-family
   pages (/schools and one program page) are visually unchanged.

FINISH: commit on main (do NOT push), message in the repo's existing style, e.g.
"feat(design): app-family tokens from approved export + compliance guard".
Report: what changed, each acceptance item pass/fail, the guard whitelist contents,
issues found but not fixed. Do not start any other stage.
```

---

## T1 — Kill the band-estimate system (ruling C1) + Profile v2

```
You are executing stage T1 of the STAGE visual replacement program.

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (ruling C1 in §1; §2.2 is
your authoritative file-by-file scope; gates §4, §5-T1; preservation §6; environment
§8). Then read lib/ielts/band.ts, lib/profile/types.ts, and every file referencing
labEstimate / estimateBand / BAND_TABLE (grep for them).

MISSION: remove every trace of score estimation ("band estimate") from the product,
and migrate the local profile schema to v2 with user-set target scores.

TASKS
1. Delete lib/ielts/band.ts and tests/ielts_band.test.mjs.
2. components/ielts/SuitePractice.tsx: remove the estimate block and the
   "update my profile with this estimate" CTA. The suite result shows only
   总分 / 正确率 / 总用时 / 分篇明细 (native data, no score conversion of any kind).
3. components/ielts/LabOverview.tsx: remove the estimate-based goal banner. Replace it
   with a functional, minimally-styled 目标分数设定卡 (target-score card): one editable
   number input per subject, range 4.0–9.0, step 0.5, label verbatim `我的目标分数`,
   helper text verbatim `目标分数由你自己设定，仅用于个人规划参考。` Only Reading is
   live today; render inputs for all four subjects (they are the user's own intent, not
   feature claims). T3 will restyle this card — keep the markup simple.
4. components/dashboard/DashboardView.tsx: remove estimate tiles/copy; show native
   metrics (accuracy trend, attempt counts, weakest question type) plus the user-set
   target for comparison, clearly labelled as self-set.
5. components/fit/BandGapMeter.tsx: rework to compare programme requirement vs the
   user's SELF-ENTERED figures (self-reported current score and/or self-set target).
   Remove all estimate provenance lines. Update lib/fit/dimensions.ts,
   lib/fit/requirements.ts, lib/dashboard/actions.ts, lib/dashboard/readiness.ts so the
   language dimension reads only self-entered values; when missing, the state is 待确认
   rendered neutral (never 0, never amber/red — "not verified" ≠ "not met").
6. Profile schema v2 in lib/profile/types.ts: PROFILE_SCHEMA_VERSION = 2. Remove
   english.labEstimate and the "lab_estimate" source value. Add per-subject targets,
   e.g. english.targets: { reading|listening|writing|speaking: number|null }.
   lib/profile/migrate.ts v1→v2: keep self-reported values; if currentSource was
   "lab_estimate", set currentOverall to null (estimates are abolished, not laundered);
   map the old single targetOverall into the new structure. Migration runs through the
   existing loadProfile machinery — do not bypass it. Update
   tests/profile_migrate.test.mjs, tests/fit_requirements.test.mjs,
   tests/dashboard_actions.test.mjs.
7. docs/upgrade: add dated supersession notes ("superseded by ruling C1, see
   docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md") on OQ-2 and the estimate-related
   acceptance criteria in 00/02/05/06. Add notes; do not rewrite history. Refer to the
   removed identifiers descriptively so the guard's code scan stays clean.
8. Remove this stage's entries from the guard whitelist. npm run guard must pass with
   zero hits for labEstimate|estimateBand|BAND_TABLE in code.

VERIFY (Plan §4 gates, plus): via preview + read_page — suite result page, dashboard,
lab overview, one program page's fit panel show no 估算/Band wording; seed a v1 profile
into localStorage via javascript_tool and confirm it auto-migrates to v2 with
self-reported values intact. Browser screenshots hang on this machine — use read_page.

FINISH: commit on main (no push), e.g. "feat(profile)!: remove band-estimate system
(ruling C1); profile schema v2 with self-set targets". Report per Plan §4.3.
Do not start any other stage.
```

---

## T2 — Homepage replacement + transition pages

```
You are executing stage T2 of the STAGE visual replacement program.

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (§1 rulings C7 + 小项1/2/3,
§2.1 scope table, §4–5 gates, §6 preservation, §8 environment). Then
docs/stage-specs/homepage-spec.md (the authoritative homepage spec — verbatim copy
marked 逐字 must not be altered), docs/stage-specs/ielts-lab-supplement-spec.md §四
(footer disclaimer), and the current app/(marketing)/** + components/marketing/** +
content/landing.ts.

MISSION: replace the marketing homepage wholesale per the new spec. Layout, sections,
copy, and imagery all come from homepage-spec.md; nothing from the old landing is kept
unless the spec defines it.

TASKS
1. Navbar (MarketingNavbar + MarketingMobileMenu): STAGE wordmark left; 院校与专业 ·
   IELTS Lab · 指南 · 定价 right; solid CTA at far right reading 「探索音乐院校」
   (ruling C7 — never "免费开始使用", no signup implication). 联系我们 moves to footer.
2. Page sections per spec §二, copy per §三 verbatim: hero (badge / two-line title /
   subtitle / dual CTA / trust line), dual-screenshot moment, stats strip, verification
   block, IELTS Lab block, three persona cards, conversion block, footer.
3. Screenshots are hand-built mock components (replace AppPreviewCard /
   IeltsSimPreview), content per spec §四 with these ruling overrides:
   - hero side-card: neutral opening state — no "已导入自 …" line;
   - the IELTS Lab block image depicts the READING evidence review (two panes, passage
     with highlighted sentence, error-evidence link) — no timestamps, no listening UI,
     and absolutely no score/Band/AI-assessment elements anywhere in any mock.
4. Stats strip: compute the real numbers at build time from existing data fetches
   (getAllSchools / getAllPrograms). If reality differs from the spec's figures, the
   real numbers win. No hardcoded marketing claims.
5. Footer (MarketingFooter): guide links, 术语库, 联系我们, 备案信息, the full-width
   oversized STAGE wordmark closing the page, the IELTS® trademark disclaimer verbatim
   from ielts-lab-supplement-spec.md §四 followed by an HTML comment
   <!-- 法务口径待核实 -->, and the three official links (external, new window,
   rel="noopener").
6. New transition pages app/(marketing)/guides/page.tsx and
   app/(marketing)/glossary/page.tsx modeled on the existing app/(marketing)/pricing
   transition page (小项1), so no nav link is dead.
7. content/landing.ts: full copy replacement. Remove every "雅思实验室" and every
   AI-analysis/AI-scoring claim. Update the guard whitelist accordingly (remove T2
   entries).
8. Do not touch app/(marketing)/pricing content, contact routes, or anything outside
   the marketing surface. Explore/product/ielts route groups are out of scope.

VERIFY (Plan §4 gates, plus §5-T2): verbatim copy diff against the spec section by
section; nav CTA text; stats are computed values; disclaimer + official links present;
guides/glossary/pricing all reachable and consistent; mobile 375 via read_page — no
horizontal scroll, hero readable. Screenshots hang on this machine — use read_page /
javascript_tool only. npm run guard passes.

FINISH: commit on main (no push), e.g. "feat(marketing): homepage replaced per
approved spec". Report per Plan §4.3. Do not start any other stage.
```

---

## T3 — IELTS Lab reskin (existing surfaces)

```
You are executing stage T3 of the STAGE visual replacement program.

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (§1 rulings — C2, C3+C6, C4,
C5 all bite here; §2.3 scope table; §4–5 gates; §6 preservation; §8 environment). Then
docs/stage-specs/ielts-lab-master-spec.md and ielts-lab-supplement-spec.md (authorities
for this stage; their header notes list which parts are deferred),
ielts-lab-reading-player-spec.md §三/§四 (result-transition page + verbatim copy — the
only parts of that spec in scope), and docs/roadmap/T0_TOKEN_MAP.md.

MISSION: reskin every existing IELTS Lab surface to the new visual standard WITHOUT
changing the information architecture or any mechanism.

HARD BOUNDARIES (read twice)
- LabNav items and structure stay exactly as they are (ruling C3+C6): no left sidebar,
  no 复盘队列, no renamed nav entries. Diff LabNav's rendered items before/after —
  they must be identical.
- The practice player iframe (ExamRunner + public/ielts/**) is untouched (ruling C2).
- No "全体平均正确率" column anywhere (ruling C4).
- Wrongbook mechanism (pure derivation) unchanged — restyle only.
- PracticeRecord storage, session keys, postMessage bridge: untouched (Plan §6).

TASKS — work page by page, in this order, verifying each before the next:
1. Shell visual pass: LabChrome, LabNav, components/ielts/ui.tsx primitives restyled
   with the T0 tokens. Naming sweep: every user-visible "雅思实验室" in the Lab becomes
   "IELTS Lab" (aria-labels included).
2. 学习总览 (LabOverview): rebuild the body per master-spec 批次一 minus deferred
   items — resume bar; four core stat tiles (已练习题目 / 平均正确率 / 学习时长 /
   连续学习); the Reading module card with subtitle + factual bullet points per
   supplement §一 (NO cards for Listening/Writing/Speaking until those modules ship —
   no placeholders, no "coming soon"); recent-practice list (≤5, with 回顾 links);
   restyle the T1 target-score card; onboarding banner per supplement §三 — thin-line
   dismissible strip (my style call per the Plan), three steps verbatim 选科目 / 去练习 /
   复盘巩固, dismissal persisted, and the third step must never become score-oriented.
   Keep the wrongbook entrance.
3. 题库列表 (ExamCatalog): row layout per master-spec 批次二 — title (EN + zh
   subtitle) · Part tag · question-type tag · my accuracy (`—` when unpractised, never
   0) · three-state status dot · search placeholder verbatim `搜索题目`. Keep all
   existing filter/count/state logic and session persistence.
4. 套题练习 (SuitePractice): restyle compose → preview → start; mechanism untouched
   (T1 already removed the estimate block).
5. Result transition page (ResultPanel): per reading-player-spec §三 — accuracy, 用时
   verbatim `用时 {MM} 分 {SS} 秒`, per-question result list, buttons 「返回题库」
   (secondary) + 「查看复盘」 (primary, visually stronger when mistakes exist), submit
   confirm verbatim `还有 {N} 题未作答，确定交卷？`. This is STAGE chrome — do not
   touch the iframe.
6. 练习记录 (PracticeHistory + PracticeAnalytics): timeline view grouped by date
   (practice/review/retest event types with distinct icons) + progress line chart
   (Y axis = accuracy %, NEVER a score scale; reuse the existing lazy recharts import).
   Page keeps the name 练习记录.
7. 错题本 (Wrongbook): restyle rows/filters to match; derivation and empty-state
   semantics unchanged (celebratory empty state stays).
8. Remove this stage's guard whitelist entries; npm run guard passes with the Lab
   banned-word scan clean (估算/倒计时/模考/待核验/待公布/雅思实验室).

VERIFY (Plan §4 gates + §5-T3): per-page checklist against the spec sections; LabNav
before/after identical; unpractised shows —/未开始 never 0; verbatim strings diffed;
wrongbook regression (an exam whose latest attempt is clean leaves the list); 375/768/
1280 via read_page (screenshots hang on this machine). All existing lib tests green.

FINISH: commit on main (no push), e.g. "feat(ielts-ui): lab surfaces reskinned to
approved design standard". Report per Plan §4.3. Do not start any other stage.
```

---

## T4 — Reading evidence review upgrade (two-pane)

```
You are executing stage T4 of the STAGE visual replacement program.

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (§2.4, §5-T4, §6, §8; ruling
C3 — 复盘队列 does not exist, so no "加入复盘队列" action). Then
docs/stage-specs/ielts-lab-master-spec.md 批次二's 证据复盘 template (the Reading
variant: left pane = passage with highlighted located sentence, NO timestamps), the
current components/ielts/review/** and lib/ielts/corpus.ts, and
docs/upgrade/02_PAGE_SPECS.md P-09 (state contracts that still apply).

MISSION: upgrade /ielts-lab/review/[recordId] from a table-only review to the two-pane
evidence review, using corpus data STAGE already ships client-side.

TASKS
1. Left pane: render the passage from loadExamData(examId) (passage.blocks html),
   independently scrolling. Loading is LAZY — no corpus script may be fetched until the
   user opens the pane or expands a row (verify in the network log). Failure degrades
   gracefully: the review works exactly as today without the pane.
2. Right pane: the existing per-question result rows. Each wrong question gets a
   「查看证据」 link that scrolls the left pane to the located paragraph and highlights
   it (paragraph-level cue from the explanation data; no timestamps for Reading).
3. Preserve untouched: masked-answer reveal discipline (masked on every mount, reveal
   inserts into DOM, never persisted), AttemptPager, QuestionNavigator, EvidenceJump
   logic, the 在原题中回顾 runner link, record immutability. Bottom actions remain the
   existing ones (重做这篇 / 在原题中回顾 / 返回记录) — do NOT add queue actions.
4. Mobile (<md): panes stack, passage collapsible; no horizontal page scroll.
5. Wrongbook expanded rows keep their current inline behaviour (they link into this
   review; do not duplicate the passage pane there).

VERIFY (Plan §4 gates + §5-T4): lazy-load proven via network requests; evidence jump
scrolls + highlights; masked discipline intact; a record with empty answerComparison
still renders its summary row; records in localStorage byte-identical before/after
(read via javascript_tool). Screenshots hang on this machine — use read_page.

FINISH: commit on main (no push), e.g. "feat(ielts-review): two-pane evidence review
with passage highlighting". Report per Plan §4.3. Do not start any other stage.
```

---

## T5 — Question-type reference page

```
You are executing stage T5 of the STAGE visual replacement program.

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (§2.5, §5-T5, §4, §6, §8);
docs/stage-specs/ielts-lab-supplement-spec.md §二 (the authoritative spec);
lib/ielts/question-types.json, lib/ielts/question-types.ts, lib/ielts/exam-index.json;
the T3-reskinned Lab pages for style reference.

MISSION: build the 题型说明 reference page inside the Lab shell.

TASKS
1. New route app/(ielts)/ielts-lab/(shell)/question-types/page.tsx (inside the EXISTING
   (shell) group — never create a new route group). Page title verbatim `题型说明`.
2. Layout per spec: subject switcher left (only Reading is live — render the other
   subjects as disabled/absent per the no-placeholder rule; choose absent unless the
   switcher looks broken with one item, in which case show Reading only, no switcher).
3. One entry per question type: bilingual name (e.g. `匹配题 Matching`), a plain-
   language "what this asks you to do" description (write these yourself — methodology
   only, NEVER any real exam content or answers), and the REAL count of that type in
   the current corpus computed from the shipped indices.
4. Entry point: a `?` icon next to the 题型 filter group in ExamCatalog linking here
   (aria-label it properly; 36px minimum target).
5. Density/A11y per the Lab standards (one h1, keyboard reachable, no colour-only
   signals).

VERIFY (Plan §4 gates): counts match the corpus indices exactly; no exam content
strings in the descriptions; route table gains exactly this one route; 375 via
read_page clean; npm run guard passes.

FINISH: commit on main (no push), e.g. "feat(ielts): question-type reference page".
Report per Plan §4.3. Do not start any other stage.
```

---

## T6 — Writing module (gated: data approval first)

```
You are executing stage T6 of the STAGE visual replacement program. This stage is
GATED: phase A produces a backend proposal and STOPS for the owner's approval in this
session; phase B implements only after an explicit "approved" from the owner.

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (§2.6, §7 item 1, §4–6, §8);
docs/stage-specs/ielts-lab-writing-spec.md (authoritative UI spec);
docs/stage-specs/ielts-lab-master-spec.md 全局规则; lib/data.ts and lib/directus/** to
match existing Directus access patterns; the T3-reskinned Lab for visual language.

PHASE A — data contract proposal (then STOP)
Write docs/roadmap/T6_WRITING_DATA_PROPOSAL.md covering:
- New Directus collection(s) (e.g. ielts_writing_tasks): fields for task kind (Task 1 /
  Task 2), Task-1 figure classification (数据图/流程图/地图/示意图), English prompt,
  image asset, difficulty (neutral three-step scale, no red), estimated time, task
  count, and a strategy hint (methodology-only — the field's editorial rule: no
  ready-made sentences, paragraphs, or model-answer content for the specific task).
- Optional model-answer field and how the unlock rule consumes it.
- ADDITIVE ONLY: no existing collection/field is modified or deleted.
- Frontend read path (extend lib/data.ts patterns; public DTO field list), image
  hosting, and a validation checklist for content entry.
Post the proposal summary in chat and WAIT. Do not scaffold any schema or write any
application code until the owner replies with approval (they may amend fields).

PHASE B — implementation (only after approval)
1. Task list page + writing interface per ielts-lab-writing-spec.md: category tabs
   (全部/Task 1/Task 2), task card grid (difficulty in neutral tones, strategy hint,
   开始练习), pagination; two-pane writing view with Hide Task toggle, live word count
   (`{当前字数} / {目标字数} words`, neutral when under target — never red), autosave
   (草稿已自动保存, silent), Task 1/Task 2 tabs sharing one session without clearing
   content, 「完成本次练习」 (never "submit for scoring").
2. Model answers (if in the approved schema) unlock ONLY after the user completes
   their own writing via 完成本次练习 — never visible with an empty/zero-word draft.
3. Local draft storage under a new namespaced key (stage.ielts.writing, schemaVersion
   inside the payload) via a lib/ module — no direct localStorage in components.
4. Forbidden (spec §五): Band calculators, AI-teacher entries, ads, countdowns, red
   warnings, scoring/grading of any kind, 待核验/待公布 wording.
5. New routes live inside the existing (shell) group. LabNav/overview gain the Writing
   entry and module card ONLY now that the module is real (no placeholders elsewhere).

VERIFY (Plan §4 gates + §5-T6): manual unlock-path check (empty draft → no model
answer); autosave survives reload; guard passes; route table diff shows only the new
writing routes; 375 via read_page (screenshots hang on this machine).

FINISH (phase B): commit on main (no push), e.g. "feat(ielts-writing): writing module
per approved spec and data contract". Report per Plan §4.3.
```

---

## T7 — Speaking module (gated: question-bank source approval first)

```
You are executing stage T7 of the STAGE visual replacement program. This stage is
GATED: phase A proposes the question-bank source and STOPS for the owner's approval in
this session; phase B implements only after an explicit "approved".

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (§2.6, §7 item 2, §4–6, §8);
docs/stage-specs/ielts-lab-master-spec.md 批次三 (the authoritative five-step spec) and
全局规则; the T3-reskinned Lab for visual language; lib/ielts/history-io.ts for the
export/import precedent.

ABSOLUTE SCOPE FREEZE (standing owner ruling): NO recording, NO microphone, NO
pronunciation analysis, NO AI examiner, NO band prediction, NO scoring, and NO
AI-generate-answer affordance anywhere in this module.

PHASE A — question-bank proposal (then STOP)
Write docs/roadmap/T7_SPEAKING_DATA_PROPOSAL.md comparing the two allowed options and
recommending one: (a) a new Directus collection for Part 1/2/3 question cards, or
(b) a static versioned corpus file shipped with the frontend (mirroring the reading
corpus pattern). Cover: fields (part, topic, EN question text, optional zh gloss),
content sourcing, update workflow, and the read path. All user-generated material
stays local-only in both options. ADDITIVE ONLY. Post the summary in chat and WAIT for
the owner's choice before writing any application code.

PHASE B — implementation (only after approval)
1. Five-step flow per 批次三, persistent horizontal stepper: 题目 → 个人想法 → 答案构建
   → 记忆巩固 → 独立表达.
   - 题目: Part 1/2/3 browsing, pick a question.
   - 个人想法: nine guided dimension cards, bilingual labels verbatim (WHAT 是什么 /
     WHO 谁 / WHEN 何时 / WHERE 何地 / WHY 为何 / MEMORY 记忆 / FEELING 感受 /
     CHANGE_OVER_TIME 变化 / COMPARISON 对比); free-input fragments; filled dimensions
     get a check.
   - 答案构建: left pane = the user's fragments grouped by dimension, draggable/
     insertable into the right-pane draft. Core rule: the draft can ONLY be assembled
     from the user's own fragments — no generate button exists.
   - 记忆巩固: keyword-skeleton rendering (connectives + user's core words kept, rest
     faded), progressive hiding levels for recall practice.
   - 独立表达: question + minimal keyword hints (dismissible), self-check checklist of
     covered dimensions; completing logs an 独立表达 event (no audio, no score).
2. Local storage under stage.ielts.speaking (schemaVersion in payload) via a lib/
   module; full export/import of all Speaking material (JSON round-trip, low-key entry
   in a settings corner), following the history-io precedent.
3. Routes inside the existing (shell) group; LabNav/overview gain the Speaking entry
   and card only now (entry copy per master-spec: 进入素材库 / 继续构建).
4. The 独立表达 completion event appears in the 练习记录 timeline (T3's event stream).

VERIFY (Plan §4 gates + §5-T7): grep the new code for recorder/microphone/score
affordances — none; export→wipe→import round-trip lossless (drive via javascript_tool);
answer-construction pane has no generation affordance; guard passes; route diff only
the new speaking routes; 375 via read_page.

FINISH (phase B): commit on main (no push), e.g. "feat(ielts-speaking): five-step
speaking flow per approved spec". Report per Plan §4.3.
```
