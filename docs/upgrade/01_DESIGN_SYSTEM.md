# 01 — Design system

How the existing tokens are used by the new surfaces. Nothing here adds a token family,
a plugin, or a dependency. Every value below already exists in `tailwind.config.ts` or
`app/globals.css`.

---

## 1. The two families, and the rule that keeps them apart

| | Explore family | App family |
|---|---|---|
| Colour tokens | `brand.{50,100,300,500,600,700,800}` `ink.{50,100,300,400,500,700,900}` `line` `line-subtle` `page` | `stage-*` CSS variables (`--stage-fg`, `--stage-bg`, `--stage-primary`, `--stage-border`, …) |
| Font | system stack (`font-sans`: Inter → PingFang SC → Noto Sans SC) | `font-stage-sans` (Noto Sans SC via `--font-noto-sans-sc`) |
| Radius | Tailwind `rounded-lg/xl/2xl` (8/12/16px) | `rounded-stage-sm/md/lg/xl` (8/12/20/28px) |
| Shadow | `shadow-card`, `shadow-raised` | `shadow-stage-sm/md`, `.stage-card` |
| Route groups | `(explore)` | `(marketing)` `(ielts)` `(product)` |

**Rule 1 — the route group decides.** A component's palette is the palette of the group
it renders in. No page mixes families.

**Rule 2 — status colour is family-neutral.** Both families already use the same
Tailwind defaults for state. These are the *only* colours allowed to cross:

| Meaning | Background | Foreground | Used by |
|---|---|---|---|
| positive / satisfied / verified | `emerald-50` | `emerald-700` | StatusBadge, ielts Badge, C-03, C-06 |
| caution / gap / awaiting | `amber-50` | `amber-700` | StatusBadge, DeadlineChip, C-03 |
| urgent / wrong / overdue | `red-50` | `red-600` | DeadlineChip, C-14 |
| neutral / unstarted / unknown | `ink-100` + `ink-500` *(explore)* · `stage-bg-soft` + `stage-fg-muted` *(app)* | — | C-06, C-19 |
| demo fixture | `violet-50` + dashed `violet-300` | `violet-700` | `PlaceholderBadge` — **never** for real data |

**Rule 3 — cross-family components take one prop.** Six components render in both
(`StatusChip`, `ConfidenceBadge`, `BandGapMeter`, `RequirementRow`, `DeadlineTimeline`,
`MatchReasonTag`). They accept `surface?: "explore" | "app"` (default `"explore"`) and
read their neutral classes from a single map:

```ts
// lib/ui/surface.ts — class maps only, no components, no runtime logic.
export type Surface = "explore" | "app";

export const surfaceTokens = {
  explore: {
    card:    "rounded-xl border border-line bg-white shadow-card",
    inset:   "rounded-lg bg-ink-50",
    border:  "border-line",
    divider: "border-line-subtle",
    fg:      "text-ink-900",
    muted:   "text-ink-500",
    faint:   "text-ink-400",
    neutral: "bg-ink-100 text-ink-500",
    accent:  "text-brand-600",
    accentBg:"bg-brand-50 text-brand-700",
    focus:   "focus-visible:outline-brand-600",
  },
  app: {
    card:    "rounded-stage-md border border-stage-border bg-stage-bg",
    inset:   "rounded-stage-sm bg-stage-bg-soft",
    border:  "border-stage-border",
    divider: "border-stage-border",
    fg:      "text-stage-fg",
    muted:   "text-stage-fg-muted",
    faint:   "text-stage-fg-muted",
    neutral: "bg-stage-bg-soft text-stage-fg-muted",
    accent:  "text-stage-primary",
    accentBg:"bg-stage-primary/10 text-stage-primary",
    focus:   "focus-visible:outline-stage-primary",
  },
} as const satisfies Record<Surface, Record<string, string>>;
```

Class strings must be **complete literals** (Tailwind's scanner cannot see
`bg-${x}-50`). Never interpolate a token name.

**Rule 4 — accent discipline.** Primary actions are near-black or the family's dark
surface; the brand accent is reserved for active/selected/brand moments.

| Role | Explore | App |
|---|---|---|
| Primary button | `bg-ink-900 text-white hover:bg-ink-700` | `bg-stage-primary text-stage-fg-on-dark hover:bg-stage-primary-hover` |
| Secondary button | `border border-line bg-white text-ink-700 hover:border-brand-300` | `border border-stage-border hover:border-stage-primary` |
| Selected chip | `bg-brand-600 text-white` | `bg-stage-primary text-white` |
| Destructive | text-only `text-red-600 hover:underline` — never a filled red button | same |

> The existing Explore buttons use `bg-brand-600` (see `EmptyState`, `search/page.tsx`).
> **Do not retro-fit them.** New primary CTAs on new surfaces use `ink-900`; the accent
> discipline arrives by addition, not by a repaint of shipped pages.

---

## 2. Density variants

One type and colour system, two spacing ladders. The variant is a property of the
*surface*, not of the component, and it is expressed only through padding, row height,
gap and type step — never through different colours or radii.

