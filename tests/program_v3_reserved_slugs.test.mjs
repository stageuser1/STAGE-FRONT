/**
 * T3b-R1: reserved `publishing.slug` values under
 * `/schools/{school-slug}/{program-slug}`.
 *
 * The bug this pins down is Next.js route-resolution order, which no amount
 * of reading the three route files side by side makes visible: a **static**
 * path segment wins over a **dynamic** one at the same position. This tree
 * has a literal `programs/` folder (the pre-T3b legacy route) sitting at the
 * same position as `[programSlug]`, so a program whose slug is literally
 * `"programs"` renders its own detail page fine (`/schools/x/programs` has
 * no 4th segment, nothing for the legacy route to match) — and then
 * silently loses its share-card and OG sub-paths to the legacy route
 * (`/schools/x/programs/share-card` has the same 4-segment shape as
 * `/schools/{schoolId}/programs/{programId}`, and Next commits to the
 * static folder before ever considering "programs" might be *this*
 * program's own slug). Those sub-paths are exactly what WeChat and every OG
 * crawler actually fetch.
 *
 * Four things are asserted, one per failure mode:
 *
 *   1. the collision is rejected at build time, loudly (not silently
 *      skipped — a dropped route only surfaces after launch);
 *   2. all three routes share the one validated params function, so the
 *      check cannot be present in the page and forgotten in the image
 *      routes (or duplicated three times and drift out of sync);
 *   3. the reserved list still equals the real on-disk path segments —
 *      this is what stops a *future* sub-route from silently reopening the
 *      bug for whichever slug happens to match its name;
 *   4. the current real corpus (the 4 T1b slugs) doesn't hit any of this —
 *      confirmed by the human ruling, re-asserted here so it stays true.
 *
 * `node --test`, not vitest: nothing here needs a document, and
 * `data/v3/real-programs.ts` is deliberately alias-free so this runner can
 * import it (see that file's header).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  RESERVED_PROGRAM_SLUGS,
  productionProgramRouteParams,
  realProgramsV3,
} from "../data/v3/real-programs.ts";

const ROUTE_DIR = fileURLToPath(
  new URL("../app/(explore)/schools/[schoolId]/[programSlug]/", import.meta.url),
);
const SCHOOL_DIR = fileURLToPath(
  new URL("../app/(explore)/schools/[schoolId]/", import.meta.url),
);

/** The three production routes, by the URL each one serves. */
const ROUTES = [
  { url: "/schools/{school}/{slug}", file: "page.tsx" },
  { url: "/schools/{school}/{slug}/opengraph-image", file: "opengraph-image.tsx" },
  { url: "/schools/{school}/{slug}/share-card", file: "share-card/route.tsx" },
];

const read = (file) => readFileSync(ROUTE_DIR + file, "utf8");

