import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  handleSchoolWrite,
  handleStatusFlip,
} from "../lib/api/schools-write.ts";

/**
 * 写入闸门的八条分支(裁决 5 的豁免正是为了这组测试成立)。
 *
 * 全部离线:deps 注入的是内存假实现,不碰 OSS、不碰网络。语料用
 * `data/v3/real/` 的真实包改造 —— 合成 fixture 只能测到我想到的字段,
 * 真实形状能测到我没想到的。
 */

const TOKEN = "write-token-for-tests";
const REAL = JSON.parse(
  readFileSync(
    path.join("data", "v3", "real", "juilliard-vocal-arts-pilot.json"),
    "utf8",
  ),
);

/**
 * 现行契约要求的两个顶层字段,旧包没有,补上即成合法包(见 Step 0 留档)。
 *
 * `field_ref` 由 `voice` 重映射为 `performance`:跨校词表
 * (data/contract/field-vocabulary.json)目前只收录了实际要入库的学校的
 * field,`voice` 尚未在册。夹具跟着词表走,而不是把测试需要的值塞进词表 ——
 * 词表要如实反映"线上库允许什么",不是"测试想要什么"。
 * 词表拒绝的行为由下面两条专门的测试覆盖。
 */
function validPackage(overrides = {}) {
  const pkg = structuredClone({
    ...REAL,
    status: "draft",
    last_checked: "2026-08-09",
    ...overrides,
  });
  if (!overrides.fields) {
    pkg.fields.forEach((f) => {
      if (f.field_ref === "voice") f.field_ref = "performance";
    });
  }
  if (!overrides.program_offerings) {
    pkg.program_offerings.forEach((o) => {
      if (o.field_ref === "voice") o.field_ref = "performance";
    });
  }
  return pkg;
}

function fakeDeps(overrides = {}) {
  const state = { stored: new Map(), rebuilds: 0, revalidations: 0, revalidated: [] };
  return {
    state,
    deps: {
      writeToken: TOKEN,
      async readPackage(slug) {
        return state.stored.get(slug) ?? null;
      },
      async writePackage(slug, pkg) {
        state.stored.set(slug, pkg);
      },
      async rebuildIndex() {
        state.rebuilds += 1;
      },
      revalidate(target) {
        state.revalidations += 1;
        state.revalidated.push(target);
      },
      ...overrides,
    },
  };
}

function post(body, { token = TOKEN, raw = null } = {}) {
  return new Request("https://stage.test/api/schools", {
    method: "POST",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      "content-type": "application/json",
    },
    body: raw ?? JSON.stringify(body),
  });
}

test("① 无 token → 401,且不写入、不重建、不失效", async () => {
  const { deps, state } = fakeDeps();
  const res = await handleSchoolWrite(post(validPackage(), { token: null }), deps);
  assert.equal(res.status, 401);
  assert.equal(state.stored.size, 0);
  assert.equal(state.rebuilds, 0);
  assert.equal(state.revalidations, 0);
});

test("② 错 token → 401", async () => {
  const { deps, state } = fakeDeps();
  const res = await handleSchoolWrite(post(validPackage(), { token: "nope" }), deps);
  assert.equal(res.status, 401);
  assert.equal(state.stored.size, 0);
});

test("③ 缺必填字段 → 422,响应列出该字段路径,且未写入", async () => {
  const { deps, state } = fakeDeps();
  const pkg = validPackage();
  delete pkg.last_checked;
  const res = await handleSchoolWrite(post(pkg), deps);
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.error, "contract_violation");
  assert.ok(
    body.violations.some((v) => /last_checked/.test(v.message)),
    JSON.stringify(body.violations.slice(0, 3)),
  );
  assert.equal(state.stored.size, 0, "整体拒绝:一个字节都不该写入");
});

test("④ 多余字段 → 422(additionalProperties)", async () => {
  const { deps } = fakeDeps();
  const res = await handleSchoolWrite(
    post(validPackage({ made_up_top_level: 1 })),
    deps,
  );
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.ok(
    body.violations.some((v) => /made_up_top_level|additional/i.test(v.message)),
  );
});

test("⑤ 三处违规全部报出,不是只报第一处", async () => {
  const { deps, state } = fakeDeps();
  const pkg = validPackage({ status: "live" });
  delete pkg.last_checked;
  pkg.program_offerings[0].program_url = "";
  const res = await handleSchoolWrite(post(pkg), deps);
  assert.equal(res.status, 422);
  const { violations } = await res.json();
  assert.ok(violations.length >= 3, `只报了 ${violations.length} 处`);
  assert.ok(violations.some((v) => v.instancePath === "/status"));
  assert.ok(
    violations.some((v) => v.instancePath === "/program_offerings/0/program_url"),
  );
  assert.equal(state.stored.size, 0);
});

test("⑥ status 强制为 draft —— 请求写 published 也一样", async () => {
  const { deps, state } = fakeDeps();
  const res = await handleSchoolWrite(post(validPackage({ status: "published" })), deps);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "draft");
  assert.equal(state.stored.get(body.slug).status, "draft");
  assert.equal(state.rebuilds, 1);
  assert.equal(state.revalidations, 1);
});

test("⑦ publishing.programs[].slug 命中保留字 → 422 且不写入", async () => {
  const { deps, state } = fakeDeps();
  const pkg = validPackage();
  pkg.publishing.programs[0].slug = "share-card";
  const res = await handleSchoolWrite(post(pkg), deps);
  assert.equal(res.status, 422);
  const { violations } = await res.json();
  assert.ok(violations.some((v) => /share-card/.test(v.message)));
  assert.ok(violations.some((v) => /T3b-R1/.test(v.message)));
  assert.equal(state.stored.size, 0);
});

