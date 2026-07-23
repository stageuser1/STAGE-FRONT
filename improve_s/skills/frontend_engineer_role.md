# Role: Senior Frontend / Full-Stack Engineer

## Domain

Next.js 15 App Router, React 19, Server/Client boundaries, ISR and caching,
React performance, bundle composition.

---

## Repository-specific context (verified — do not re-derive)

- **The app already uses Server Components correctly.** There is no `useEffect`
  data fetching anywhere. Any plan proposing to "move fetching to Server
  Components" is wrong for this repo.
- Only `/login` (`app/login/page.tsx:1`) and `app/error.tsx` are client pages.
- **Reviewer auth is entirely client-side** — `localStorage` tokens,
  browser→Directus calls (`lib/directus-auth.tsx`). No server session forces
  dynamic rendering, so public pages are already safe to cache.
- `AuthProvider` wraps the whole tree at `app/layout.tsx:21`, but children
  passed through a Client Component remain Server Components — this does not
  force client rendering downstream.
- All six public/pilot routes declare `force-dynamic`. None is justified.
- Client components currently shipped to anonymous visitors include
  `ProgramDetailSections` (887 lines) and `ReviewerEditableCard` (433 lines).

---

## Responsibilities

### Rendering and caching
- Remove unjustified `force-dynamic`, `cache: "no-store"`, `revalidate: 0`.
- Apply explicit cache policy per route based on real content-change frequency.
- **Server Components do not imply ISR.** State the intended rendering mode for
  every route and verify it in the build output — do not assume.
- `generateStaticParams` for the ~**1,958** detail pages (20 schools,
  1,938 programs — live counts as of 2026-07-23). Build duration over the slow
  Directus link is a real risk at this page count; the documented fallback is
  schools-only static params with `dynamicParams` handling programs on demand.
- Do not force every route into one model. `/search` reads `searchParams` and
  is legitimately dynamic — it should render dynamically over *cached data*.

### Data access boundaries
- `loadDirectusData()` (`lib/data.ts:980`) pulls five collections with
  `limit=-1` and filters in memory. Introduce per-entity queries **alongside**
  it so routes can migrate one at a time, rather than replacing it in one step.
- `getProgramById` (`lib/data.ts:1366`) loads the entire database to return one
  program. `searchPrograms` (`lib/data.ts:1382`) filters the full dataset in JS.

### Client boundaries
- Keep only genuinely interactive components client-side.
- Gate reviewer components behind the auth check / dynamic import so anonymous
  visitors do not download the editor bundles.
- Do not pass full CMS-derived records to Client Components — use public DTOs.

### Preserve behavior
- All visible functionality, routes, and links unchanged.

---

## Known issues to handle carefully

| Issue | Location | Note |
|---|---|---|
| `filter[id][_in]=` built from an unbounded id list | `lib/data.ts:827` | Can exceed practical URL length on a school with many sources |
| "Not found" returns **HTTP 200** with an `EmptyState` | `app/schools/[schoolId]/page.tsx:31` | No `notFound()` call, no `app/not-found.tsx`. Correcting this is a real fix — QA must not flag it as a regression |
| Optimistic `audition_requirements` query with catch-and-retry | `lib/data.ts:947` | Doubles round trips whenever Directus 403s on the two columns that do not exist yet |

---

## Standing constraints

- No visible design or functional change.
- No route renames.
- Small batches — the shared loader means one file change reaches every route.
- Bundle expectations are low: production dependencies are only `next`, `react`,
  `react-dom`. Icons are hand-rolled SVG (`components/ui/Icon.tsx`); markdown is
  hand-rolled (`lib/markdown.tsx`). **There is no icon or utility library to trim.**
