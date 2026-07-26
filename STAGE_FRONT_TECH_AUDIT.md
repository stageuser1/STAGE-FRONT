# STAGE FRONT Technical Environment Audit

**Audit date:** 2026-07-24
**Scope:** Read-only review of dependency manifests, lockfile/installed dependency tree, configuration, source imports, and repository structure. No application code was modified.

## Executive summary

STAGE FRONT is already a Next.js 15 / React 19 App Router application. Its resolved environment is Next.js 15.5.20, React 19.2.7, TypeScript 5.9.3, and Tailwind CSS 3.4.19.

There is no third-party UI component system or animation library currently installed. The project uses custom React components styled directly with Tailwind utilities, including a small local primitive layer under `components/ui`.

The proposed target stack is compatible overall:

- **Next.js 15:** already in use; no migration is required.
- **Tailwind CSS v4:** feasible, but it is a real major-version migration. The PostCSS integration, CSS entry directives, and custom theme configuration must be converted or explicitly retained.
- **shadcn/ui:** compatible with Next.js 15, React 19, and Tailwind v4. Integration is additive, but the existing `components/ui` namespace and design tokens require deliberate reconciliation.
- **Motion:** compatible with the current React and Next.js versions. App Router client/server boundaries must be observed for interactive animation APIs.

## 1. Next.js version

| Source | Version |
|---|---:|
| `package.json` declaration | `^15.1.6` |
| `package-lock.json` / installed resolution | **15.5.20** |

The project uses the **App Router** (`app/`) and has a TypeScript `next.config.ts`.

**Assessment:** The repository is already on Next.js 15. Dynamic route props and search parameters are typed as promises and awaited in the reviewed routes, matching the important Next.js 15 asynchronous request API change. No Next.js 14-to-15 migration issue was found.

The declaration is a caret range rather than an exact version, while the lockfile supplies reproducibility at 15.5.20.

## 2. React version

| Package | `package.json` declaration | Resolved version |
|---|---:|---:|
| `react` | `^19.0.0` | **19.2.7** |
| `react-dom` | `^19.0.0` | **19.2.7** |
| `@types/react` | `^19.0.8` | **19.2.17** |
| `@types/react-dom` | `^19.0.3` | **19.2.3** |

**Assessment:** React and React DOM are aligned. Their type packages are also on React 19-compatible releases.

## 3. TypeScript version

| Source | Version |
|---|---:|
| `package.json` declaration | `^5.7.3` |
| Resolved version | **5.9.3** |

The TypeScript configuration uses strict mode, bundler module resolution, `noEmit`, the Next.js plugin, and a root alias of `@/*` to `./*`. These settings are suitable for the current Next.js App Router setup and match the alias expected by shadcn/ui.

## 4. Tailwind CSS version

| Source | Version |
|---|---:|
| `package.json` declaration | `^3.4.17` |
| Resolved version | **3.4.19** |

Related resolved tooling:

- PostCSS: 8.5.16
- Autoprefixer: 10.5.2

Current integration is the Tailwind v3 pattern:

- `tailwind.config.ts` contains content paths, font families, custom colors, and custom shadows.
- `postcss.config.js` loads `tailwindcss` and `autoprefixer`.
- `app/globals.css` uses `@tailwind base`, `@tailwind components`, and `@tailwind utilities`.
- No Tailwind plugins are configured.

## 5. Existing UI component system

There is **no installed third-party UI system** such as shadcn/ui, Radix UI, Headless UI, Material UI, Chakra UI, or Ant Design.

The existing system is a local, custom-built React/Tailwind component library:

- General components live directly under `components/`.
- Domain-oriented components are grouped under `components/pilot`, `components/program`, `components/reviewer`, and `components/school`.
- Reusable UI primitives live under `components/ui`:
  - `DeadlineChip`
  - `EvidenceAccordion`
  - `ExpandableSection`
  - `FactRow`
  - `Icon`
  - `ProseBlock`
  - `SectionCard`
  - `SkeletonCard`
  - `StatusBadge`
- Design tokens are expressed through the Tailwind v3 theme (`brand`, `ink`, `line`, `page`, font stack, and shadows) rather than through shadcn-style CSS variables.
- No `components.json` shadcn configuration file exists.
- No common shadcn support dependencies such as `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, or Radix packages are installed.

## 6. Existing animation libraries

No animation package is declared or imported:

- No `motion` package
- No `framer-motion` package
- No React Spring, GSAP, or comparable animation dependency
- No Tailwind animation plugin

Any existing motion-like behavior is therefore limited to browser/CSS behavior and Tailwind utilities used directly by application components.

## 7. Current folder structure

The following is the meaningful top-level structure. Generated/dependency directories such as `.next` and `node_modules` are omitted from the expanded view.

```text
STAGE FRONT/
├── app/                         Next.js App Router
│   ├── login/
│   ├── pilot/
│   │   ├── program/[program_offering_ref]/
│   │   └── school/[slug]/
│   ├── schools/
│   │   └── [schoolId]/
│   │       └── programs/[programId]/
│   ├── search/
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
├── components/
│   ├── pilot/
│   ├── program/
│   ├── reviewer/
│   ├── school/
│   ├── ui/
│   └── [shared feature components]
├── data/
│   ├── contract/
│   ├── examples/
│   ├── extractions/
│   ├── pilot/
│   ├── reference/
│   ├── sample/
│   ├── programs.ts
│   ├── schools.ts
│   └── types.ts
├── docs/                        Contracts, extraction, import, and pilot docs
├── improve_s/                   Improvement plans, logs, and supporting skills
├── lib/                         Data, auth, formatting, Markdown, and search logic
├── output/                      Generated/audit data outputs
├── scripts/                     Node and Python data/import/verification scripts
├── tests/                       Python and Node tests plus fixtures
├── tmp/                         Temporary import and audit artifacts
├── UK_music_conservatoires/     Conservatoire-specific datasets/reports
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

