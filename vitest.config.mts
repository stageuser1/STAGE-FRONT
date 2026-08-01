import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The DOM half of this repository's test story.
 *
 * `node --test` (npm run test:lib) remains the runner for everything pure — the
 * attempt reducer, scoring, the persist decisions, the UI and library helpers —
 * and this config deliberately cannot see those files. Two runners with two
 * non-overlapping globs is the point: a lib test must never silently start
 * depending on jsdom, and a component test must never be the place a pure rule
 * is asserted.
 *
 * Hence `include` is `*.dom.test.tsx` under `tests/dom/` and nothing else. A
 * `.test.mjs` beside it belongs to the other runner; a `.dom.test.tsx` is a
 * statement that this file needs a document to say anything.
 *
 * Kept minimal on purpose: no UI, no coverage reporter, no browser mode. The
 * only four packages this adds to the repository are vitest, jsdom and the two
 * Testing Library entry points.
 *
 * `.mts` rather than `.ts` because the repository has no `"type": "module"`,
 * and Vite's native config loader would otherwise read this ESM file as
 * CommonJS and warn on every run.
 */
export default defineConfig({
  /*
   * The repository's tsconfig sets `jsx: "preserve"` because Next does the
   * transform. Nothing transforms it here, so the setting is restated for the
   * test runner's own transformer; without this every `.tsx` it touches —
   * the tests and every component they render — is a syntax error.
   */
  oxc: {
    jsx: { runtime: "automatic", importSource: "react" },
  },
  resolve: {
    alias: [
      /*
       * Next's own `next/link` and `next/navigation` need an App Router
       * context that only a running Next app provides. The components under
       * test use them for one thing each — an anchor, and reading/writing the
       * query string — so the tests substitute the two smallest possible
       * stands-in rather than booting a router.
       *
       * Listed before the `@` alias because the array form is ordered and
       * `next/navigation` must not fall through to a path lookup.
       */
      {
        find: /^next\/link$/,
        replacement: fileURLToPath(
          new URL("./tests/dom/stubs/next-link.tsx", import.meta.url),
        ),
      },
      {
        find: /^next\/navigation$/,
        replacement: fileURLToPath(
          new URL("./tests/dom/stubs/next-navigation.ts", import.meta.url),
        ),
      },
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("./", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/dom/**/*.dom.test.tsx"],
    setupFiles: ["./tests/dom/setup.ts"],
    // Explicit imports from "vitest" in every file, so a test reads the same
    // way the modules it exercises do.
    globals: false,
    restoreMocks: true,
  },
});
