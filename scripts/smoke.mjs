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
 * 专业详情路由从 **sitemap** 现抓,不写死(2026-08-08 OSS 迁移):数据在
 * OSS,slug 随发布变化。用 sitemap 而不是刮浏览页的 href —— sitemap 恰好
 * 就是「已发布的院校页与专业页」的权威清单,而浏览页在只收录一所学校时
 * 根本不渲染任何跨校链接(每个 URL 只渲染本校内容,裁决 2026-08-06),
 * 刮 href 会在单校库下静默漏测详情页。
 *
 * 空库(没有任何 published 学校)是合法状态 —— 此时跳过详情检查项,
 * 只冒烟静态面与 404/重定向语义。
 */
async function discoverDetailRoutes() {
  const sitemap = await request("/sitemap.xml");
  const paths = [...sitemap.body.matchAll(/<loc>[^<]*?(\/schools\/[^<]*)<\/loc>/g)].map(
    (m) => m[1],
  );
  const programPath = paths.find((p) => p.split("/").length === 4) ?? null;
  const schoolPath = programPath
    ? programPath.split("/").slice(0, 3).join("/")
    : (paths.find((p) => p.split("/").length === 3) ?? null);
  return { schoolPath, programPath };
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
    { path: "/", marker: "找到适合你的学校" },
    { path: "/pricing", marker: "定价 · STAGE" },
    { path: "/contact", marker: "联系我们 · STAGE" },
    { path: "/schools", marker: "STAGE · 海外音乐院校招生数据库" },
    // /search 已下线(裁决 2026-08-08):永久重定向到 /schools。fetch 会
    // 跟随重定向,所以断言落点是浏览页标题。
    { path: "/search", marker: "STAGE · 海外音乐院校招生数据库" },
    { path: "/dashboard", marker: "学习中心 · STAGE" },
    { path: "/ielts-lab", marker: "学习总览 · IELTS Lab" },
    { path: "/ielts-lab/browse", marker: "Reading 题库 · IELTS Lab" },
    // Invalid detail URLs answer 404, not a successful page (audit P1-10).
    { path: "/schools/does-not-exist", status: 404, marker: "学校未找到" },
    ...(schoolPath
      ? [
          { path: schoolPath, marker: "项目" },
          {
            path: `${schoolPath}/does-not-exist-program`,
            status: 404,
            marker: "项目未找到",
          },
        ]
      : []),
    ...(programPath ? [{ path: programPath, marker: "申请" }] : []),
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