| | **E — editorial** | **A — assessment** |
|---|---|---|
| Where | Explore, School, Program, Dashboard, Profile, Match, Lab overview/browse | Review page, wrongbook rows, result table, suite result, question navigator |
| Card padding | `p-4 md:p-5` | `p-3 md:p-4` |
| Row height | `min-h-12` (48px, `FactRow`) | `min-h-9` (36px) |
| Vertical rhythm between cards | `space-y-4 md:space-y-5` | `space-y-2 md:space-y-3` |
| Inline gap | `gap-3` | `gap-2` |
| Body text | `text-sm` (14px) / `text-base` (16px) titles | `text-xs` (12px) / `text-sm` (14px) titles |
| Numerals | `tabular-nums` on stats | `tabular-nums` **everywhere** |
| Truncation | wrap, `[overflow-wrap:anywhere]` | single line `truncate`, full text in `title=` |
| Touch target | 44px | 36px minimum, 44px on primary actions |

Rule: a surface picks one ladder and keeps it. The lab **overview** is E (it is a
dashboard); the lab **review** is A (it is a worksheet). Mixed cards on one page are the
failure mode this table exists to prevent.

---

## 3. Type scale as used

Existing `fontSize` tokens (`display`, `h2`, `h3`, `body-lg`, `body`, `caption`, `stat`)
are **marketing-only** and stay that way. Product surfaces use the plain Tailwind steps
the Explore surface already uses:

| Role | Class | Notes |
|---|---|---|
| Page title | `text-xl md:text-2xl font-semibold leading-7` | one `<h1>` per page |
| Section title | `text-base font-semibold leading-6` | `SectionCard` header |
| Section subtitle (EN) | `text-xs text-ink-400` / `text-stage-fg-muted` | e.g. `申请材料 Application Requirements` |
| Body | `text-sm leading-5` | |
| Secondary / meta | `text-xs leading-4` | |
| Big stat | `text-2xl font-semibold tabular-nums` (A) · `text-[25px] md:text-[34px]` (E hero) | |
| Micro label | `text-[11px] leading-4` | only inside `KeyFact` hints |

Never introduce a new `fontSize` key for product surfaces.

---

## 4. State styling standards

### 4.1 Three-state progress chip (C-06)

Non-colour signals are mandatory: every state carries a distinct **dot shape** and a
**text label**. Colour alone never encodes state.

| State | Label | Dot | Explore classes | App classes |
|---|---|---|---|---|
| `unstarted` | 未开始 | hollow ring `border border-current` | `bg-ink-100 text-ink-500` | `bg-stage-bg-soft text-stage-fg-muted` |
| `pending` | 进行中 | half-filled (`bg-current` + `opacity-50`) | `bg-amber-50 text-amber-700` | same |
| `completed` | 已完成 | solid | `bg-emerald-50 text-emerald-700` | same |
| `completed_with_errors` | 有错题 | solid + ring | `bg-amber-50 text-amber-700` | same |

Geometry: `inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 text-xs font-medium`
— identical to the shipped `StatusBadge`/`DeadlineChip` chip geometry, so chips of both
vocabularies align on the same row.

### 4.2 Requirement state (C-03)

| State | Label | Icon | Tone |
|---|---|---|---|
| `satisfied` | 已满足 | `check` | emerald |
| `gap` | 有差距 | `alert` | amber |
| `unknown` | 待确认 | `clock` | neutral |
| `not_required` | 不需要 | `close` | neutral, `opacity-70` |

`unknown` is **never** rendered as a failure. "We have not verified this" and "you do not
meet this" are different sentences and must never share a colour.

### 4.3 Confidence + freshness (C-19)

Rendered as one inline unit, right-aligned in a section header or requirement row:

```
● 已核验 · 核验于 2026-03-11        (emerald dot)
● 待核验 · 核验于 2025-11-02        (amber dot)
○ 暂未收录                          (hollow, ink-400)
```

- Freshness label: `核验于 {formatDateZh(last_checked_at)}`. If older than 180 days,
  append `（可能已更新）` in `amber-700` — a stale fact is flagged, never hidden.
- Confidence level rendering is gated on **OQ-1**; until resolved, only workflow status
  and the date render.
- Tooltip (`title=` + `aria-describedby`): source title + accessed date.

### 4.4 The five page states

Every page spec in `02_PAGE_SPECS.md` must define all five. Standard treatments:

