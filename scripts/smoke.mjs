#!/usr/bin/env node
/**
 * Route smoke suite (audit P1-7).
 *
 * Thin on purpose: it asserts that a started production artefact answers the
 * representative routes with the expected HTTP status and a content marker that
 * only appears when the page actually rendered its data — not a blank shell or
 * an error boundary. It is a release gate, not a test suite; component and
 * interaction coverage is scheduled with reconstruction (audit P2-7).
 *
 * No browser and no test framework: plain `fetch`, so it runs anywhere Node
 * runs and adds nothing to the dependency tree.
 *
 * Usage:
 *   node scripts/smoke.mjs [--base http://localhost:3000] [--wait 60]
 * Env:
 *   SMOKE_BASE_URL   same as --base
 */

const DEFAULT_BASE = "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 30_000;

function parseArgs(argv) {
  const args = { base: process.env.SMOKE_BASE_URL || DEFAULT_BASE, wait: 60 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--base") args.base = argv[i + 1];
    if (argv[i] === "--wait") args.wait = Number(argv[i + 1]);
  }
  args.base = args.base.replace(/\/$/, "");
  return args;
}

const { base, wait } = parseArgs(process.argv.slice(2));

async function request(path) {
  const started = Date.now();
  const response = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": "stage-smoke/1" },
  });
  const body = await response.text();
  return { status: response.status, body, ms: Date.now() - started };
}

/** Poll the origin until it answers, so CI does not race `next start`. */
async function waitForServer(seconds) {
  const deadline = Date.now() + seconds * 1000;
  for (;;) {
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(5000) });
      if (response.status < 500) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) {
      throw new Error(`server at ${base} did not answer within ${seconds}s`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

/**
 * The two detail routes are discovered from the catalog rather than hardcoded.
 * School and program ids come from Directus and change with every import, so a
 * pinned id would turn a data edit into a red build.
 */
async function discoverDetailRoutes() {
  const catalog = await request("/schools");
  const schoolId = catalog.body.match(/href="\/schools\/([^"/?#]+)"/)?.[1];
  if (!schoolId) {
    throw new Error("could not discover a school id from /schools");
  }

  const school = await request(`/schools/${schoolId}`);
  const programPath = school.body.match(
    new RegExp(`href="(/schools/${schoolId}/programs/[^"?#]+)"`),
  )?.[1];
  if (!programPath) {
    throw new Error(`could not discover a program link on /schools/${schoolId}`);
  }

  return { schoolPath: `/schools/${schoolId}`, programPath };
}

async function main() {
  await waitForServer(wait);
  const { schoolPath, programPath } = await discoverDetailRoutes();

  /**
   * `marker` is matched against the raw response body. Titles are used where a
   * page has one because they are rendered server-side and are specific to the
   * route; body copy is used where the layout supplies the title.
   */
  const checks = [
    { path: "/", marker: "发现、准备并申请全球顶尖音乐院校" },
    { path: "/pricing", marker: "定价 · STAGE" },
    { path: "/contact", marker: "联系我们 · STAGE" },
    { path: "/schools", marker: "STAGE · 海外音乐院校招生数据库" },
    { path: schoolPath, marker: "项目" },
    { path: programPath, marker: "申请" },
    // The prompt's canonical smoke URL. Note the page reads `keyword`, not `q`,
    // so this exercises the no-keyword branch of /search; the `keyword` check
    // below covers the ranked-result path.
    { path: "/search?q=piano", marker: "开始搜索" },
    { path: "/search?keyword=piano", marker: "搜索结果" },
    { path: "/dashboard", marker: "学习中心 · STAGE" },
    { path: "/ielts-lab", marker: "雅思实验室 · STAGE" },
    { path: "/ielts-lab/browse", marker: "题库浏览 · 雅思实验室" },
    {
      path: "/schools/does-not-exist",
      status: 404,
      marker: null,
      // R4 (docs/roadmap/STAGE_REMEDIATION_PLAN.md §R4) makes missing records
      // call notFound(); until it merges the page renders an in-page empty
      // state with HTTP 200. Recorded, not enforced — flip `expectedFail` to
      // false in the same commit that lands R4's notFound() change.
      expectedFail: true,
      expectedFailNote: "pending R4 (invalid detail URLs still answer 200)",
    },
  ];

  const results = [];
  for (const check of checks) {
    const expectedStatus = check.status ?? 200;
    let result;
    try {
      const { status, body, ms } = await request(check.path);
      const statusOk = status === expectedStatus;
      const markerOk = check.marker ? body.includes(check.marker) : true;
      result = {
        ...check,
        status,
        ms,
        bytes: Buffer.byteLength(body),
        ok: statusOk && markerOk,
        detail: statusOk
          ? markerOk
            ? ""
            : `marker not found: ${check.marker}`
          : `expected ${expectedStatus}, got ${status}`,
      };
    } catch (error) {
      result = { ...check, ok: false, ms: 0, bytes: 0, detail: error.message };
    }
    results.push(result);
  }

  const width = Math.max(...results.map((r) => r.path.length));
  for (const r of results) {
    const state = r.ok
      ? "PASS"
      : r.expectedFail
        ? "XFAIL"
        : "FAIL";
    const note = r.ok
      ? `${r.status} ${(r.bytes / 1024).toFixed(0)}KB ${r.ms}ms`
      : `${r.detail}${r.expectedFail ? ` (${r.expectedFailNote})` : ""}`;
    console.log(`${state.padEnd(5)} ${r.path.padEnd(width)}  ${note}`);
  }

  const hardFailures = results.filter((r) => !r.ok && !r.expectedFail);
  const unexpectedPasses = results.filter((r) => r.ok && r.expectedFail);
  for (const r of unexpectedPasses) {
    console.log(
      `NOTE  ${r.path} now passes — remove its expectedFail flag (${r.expectedFailNote})`,
    );
  }

  console.log(
    `\n${results.length - hardFailures.length}/${results.length} checks ok against ${base}`,
  );
  if (hardFailures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(`smoke failed: ${error.message}`);
  process.exit(1);
});
