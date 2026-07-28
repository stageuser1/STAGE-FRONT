# T0 — App-family token map

**Stage:** T0 (design foundation) of the STAGE visual replacement program
**Date:** 2026-07-28
**Source of truth:** `design-reference/STAGE IELTS Lab.html` — the approved visual
export. Every "from" column below names the CSS custom property that file defines on
`:root`; values were read out of a live render, not transcribed by eye.
**Binding constraints:** `docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md` §4–§6.

Only App-family tokens changed. The Explore family (`brand.*`, `ink.*`, `line`,
`line-subtle`, `page`) was not touched, and no file under `app/(explore)/`,
`components/explore/`, `components/school/` or `components/program/` contains a
`stage-*` reference, so nothing here can reach the Explore surface.

---

## 1. What the export's visual language actually is

Read off the rendered export rather than assumed from the palette:

| Observation | Evidence |
|---|---|
| The Lab surface is **light**, not dark | `--surface-page: #FFFFFF`; the inverse tokens (`--surface-inverse`, `--text-inverse`, `--border-inverse`) are defined but referenced **0 times** by the export's own screens. The dark frame in the file's placeholder thumbnail is not the design. |
| It is **flat — zero shadows** | A census of every element in the rendered app returned **no** element with a `box-shadow`. `--shadow-md` appears twice in 778 KB of screen code; `--shadow-sm/lg/xl` never. |
| Structure comes from **hairline borders** | `--border-hairline` (#E4E7EE) is referenced 108 times — the single most-used non-text token. Cards are `#FFF` + `1px #E4E7EE` + `16px` radius + no shadow. |
| Text is a **four-step ramp** | `--text-subtle` (138) › `--text-muted` (78) › `--text-strong` (74) › `--text-body` (64). |
| The primary action is **deep navy blue**, not the mid blue | `--action-primary` = `--blue-700` = `#133A94`, referenced 44 times. `--blue-500` is referenced twice. |
| Radii in use | `8px` controls, `999px` pills, `16px` cards, `12px` inline panels, `4px` micro-labels. |
| Density | body copy at 13px and 15px, section titles 20px, page title 32px, big figures ~31px; line-height 1.72 on body. |

Two things in the export were deliberately **not** adopted:

1. **Its left-sidebar navigation IA** — ruling C3+C6 keeps the existing `(shell)` top
   navigation. Only the visual language was harvested.
2. **Its fonts** — the export sets Plus Jakarta Sans (latin) and IBM Plex Mono
   (figures). T0 forbids new fonts, so `font-stage-sans` (Noto Sans SC) and
   `font-stage-mono` (Geist Mono) stay. The only thing taken from the export's font
   stacks is its CJK **fallback chain** (PingFang SC / Source Han Sans SC / Microsoft
   YaHei), which are system faces and download nothing.

---

## 2. Colour — raw ramps

### 2.1 Blue

The export runs one continuous blue ramp from a near-white tint to a near-black navy;
the old config split the same range into `blue-*` plus a separate `navy-*` family.

| Token | Old | New | From |
|---|---|---|---|
| `--stage-blue-25` | *(new)* | `#f7fafe` | `--blue-25` |
| `--stage-blue-50` | `#eff6ff` | `#eff4fe` | `--blue-50` |
| `--stage-blue-100` | `#dbeafe` | `#dce8fb` | `--blue-100` |
| `--stage-blue-200` | `#bfdbfe` | `#c2d6f8` | `--blue-200` |
| `--stage-blue-300` | *(new)* | `#8fb2f0` | `--blue-300` |
| `--stage-blue-400` | `#60a5fa` | `#5c90ec` | `--blue-400` |
| `--stage-blue-500` | `#3b82f6` | `#2f6be0` | `--blue-500` |
| `--stage-blue-600` | `#2563eb` | `#1e4fc4` | `--blue-600` |
| `--stage-blue-700` | *(new)* | `#133a94` | `--blue-700` — the primary action colour |
| `--stage-blue-800` | *(new)* | `#0e2c6e` | `--blue-800` |
| `--stage-blue-900` | *(new)* | `#0a1f4d` | `--blue-900` |
| `--stage-blue-950` | *(new)* | `#04122e` | `--blue-950` — strong text / inverse surface |

### 2.2 Neutrals

New ramp. The old App family had no neutral scale at all (only `--stage-white` and
`--stage-mist`), which is why every surface, border and secondary-text step had to be
expressed as a translucent navy. The export uses a slightly cool grey ramp instead.

| Token | Old | New | From |
|---|---|---|---|
| `--stage-neutral-0` | *(new)* | `#ffffff` | `--n-0` |
| `--stage-neutral-25` | *(new)* | `#fbfbfd` | `--n-25` |
| `--stage-neutral-50` | *(new)* | `#f6f7fa` | `--n-50` — sunken surface |
| `--stage-neutral-100` | *(new)* | `#eff1f5` | `--n-100` — progress track |
| `--stage-neutral-200` | *(new)* | `#e4e7ee` | `--n-200` — hairline border |
| `--stage-neutral-300` | *(new)* | `#d2d7e1` | `--n-300` — control border |
| `--stage-neutral-400` | *(new)* | `#aeb5c4` | `--n-400` |
| `--stage-neutral-500` | *(new)* | `#868e9f` | `--n-500` — subtle text |
| `--stage-neutral-600` | *(new)* | `#5f6779` | `--n-600` — muted text |
| `--stage-neutral-700` | *(new)* | `#414957` | `--n-700` |
| `--stage-neutral-800` | *(new)* | `#2a303b` | `--n-800` — body text |
| `--stage-neutral-900` | *(new)* | `#171c25` | `--n-900` |

### 2.3 Status ramps

All new. Previously the App family carried two flat status values with no soft
background, so chips had to borrow Tailwind's `emerald-50`/`amber-50` defaults.

| Token | Old | New | From |
|---|---|---|---|
| `--stage-green-50` | *(new)* | `#ecf8f3` | `--green-50` / `--verified-bg` |
| `--stage-green-100` | *(new)* | `#d7f0e5` | `--green-100` / `--verified-border` |
| `--stage-green-500` | *(new)* | `#1fa377` | `--green-500` |
| `--stage-green-600` | *(new)* | `#12855f` | `--green-600` |
| `--stage-green-700` | *(new)* | `#0c6b4c` | `--green-700` / `--verified-fg` |
| `--stage-gold-50` | *(new)* | `#fdf6e8` | `--gold-50` |
| `--stage-gold-200` | *(new)* | `#fae6bf` | `--gold-200` |
| `--stage-gold-500` | *(new)* | `#f4c870` | `--gold-500` |
| `--stage-gold-600` | *(new)* | `#d9a03c` | `--gold-600` |
| `--stage-gold-700` | *(new)* | `#b47c1e` | `--gold-700` / `--text-accent` |
| `--stage-amber-50` | *(new)* | `#fdf3e3` | `--amber-50` |
| `--stage-amber-600` | *(new)* | `#b4700c` | `--amber-600` |
| `--stage-red-50` | *(new)* | `#fceeec` | `--red-50` |
| `--stage-red-600` | *(new)* | `#c0392f` | `--red-600` |

### 2.4 Legacy ramp names

Kept so shipped markup does not have to churn in T0; each is now an alias onto the
export's ramp. T2/T3 may retire them as they rewrite the surfaces that use them.

| Token | Old | New | From |
|---|---|---|---|
| `--stage-navy-700` | `#1d2e5e` | `var(--stage-blue-700)` → `#133a94` | `--blue-700` |
| `--stage-navy-800` | `#16234a` | `var(--stage-blue-800)` → `#0e2c6e` | `--blue-800` |
| `--stage-navy-900` | `#0e1633` | `var(--stage-blue-950)` → `#04122e` | `--blue-950` |
| `--stage-sky-300` | `#a5c8ff` | `var(--stage-blue-300)` → `#8fb2f0` | `--blue-300` |
| `--stage-sky-100` | `#e4eeff` | `var(--stage-blue-100)` → `#dce8fb` | `--blue-100` |
| `--stage-white` | `#ffffff` | `var(--stage-neutral-0)` → `#ffffff` | `--n-0` (value unchanged) |
| `--stage-mist` | `#f7faff` | `var(--stage-blue-25)` → `#f7fafe` | `--surface-tint` |

---

## 3. Colour — semantic aliases

| Token | Old | New | From |
|---|---|---|---|
| `--stage-bg` | `#ffffff` | `#ffffff` (`neutral-0`) | `--surface-page` — **unchanged** |
| `--stage-bg-soft` | `#f7faff` (mist) | `#f6f7fa` (`neutral-50`) | `--surface-sunken` |
| `--stage-bg-tint` | *(new)* | `#f7fafe` (`blue-25`) | `--surface-tint` |
| `--stage-surface-dark` | `#16234a` (navy-800) | `#04122e` (`blue-950`) | `--surface-inverse` |
| `--stage-fg` | `#0e1633` | `#04122e` (`blue-950`) | `--text-strong` |
| `--stage-fg-body` | *(new)* | `#2a303b` (`neutral-800`) | `--text-body` |
| `--stage-fg-muted` | `rgba(29,46,94,.72)` | `#5f6779` (`neutral-600`) | `--text-muted` |
| `--stage-fg-subtle` | *(new)* | `#868e9f` (`neutral-500`) | `--text-subtle` |
| `--stage-fg-on-dark` | `#ffffff` | `#ffffff` | `--text-inverse` — **unchanged** |
| `--stage-fg-on-dark-muted` | `rgba(255,255,255,.68)` | *(same)* | **unchanged** — the export has no inverse-muted text token |
| `--stage-primary` | `#3b82f6` (blue-500) | `#133a94` (`blue-700`) | `--action-primary` |
| `--stage-primary-hover` | `#2563eb` (blue-600) | `#0e2c6e` (`blue-800`) | `--action-primary-hover` |
| `--stage-primary-press` | *(new)* | `#0a1f4d` (`blue-900`) | `--action-primary-press` |
| `--stage-primary-soft` | *(new)* | `#eff4fe` (`blue-50`) | `--surface-accent-soft` |
| `--stage-border` | `rgba(14,22,51,.08)` | `#e4e7ee` (`neutral-200`) | `--border-hairline` |
| `--stage-border-strong` | *(new)* | `#d2d7e1` (`neutral-300`) | `--border-default` — the export's control border |
| `--stage-border-accent` | *(new)* | `#c2d6f8` (`blue-200`) | `--border-accent` |
| `--stage-success` | `#10b981` | `#12855f` (`green-600`) | `--green-600` |
| `--stage-success-soft` | *(new)* | `#ecf8f3` (`green-50`) | `--verified-bg` |
| `--stage-warning` | `#f59e0b` | `#b4700c` (`amber-600`) | `--amber-600` |
| `--stage-warning-soft` | *(new)* | `#fdf3e3` (`amber-50`) | `--amber-50` |
| `--stage-danger` | *(new)* | `#c0392f` (`red-600`) | `--red-600` |
| `--stage-danger-soft` | *(new)* | `#fceeec` (`red-50`) | `--red-50` |
| `--stage-accent` | *(new)* | `#b47c1e` (`gold-700`) | `--text-accent` |
| `--stage-accent-soft` | *(new)* | `#fdf6e8` (`gold-50`) | `--gold-50` |
| `--stage-focus` | *(new)* | `#5c90ec` (`blue-400`) | `--focus-ring` |
| `--stage-focus-ring` | *(new)* | `0 0 0 3px rgba(92,144,236,.38)` | `--ring-focus` |

> `--stage-success` and `--stage-warning` are rendered as **text** on white by
> `ResultPanel` (`text-stage-success` / `text-stage-warning`). The old `#10b981` and
> `#f59e0b` were both below 3:1 there; the export's `#12855f` and `#b4700c` are the
> values it uses for exactly that purpose.
>
> The scoped focus rule in `globals.css` (`.font-stage-sans a:focus-visible`, …) now
> outlines with `--stage-focus` instead of `--stage-primary`, because the primary
> moved to a deep navy that reads poorly as a ring against dark chrome.

---

## 4. Radius

| Token | Old | New | From |
|---|---|---|---|
| `--stage-radius-xs` | *(new)* | `4px` | `--radius-xs` |
| `--stage-radius-sm` | `8px` | `8px` | `--radius-sm` — **unchanged** |
| `--stage-radius-md` | `12px` | `12px` | `--radius-md` — **unchanged** |
| `--stage-radius-lg` | `20px` | `16px` | `--radius-lg` — the export's card radius |
| `--stage-radius-xl` | `28px` | `24px` | `--radius-xl` |
| `--stage-radius-pill` | *(new)* | `999px` | `--radius-pill` |

Tailwind gains `rounded-stage-xs` and `rounded-stage-pill`.

## 5. Shadow

The export's product surface uses **none** of these; they exist for lifted chrome
(dialogs, toasts, popovers) only. Card elevation is now the hairline border.

| Token | Old | New | From |
|---|---|---|---|
| `--stage-shadow-xs` | *(new)* | `0 1px 2px rgba(10,31,77,.05)` | `--shadow-xs` |
| `--stage-shadow-sm` | `0 1px 2px rgba(14,22,51,.06)` | `0 1px 3px rgba(10,31,77,.06), 0 1px 2px rgba(10,31,77,.04)` | `--shadow-sm` |
| `--stage-shadow-md` | `0 12px 32px -12px rgba(14,22,51,.14)` | `0 4px 16px rgba(10,31,77,.07)` | `--shadow-md` |
| `--stage-shadow-lg` | *(new)* | `0 12px 40px rgba(10,31,77,.1)` | `--shadow-lg` |
| `--stage-glow-card` | `0 0 80px -20px rgba(96,165,250,.35)` | `0 0 80px -20px rgba(92,144,236,.35)` | no export equivalent — kept as marketing decoration, recoloured to the new `blue-400` |

## 6. Gradient

| Token | Old | New | From |
|---|---|---|---|
| `--stage-gradient-cta` | `linear-gradient(135deg, navy-900, navy-800)` | same expression, now `#04122e → #0e2c6e` | follows the ramp |
| `--stage-gradient-text` | `linear-gradient(90deg, blue-500, blue-400)` | same expression, now `#2f6be0 → #5c90ec` | follows the ramp |
| `--stage-ambient-sky` | *(new)* | `linear-gradient(180deg,#fff 0%,#f3f7fe 38%,#e3ecfa 72%,#d8e5f7 100%)` | `--ambient-sky` |

## 7. Type scale

New `stage-*` `fontSize` keys carrying the export's steps. The pre-existing marketing
keys (`display`, `h2`, `h3`, `body`, `caption`, `stat`, …) are **unchanged** and still
marketing-only.

| Tailwind key | Value | Line-height / tracking | From |
|---|---|---|---|
| `text-stage-2xs` | `0.6875rem` (11px) | 1.72 | `--fs-2xs` |
| `text-stage-xs` | `0.8125rem` (13px) | 1.72 | `--fs-xs` — the Lab's workhorse size |
| `text-stage-sm` | `0.9375rem` (15px) | 1.72 | `--fs-sm` |
| `text-stage-body` | `1.0625rem` (17px) | 1.72 | `--fs-body` / `--lh-body` |
| `text-stage-lead` | `1.1875rem` (19px) | 1.5 | `--fs-lead` / `--lh-snug` |
| `text-stage-h4` | `1.25rem` (20px) | 1.22 / −0.018em | `--fs-h4` / `--lh-heading` / `--ls-heading` |
| `text-stage-h3` | `1.5rem` | 1.22 / −0.018em | `--fs-h3` |
| `text-stage-h2` | `2rem` | 1.22 / −0.018em | `--fs-h2` — the export's page title |
| `text-stage-h1` | `2.5rem` | 1.22 / −0.018em | `--fs-h1` |
| `text-stage-d2` | `clamp(2rem,4vw,3.5rem)` | 1.08 / −0.03em | `--fs-d2` / `--lh-display` / `--ls-display` |
| `text-stage-d1` | `clamp(2.25rem,5vw,4.5rem)` | 1.08 / −0.03em | `--fs-d1` |
| `text-stage-hero` | `clamp(2.75rem,7.2vw,6rem)` | 1.02 / −0.045em | `--fs-hero` / `--lh-tight` / `--ls-mega` |

Plus `tracking-stage-eyebrow` (`0.16em`, from `--ls-eyebrow`) and
`tracking-stage-wordmark` (`0.34em`, from `--ls-wordmark`, the STAGE wordmark).

> This supersedes `docs/upgrade/01_DESIGN_SYSTEM.md` §3 ("never introduce a new
> fontSize key for product surfaces") on the visual layer, per Plan §0.4: the export is
> the new authority and its steps (11/13/15/17px) have no equivalent in Tailwind's
> default 12/14/16px ladder.

## 8. Rhythm and measure

| Token / key | Value | From |
|---|---|---|
| `--stage-gutter` → `p-stage-gutter` | `clamp(20px,5vw,64px)` | `--gutter` |
| `--stage-section-y` → `py-stage-section` | `clamp(72px,11vw,160px)` | `--section-y` |
| `--stage-section-y-tight` → `py-stage-section-tight` | `clamp(48px,7vw,96px)` | `--section-y-tight` |
| `max-w-stage` | `1200px` | `--container` — **unchanged**, already matched |
| `max-w-stage-narrow` | `760px` | `--container-narrow` |
| `max-w-stage-measure` | `68ch` | `--measure` |
| `max-w-stage-measure-lead` | `38ch` | `--measure-lead` |

**Spacing scale: unchanged.** The export's `--sp-1 … --sp-40` is a 4px scale
(4/8/12/16/20/24/32/40/48/64/80/96/128/160px) that is identical to Tailwind's default
`1/2/3/4/5/6/8/10/12/16/20/24/32/40`. No token was added.

## 9. Motion

| Token / key | Value | From |
|---|---|---|
| `--stage-dur-fast` → `duration-stage-fast` | `120ms` | `--dur-fast` |
| `--stage-dur-base` → `duration-stage-base` | `200ms` | `--dur-base` |
| `--stage-dur-slow` → `duration-stage-slow` | `360ms` | `--dur-slow` |
| `--stage-dur-reveal` → `duration-stage-reveal` | `600ms` | `--dur-reveal` |
| `--stage-ease-standard` → `ease-stage-standard` | `cubic-bezier(.4,0,.2,1)` | `--ease-standard` |
| `--stage-ease-out` → `ease-stage-out` | `cubic-bezier(.16,1,.3,1)` | `--ease-out` |

All within the existing `prefers-reduced-motion` guard in `globals.css`; no new
keyframes were added.

---

## 10. Deliberately left alone

| Thing | Why |
|---|---|
| `brand.*`, `ink.*`, `line`, `line-subtle`, `page` | Explore family. Out of scope, and no Explore file references a `stage-*` token. |
| `fontSize` keys `display`/`h2`/`h3`/`body-lg`/`body`/`caption`/`stat` | Not `stage-*`-named, and rewriting them would repaint the current homepage before T2 replaces it. |
| `--marketing-card-*`, `.stage-card`, `.stage-card-interactive` | Component classes, not tokens. The export's card is borderless-shadow → hairline-border; converting `.stage-card` is T2's job when it rewrites the marketing surface. |
| `.stage-hero` / `--hero-*` tunables | Hero atmosphere internals, owned by T2. `--stage-ambient-sky` is parked as a token for that work. |
| `font-stage-sans` / `font-stage-mono` families | No new fonts (T0 constraint). Only the CJK system-font fallbacks were added. |
| `lib/ui/surface.ts` app map | Its class names (`bg-stage-bg-soft`, `border-stage-border`, …) are unchanged and now resolve to the new values automatically. |

## 11. Knock-on effects to expect

These are intended, and land on App-family surfaces only:

1. Primary buttons and accents move from a mid blue to a deep navy blue.
2. Muted body copy moves from a translucent navy to a neutral grey.
3. Borders become an opaque hairline instead of an 8%-navy wash — very slightly
   cooler and more definite.
4. `rounded-stage-lg` / `rounded-stage-xl` tighten by 4px each.
5. `shadow-stage-md` becomes markedly shallower (the export is a flat surface).