| State | Treatment |
|---|---|
| **loading** | `SkeletonCards` (existing) matching the real card geometry. Client-only data (localStorage) renders a skeleton on first paint, never `0` — `records === null` means loading, `records.length === 0` means empty. This distinction already exists in `PracticeHistory` and is mandatory for every new local-first surface. |
| **empty** | `EmptyState` (explore) / `EmptyNote` (app), with an action that resolves it. Wrongbook's empty state **celebrates** ("这些条件下没有错题"), it does not apologise. |
| **anonymous / no-profile** | The surface renders in full with the personal column present but blank, plus one inline CTA to build a profile. **Discovery is never gated.** Copy pattern: `建立档案后这里会显示你与该项目的差距`. |
| **error** | Inline, in place, with the failed scope named and a retry. Never a whole-page replacement for a partial failure. Never `alert()` / `confirm()` for new surfaces (existing `window.confirm` calls in `SuitePractice`/`PracticeHistory` are grandfathered; new destructive flows use an inline confirm row). |
| **stale / low-confidence** | The value renders with the freshness label attached (§4.3), never suppressed. |

---

## 5. Iconography

`components/ui/Icon.tsx` only: 24×24 viewBox, `fill="none"`, `stroke="currentColor"`,
`strokeWidth={2}`, round caps/joins, `aria-hidden`. No icon package.

Additions for this upgrade — same grammar, added to `IconName`:

| Name | Use | Path sketch |
|---|---|---|
| `flag` | wrongbook / marked question | pole + pennant |
| `target` | goal band, readiness | two concentric circles + centre dot |
| `trend` | analytics, sparkline header | polyline up + arrow head |
| `list-checks` | requirement checklist | three lines each with a leading tick |

Icons are decorative by default. When an icon is the *only* content of a control, the
control carries `aria-label`.

---

## 6. Motion budget (Phase 1: CSS only)

| Allowed | Value |
|---|---|
| Colour / border / shadow transitions | `transition-colors`, `transition` (150–300ms) |
| Disclosure open/close | native `<details>`; chevron `transition-transform group-open:rotate-180` |
| Progress / meter fill | `transition-[width]` 300ms `cubic-bezier(.22,1,.36,1)` |
| Skeleton | `animate-pulse` |
| Entrance | **none** on product surfaces. The `stage-animate-*` keyframes stay marketing-only. |

Hard limits: transform/opacity only, ≤ 12px travel, ≤ 400ms, never on a list of results,
never blocking interaction. Everything is inside the existing
`@media (prefers-reduced-motion: reduce)` guard in `globals.css`; new animation classes
must be added to that guard's selector list in the same commit.

---

## 7. Accessibility standards

1. **Keyboard.** Every interactive element is a real `<button>`/`<a>`/`<input>`. Filter
   chips are `<button aria-pressed>` when they mutate client state (lab pattern) and
   `<a>` when they change the URL (explore pattern) — never a `<div onClick>`.
2. **Focus.** Visible ring everywhere: `focus-visible:outline-2 focus-visible:outline-offset-2`
   with the family accent. The marketing surface's scoped ring rule (`.font-stage-sans a:focus-visible`)
   already covers `(marketing)/(ielts)/(product)`; the Explore surface needs the same
   rule added for the new components — scope it to the new containers, do not make it global.
3. **Dialogs.** Native `<dialog showModal>` (C-10, destructive confirms): browser-provided
   focus trap and `Esc`, restore focus to the invoker on close. No focus-trap dependency.
4. **Disclosure.** Prefer `<details>/<summary>` — free keyboard semantics, works without
   JS, and it is what `ExpandableSection`/`EvidenceAccordion` already do.
5. **Status never colour-only** (§4.1): dot shape + text label always accompany tone.
6. **Live regions.** Result counts announce via `aria-live="polite"` on the count line
   (`匹配 N 篇`), not on the list itself.
7. **Reveal controls** (C-14) are `aria-expanded` toggles; a revealed answer is inserted
   into the DOM, not merely un-blurred, so screen readers do not read hidden answers.
8. **Reduced motion** honoured by §6.
9. **Targets:** 44×44 minimum on E-density and on every primary action; 36×36 floor on
   A-density grids (question navigator cells), which is the blueprint's stated minimum.
10. **Landmarks:** one `<h1>` per page; `<nav aria-label>` on every nav; skip-to-content
    is inherited from the layout and must not be broken by new sticky headers.

---

## 8. Responsive contract

Breakpoints in use: `375` (baseline), `md: 768`, `lg: 1024`, `1280` (max content width).

| Rule | Detail |
|---|---|
| Secondary panes **stack, never disappear** | The program page's `lg:grid-cols-[minmax(0,1fr)_320px]` becomes one column below `lg`; the Fit Panel moves **above** the detail sections on narrow screens (it is the decision, so it leads). |
| Sticky elements | At most one sticky region per viewport. The program page's `lg:sticky lg:top-20` right column is desktop-only; on mobile nothing sticks except the existing search bar on `/search`. |
| Horizontal scroll | Only for chip rows and the question navigator, always with `.no-scrollbar` and always keyboard-scrollable. The page body never scrolls horizontally. |
| Bottom nav clearance | Explore pages keep `pb-24` (`PageShell`) so `MobileBottomNav` never covers content; `.pb-safe` handles notched devices. |
| Tables | A-density tables become stacked rows below `md` — never a horizontally scrolling table of answers. |
| Test matrix | 375 / 768 / 1280 for every new page, plus 320 for the question navigator. |
