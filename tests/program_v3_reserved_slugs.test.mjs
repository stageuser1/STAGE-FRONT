/**
 * T3b-R1: reserved `publishing.slug` values under
 * `/schools/{slug}/{program-slug}`.
 *
 * The bug this pins down is Next.js route-resolution order: a **static**
 * path segment wins over a **dynamic** one at the same position, so a
 * program slug equal to a literal sibling/child segment silently loses its
 * own sub-paths (share-card / OG — exactly what WeChat and every OG crawler
 * fetch) to the static folder.
 *
 * 2026-08-08(OSS 迁移)之后的形态:
 * - 守卫逻辑在 `lib/program-v3/reserved-slugs.ts`(从已删除的
 *   `data/v3/real-programs.ts` 原样迁出);
 * - 构建期 params 来自仓库内白名单 `data/prerender-whitelist.ts`,详情页的
 *   `generateStaticParams` 对白名单执行保留字校验;
 * - 运行期(dynamicParams 按需渲染)详情页对保留字 slug 直接 404,并对
 *   OSS 语料跑同一个 `assertNoReservedSlugCollisions`;
 * - 旧的 `/schools/{schoolId}/programs/{programId}` 路由已物理删除,但
 *   `"programs"` 仍保留(裁决:slug 冻结即无法回收,历史 URL 语义不摇摆)。
 *
 * `node --test`, not vitest: nothing here needs a document; imports are
 * alias-free so this runner can load them.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  RESERVED_PROGRAM_SLUGS,
  assertNoReservedSlugCollisions,
} from "../lib/program-v3/reserved-slugs.ts";
import { fixtureProgramsV3 } from "./fixtures/real-programs.ts";

const ROUTE_DIR = fileURLToPath(
  new URL("../app/(explore)/schools/[slug]/[programSlug]/", import.meta.url),
);
const SCHOOL_DIR = fileURLToPath(
  new URL("../app/(explore)/schools/[slug]/", import.meta.url),
);

const ROUTES = [
  { url: "/schools/{school}/{slug}", file: "page.tsx", prerendered: true },
  {
    url: "/schools/{school}/{slug}/opengraph-image",
    file: "opengraph-image.tsx",
    prerendered: false,
  },
  {
    url: "/schools/{school}/{slug}/share-card",
    file: "share-card/route.tsx",
    prerendered: false,
  },
];

const read = (file) => readFileSync(ROUTE_DIR + file, "utf8");

describe("T3b-R1 reserved program slugs", () => {
  test("the real corpus passes the guard — no existing collision", () => {
    const routable = fixtureProgramsV3.filter((p) => p.publishing.slug !== null);
    assert.ok(routable.length > 0);
    assertNoReservedSlugCollisions(routable);
    for (const program of routable) {
      assert.ok(
        !RESERVED_PROGRAM_SLUGS.includes(program.publishing.slug),
        `${program.publishing.slug} is reserved`,
      );
    }
  });

  test("a reserved slug is rejected loudly, and names the offender", () => {
    for (const reserved of RESERVED_PROGRAM_SLUGS) {
      const poisoned = fixtureProgramsV3.map((program, i) =>
        i === 0
          ? { ...program, publishing: { ...program.publishing, slug: reserved } }
          : program,
      );
      assert.throws(
        () => assertNoReservedSlugCollisions(poisoned),
        (error) => {
          assert.match(error.message, /T3b-R1/);
          assert.match(error.message, new RegExp(reserved));
          // must point at the source of the fix, not just complain
          assert.match(error.message, /生成端/);
          return true;
        },
        `slug "${reserved}" must be rejected`,
      );
    }
  });

  test("the failure is a throw, never a silent drop", () => {
    const poisoned = fixtureProgramsV3.map((program, i) =>
      i === 0
        ? { ...program, publishing: { ...program.publishing, slug: "programs" } }
        : program,
    );
    try {
      assertNoReservedSlugCollisions(poisoned);
    } catch {
      return; // threw, which is the contract
    }
    assert.fail(
      "returned instead of throwing — a dropped route only surfaces after " +
        "launch, which is the outcome this guards",
    );
  });

  test("only the poisoned slug is rejected — the rest of a mixed corpus is not named", () => {
    const poisoned = fixtureProgramsV3.map((program, i) =>
      i === 0
        ? { ...program, publishing: { ...program.publishing, slug: "share-card" } }
        : program,
    );
    assert.throws(() => assertNoReservedSlugCollisions(poisoned), (error) => {
      assert.match(error.message, /share-card/);
      for (const clean of poisoned.slice(1, 5)) {
        assert.doesNotMatch(
          error.message,
          new RegExp(`/${clean.publishing.slug}\\b`),
        );
      }
      return true;
    });
  });

  for (const { url, file } of ROUTES.filter((r) => !r.prerendered)) {
    test(`${url} 按需生成:不在构建期枚举 params,只认 OSS published 数据源`, () => {
      const source = read(file);
      // 导出 generateStaticParams 会把全部 satori 图拉回构建期 —— 那是
      // 2026-08-06 那次 45 分 25 秒构建超时的成因。
      assert.doesNotMatch(
        source,
        /export\s+(?:async\s+)?(?:function\s+generateStaticParams|const\s+generateStaticParams)/,
        `${file} 不应有 generateStaticParams(按需生成 + CDN 缓存,裁决 2026-08-06)`,
      );
      // 线上图片只能画 published 数据,绝不是 mock/fixture。
      assert.match(source, /loadPublishedProgramsV3/, file);
      assert.doesNotMatch(source, /mockProgramsV3|fixtureProgramsV3/, file);
      // 未知 slug 必须 404,而不是画一张空卡出来
      assert.match(source, /status:\s*404/, file);
    });
  }

  for (const { url, file } of ROUTES.filter((r) => r.prerendered)) {
    test(`${url} 构建期 params 来自白名单,且白名单过保留字校验`, () => {
      const source = read(file);
      assert.match(
        source,
        /PRERENDER_PROGRAM_PARAMS/,
        `${file} 的 generateStaticParams 必须读仓库内白名单(构建期不请求 OSS)`,
      );
      assert.match(
        source,
        /RESERVED_PROGRAM_SLUGS/,
        `${file} 必须对白名单/请求 slug 执行保留字校验`,
      );
      assert.match(
        source,
        /assertNoReservedSlugCollisions/,
        `${file} 运行期语料必须过共享守卫,而不是内联一份会漂移的拷贝`,
      );
    });
  }

  test("every real on-disk path segment is reserved", () => {
    // Siblings of [programSlug] + literal children + metadata-file segments:
    // any of these shadows (or is shadowed by) a same-named program slug.
    const siblings = readdirSync(SCHOOL_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("["))
      .map((e) => e.name);
    const children = readdirSync(ROUTE_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const metadata = readdirSync(ROUTE_DIR, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name.replace(/\.(tsx?|jsx?)$/, ""))
      .filter((n) => /^(opengraph-image|twitter-image|icon|apple-icon)$/.test(n));

    const onDisk = [...new Set([...siblings, ...children, ...metadata])];
    for (const segment of onDisk) {
      assert.ok(
        RESERVED_PROGRAM_SLUGS.includes(segment),
        `on-disk segment "${segment}" is not in RESERVED_PROGRAM_SLUGS — a new ` +
          `sub-route reopens T3b-R1 for whichever slug matches its name; update ` +
          `the list in the same commit that adds the route.`,
      );
    }
    // 反向不要求相等:"programs" 的字面路由已删除,但按裁决保留(slug 冻结
    // 即无法回收)。清单只增不减是刻意的。
    assert.ok(RESERVED_PROGRAM_SLUGS.includes("programs"));
  });
});