test("⑨ field_ref 不在跨校词表里 → 422 且不写入", async () => {
  // 词表是 Directus 退场后唯一防止「各校各写各的」的机制:一所写
  // music_business、另一所写 music_management,浏览页会分裂成两个类目,
  // 而且没有任何别的机制会发现。
  const { deps, state } = fakeDeps();
  const pkg = validPackage();
  pkg.fields[0].field_ref = "totally_made_up_field";
  pkg.program_offerings.forEach((o) => {
    o.field_ref = "totally_made_up_field";
  });
  const res = await handleSchoolWrite(post(pkg), deps);
  assert.equal(res.status, 422);
  const { violations } = await res.json();
  assert.ok(violations.some((v) => /totally_made_up_field/.test(v.message)));
  assert.ok(violations.some((v) => /field-vocabulary\.json/.test(v.message)));
  assert.equal(state.stored.size, 0);
});

test("声明了在册 field 却引用了不在册的 —— 两处都查,不只查 fields[]", async () => {
  const { deps, state } = fakeDeps();
  const pkg = validPackage();
  // fields[] 保持合法,只把 offering 的引用换成不在册的值
  pkg.program_offerings[0].field_ref = "sneaky_unlisted_field";
  const res = await handleSchoolWrite(post(pkg), deps);
  assert.equal(res.status, 422);
  const { violations } = await res.json();
  assert.ok(violations.some((v) => /sneaky_unlisted_field/.test(v.message)));
  assert.equal(state.stored.size, 0);
});

test("⑧ 覆盖 published 的包 → 降回 draft,并显式提示 previous_status", async () => {
  const { deps, state } = fakeDeps();
  const first = await handleSchoolWrite(post(validPackage()), deps);
  const { slug } = await first.json();
  state.stored.set(slug, { ...state.stored.get(slug), status: "published" });

  const res = await handleSchoolWrite(post(validPackage()), deps);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.previous_status, "published");
  assert.equal(body.status, "draft");
  assert.match(body.notice, /降回 draft/);
  assert.equal(state.stored.get(slug).status, "draft");
});

test("请求体不是合法 JSON → 400,不是 500", async () => {
  const { deps } = fakeDeps();
  const res = await handleSchoolWrite(post(null, { raw: "{not json" }), deps);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "invalid_json");
});

test("publish / unpublish:翻状态、重建、失效;未知 slug 404", async () => {
  const { deps, state } = fakeDeps();
  const { slug } = await (await handleSchoolWrite(post(validPackage()), deps)).json();
  const req = () =>
    new Request("https://stage.test/x", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}` },
    });

  const pub = await handleStatusFlip(slug, "published", req(), deps);
  assert.equal(pub.status, 200);
  assert.deepEqual(await pub.json(), { slug, status: "published", changed: true });
  assert.equal(state.stored.get(slug).status, "published");

  const un = await handleStatusFlip(slug, "draft", req(), deps);
  assert.equal((await un.json()).changed, true);
  assert.equal(state.stored.get(slug).status, "draft");

  const missing = await handleStatusFlip("no-such-school", "published", req(), deps);
  assert.equal(missing.status, 404);
});

test("失效目标必须带具体 slug 与专业 slug —— 只失效动态路由模式清不掉已缓存页面", async () => {
  // 2026-08-09 实测:revalidatePath("/schools/[slug]", "page") 之后
  // /schools/{slug} 仍返回 200。所以核心必须把具体 slug 交出去。
  const { deps, state } = fakeDeps();
  const { slug } = await (await handleSchoolWrite(post(validPackage()), deps)).json();
  const target = state.revalidated.at(-1);
  assert.equal(target.slug, slug);
  assert.ok(target.programSlugs.length > 0, "专业页也必须被失效");
});

test("覆盖写时失效新旧专业 slug 的并集 —— 改名后的旧页面不能留成 200", async () => {
  const { deps, state } = fakeDeps();
  await handleSchoolWrite(post(validPackage()), deps);
  const renamed = validPackage();
  const oldSlug = renamed.publishing.programs[0].slug;
  renamed.publishing.programs[0].slug = "voice-bm-renamed";
  await handleSchoolWrite(post(renamed), deps);

  const target = state.revalidated.at(-1);
  assert.ok(target.programSlugs.includes(oldSlug), "旧 slug 未被失效");
  assert.ok(target.programSlugs.includes("voice-bm-renamed"), "新 slug 未被失效");
});

test("unpublish 必须 revalidate —— 否则撤回通道形同虚设(阶段一实测)", async () => {
  const { deps, state } = fakeDeps();
  const { slug } = await (await handleSchoolWrite(post(validPackage()), deps)).json();
  const before = state.revalidations;
  await handleStatusFlip(
    slug,
    "draft",
    new Request("https://stage.test/x", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}` },
    }),
    deps,
  );
  assert.ok(
    state.revalidations > before,
    "unpublish 没有触发 revalidate:已缓存的页面会继续公开最长一小时",
  );
});

test("publish / unpublish 也要鉴权", async () => {
  const { deps, state } = fakeDeps();
  const { slug } = await (await handleSchoolWrite(post(validPackage()), deps)).json();
  const res = await handleStatusFlip(
    slug,
    "published",
    new Request("https://stage.test/x", { method: "POST" }),
    deps,
  );
  assert.equal(res.status, 401);
  assert.equal(state.stored.get(slug).status, "draft", "未鉴权不得改状态");
});