describe("T3b-R1 reserved program slugs", () => {
  test("the real corpus routes cleanly — no existing collision", () => {
    // 2026-08-06:语料从 4 个 slug 扩到 1778 个,原来写死的 `length === 4`
    // 因为数据变多而红。这条要守的是「每个可路由的项目都进了 params,且没有
    // 一个命中保留字」—— 数量从 `realProgramsV3` 现算才是这句话的意思。
    const routable = realProgramsV3.filter((p) => p.publishing.slug !== null);
    const params = productionProgramRouteParams();
    assert.equal(params.length, routable.length);
    for (const { programSlug } of params) {
      assert.ok(
        !RESERVED_PROGRAM_SLUGS.includes(programSlug),
        `${programSlug} is reserved`,
      );
    }
  });

  test("a reserved slug fails the build loudly, and names the offender", () => {
    // Every reserved word, not just "programs": the next one to break will be
    // whichever sub-route someone adds later.
    for (const reserved of RESERVED_PROGRAM_SLUGS) {
      const poisoned = realProgramsV3.map((program, i) =>
        i === 0
          ? { ...program, publishing: { ...program.publishing, slug: reserved } }
          : program,
      );
      assert.throws(
        () => productionProgramRouteParams(poisoned),
        (error) => {
          assert.match(error.message, /T3b-R1/);
          assert.match(error.message, new RegExp(reserved));
          // must point at the source of the fix, not just complain
          assert.match(error.message, /Mode F|T2/);
          return true;
        },
        `slug "${reserved}" must be rejected`,
      );
    }
  });

  test("the failure is a throw, never a silent drop", () => {
    const poisoned = realProgramsV3.map((program, i) =>
      i === 0
        ? { ...program, publishing: { ...program.publishing, slug: "programs" } }
        : program,
    );
    let params;
    try {
      params = productionProgramRouteParams(poisoned);
    } catch {
      return; // threw, which is the contract
    }
    assert.fail(
      `returned ${params.length} route(s) instead of throwing — a dropped ` +
        `route only surfaces after launch, which is the outcome this guards`,
    );
  });

  test("only the poisoned slug is rejected — the rest of a mixed corpus still routes", () => {
    // A single bad slug shouldn't be reported as "the whole corpus is
    // broken" without saying which one, nor should it silently swallow the
    // other three legitimate programs from the error message.
    const poisoned = realProgramsV3.map((program, i) =>
      i === 0
        ? { ...program, publishing: { ...program.publishing, slug: "share-card" } }
        : program,
    );
    assert.throws(() => productionProgramRouteParams(poisoned), (error) => {
      assert.match(error.message, /share-card/);
      // the other three real slugs must not also be named as offenders
      for (const clean of poisoned.slice(1)) {
        assert.doesNotMatch(
          error.message,
          new RegExp(`/${clean.publishing.slug}\\b`),
        );
      }
      return true;
    });
  });

  for (const { url, file } of ROUTES) {
    test(`${url} derives its params from the shared, validated source`, () => {
      const source = read(file);
      // Must be a real zero-arg wrapper (`function generateStaticParams() {
      // return productionProgramRouteParams(); }`), **not** a direct
      // assignment (`generateStaticParams = productionProgramRouteParams`).
      // The direct form was tried and reverted: Next.js calls
      // `generateStaticParams` with a props object, never zero arguments,
      // which silently overrides `productionProgramRouteParams`'s optional
      // `programs` default and crashes `next build` with `a.filter is not a
      // function` — a real runtime bug `tsc` alone did not catch (a type
      // assertion had silenced its correct objection). The wrapper is the
      // only form that is both type-correct and runtime-correct.
      assert.match(
        source,
        /function\s+generateStaticParams\s*\(\s*\)\s*\{\s*return\s+productionProgramRouteParams\s*\(\s*\)\s*;?\s*\}/,
        `${file} must call productionProgramRouteParams() from a zero-arg ` +
          `generateStaticParams wrapper, not alias it directly (that crashes ` +
          `\`next build\` — see the comment above) and not re-filter ` +
          `realProgramsV3 itself (an inline copy is how one route keeps the ` +
          `check while another loses it)`,
      );
    });
  }

  test("the reserved list still equals the real on-disk path segments", () => {
    // Siblings of [programSlug]: a static folder here shadows the dynamic
    // segment, which is exactly how "programs" broke.
    const siblings = readdirSync(SCHOOL_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("["))
      .map((e) => e.name);

    // Children of [programSlug]: literal sub-route segments, plus Next's
    // metadata-file conventions, which become URL segments of the same shape.
    const children = readdirSync(ROUTE_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const metadata = readdirSync(ROUTE_DIR, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name.replace(/\.(tsx?|jsx?)$/, ""))
      .filter((n) => /^(opengraph-image|twitter-image|icon|apple-icon)$/.test(n));

    const onDisk = new Set([...siblings, ...children, ...metadata]);
    assert.deepEqual(
      [...onDisk].sort(),
      [...RESERVED_PROGRAM_SLUGS].sort(),
      `RESERVED_PROGRAM_SLUGS has drifted from the actual route tree. A new ` +
        `sub-route reopens T3b-R1 for whichever slug matches its name, so the ` +
        `list must be updated in the same commit that adds the route.`,
    );
  });

  test("the legacy route that causes the collision still exists", () => {
    // If this ever fails, the legacy tree was retired and the whole reservation
    // may be revisited — deliberately a failing test rather than silent
    // over-restriction that nobody ever removes.
    const legacy = readdirSync(SCHOOL_DIR + "programs", { withFileTypes: true });
    assert.ok(
      legacy.some((e) => e.isDirectory() && e.name === "[programId]"),
      "legacy /schools/{schoolId}/programs/[programId] is gone — revisit " +
        "whether 'programs' still needs reserving",
    );
  });
});