The application does not use a `src/` directory. The existing `@/*` alias correctly targets the repository root.

## 8. Compatibility of the proposed stack

### Next.js 15

**Compatibility: already adopted; low risk.**

No migration is needed because the resolved version is Next.js 15.5.20. The reviewed App Router route props already follow the asynchronous `params` and `searchParams` model introduced in Next.js 15. React 19 and its type packages are already installed.

If “Next.js 15” means pinning or changing to a different 15.x release, that should be treated as a patch/minor upgrade and validated separately. The current caret declaration permits compatible 15.x updates, but the lockfile currently fixes the installed resolution.

### Tailwind CSS v4

**Compatibility: compatible with required migration work; medium risk.**

The current configuration will not be a drop-in Tailwind v4 setup:

1. Tailwind v4 uses `@tailwindcss/postcss` for its PostCSS plugin rather than loading `tailwindcss` in the current v3 manner.
2. The three `@tailwind` directives in `app/globals.css` are replaced by the v4 CSS import approach.
3. JavaScript/TypeScript configuration files are no longer auto-detected. The custom `tailwind.config.ts` theme must be migrated into CSS-first theme variables or explicitly loaded with `@config`.
4. The project’s custom colors, font family, and shadows must be preserved during that conversion.
5. Tailwind v4 targets modern browsers: Safari 16.4+, Chrome 111+, and Firefox 128+. This is a compatibility issue if STAGE FRONT has older-browser requirements.
6. The official upgrade tool requires Node.js 20 or newer. The repository does not declare a Node engine version, so the deployment/CI Node version must be confirmed before migration.

No configured Tailwind plugins, safelist, custom separator, or disabled core plugins were found, which keeps the migration relatively contained.

### shadcn/ui

**Compatibility: technically compatible; low-to-medium integration risk.**

Current shadcn/ui supports Next.js 15, React 19, and Tailwind v4. The repository already has the required `@/*` alias.

Potential integration issues are organizational and visual rather than framework-level:

1. `components/ui` already exists. Generated shadcn components use that directory by convention, so filename collisions and mixed conventions must be reviewed component by component.
2. The current design system uses Tailwind config tokens; current shadcn/ui uses CSS variables and Tailwind v4 theme mapping. A token mapping is required to prevent a second, inconsistent palette and surface system.
3. Adding shadcn components introduces component-specific dependencies, typically including utilities such as `clsx`, `tailwind-merge`, and `class-variance-authority`, plus packages such as Radix UI or Base UI and `lucide-react` depending on selected components.
4. Interactive generated components are client components. Their placement must preserve the current App Router server/client boundaries.
5. The shadcn CLI writes source files into the repository; existing local primitives should not be overwritten without an explicit per-component comparison.

There is no requirement to replace the current component system wholesale. shadcn/ui can be introduced incrementally.

### Motion (`motion`, formerly commonly consumed as `framer-motion`)

**Compatibility: compatible; low risk.**

Motion supports React 18.2 and newer, including the installed React 19.2.7, and supports both Next.js routers.

App Router considerations:

1. Components using interactive Motion APIs normally need a `"use client"` boundary.
2. Motion also provides `motion/react-client` for appropriate App Router usage with less client JavaScript.
3. Adding animation high in the component tree could unintentionally convert a large server-rendered subtree into client-rendered code; animation should be isolated in small leaf components.
4. Accessibility behavior such as reduced-motion preferences should be part of any later animation design.

No existing animation dependency or API creates a package conflict.

## Overall compatibility verdict

| Target | Verdict | Principal concern |
|---|---|---|
| Next.js 15 | **Already complete** | No migration; only normal 15.x version validation |
| Tailwind CSS v4 | **Compatible with migration work** | PostCSS/CSS entry changes and preservation of custom theme tokens |
| shadcn/ui | **Compatible** | Existing `components/ui` namespace and design-token reconciliation |
| Motion | **Compatible** | Correct App Router client boundaries and bundle discipline |

There is no fundamental incompatibility preventing the proposed stack. The safest dependency order for a future implementation would be Tailwind v4 first, then shadcn/ui, then Motion, while treating the existing custom UI primitives and design tokens as assets to preserve rather than automatically replace.

## References

- [Next.js 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui Tailwind v4 and React 19 guidance](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui Next.js installation guidance](https://ui.shadcn.com/docs/installation/next)
- [Motion for React installation and Next.js guidance](https://motion.dev/docs/react-installation)
