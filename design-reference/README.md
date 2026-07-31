# design-reference

The approved visual export for STAGE, unpacked. This is the source the IELTS Lab
components read their geometry from, and the thing their doc comments mean when
they say "the approved export".

**Origin.** Our own Claude Design export of the STAGE design system — a single
self-contained `STAGE IELTS Lab.html` artifact, produced 2026-07-28. Its payload
is our own work: `ui_kits/ielts_lab/*`, plus `ui_kits/marketing/*` and
`ui_kits/schools/*` in the design system it was cut from. Nothing here is
licensed from or authored by a third party except the vendored runtimes and
fonts, both of which have been removed (below).

**Unpacked and slimmed 2026-07-31**, at review request. The original was 8.3 MB,
of which under 6% was anything a reviewer could read: the rest was font binaries
and vendored JavaScript runtimes needed only to make the artifact render
standalone in a browser. The export is a reference for *values* — token numbers,
component geometry, screen structure — not something we run, so the runtime was
dropped and the sources kept.

## Layout

| Path | What it is |
|---|---|
| `tokens.css` | The `:root` custom properties — colour ramps, type scale, radii, spacing, easing. Every `--stage-*` token in `app/globals.css` traces to a value here; the mapping is recorded in `docs/roadmap/T0_TOKEN_MAP.md`. |
| `design-system.bundle.js` | The compiled component library: `components/core/*`, `components/data/*`, `components/feedback/*`, `components/forms/*`, `components/navigation/*`. Its `@ds-bundle` header lists every source path and hash. Compiled `React.createElement` output rather than JSX — the style objects are intact and readable, which is the part that matters. |
| `ui_kits/ielts_lab/*.jsx` | One screen per file, at the paths the bundle manifest names. `SpeakingScreen.jsx` is the one the Speaking components cite. |
| `ui_kits/ielts_lab/*-data.js` | The fixture data each screen renders. Illustrative sample content, never shipped. |
| `app.jsx` | The export's own entry point: route state and the screen switch. |

## What was removed, and why

| Removed | Size (as stored) | Why |
|---|---|---|
| 119 embedded `woff2` files | 4.49 MB | Plus Jakarta Sans + IBM Plex Mono. T0 declined to adopt either — the app uses Noto Sans SC and Geist Mono — so these were dead weight even before slimming. Both faces are SIL OFL and freely re-obtainable if ever needed. |
| 543 `@font-face` rules | 542 KB of CSS | Existed only to point at the binaries above. `tokens.css` is what remained of that stylesheet. |
| `babel-standalone`, `react`, `react-dom`, `lucide` | 0.98 MB stored (~4.7 MB expanded) | Vendored runtimes, so the artifact could render without a build step. We do not run this export. |
| One placeholder PNG | 0.19 MB | Screenshot chrome from the artifact host. |
| The artifact host loader | — | Bundler scaffolding: gunzip, blob URLs, `frame-ancestors` handling. Meaningless outside the host. |

Result: **8.3 MB → 477 KB**, with every screen, every component and every token
value retained.

## If you need it to render again

Re-export from Claude Design rather than reassembling this tree. Nothing here
depends on the removed runtimes, and nothing in the app imports from this
directory — it is read by people, not by code.
