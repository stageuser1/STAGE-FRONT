import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

/**
 * 契约本体测试(data/contract/stage_music_admissions_v3.schema.json)。
 * 断言 Step 0 的两个核心性质,防止后续改动悄悄漂移:
 * 1. 现存 20 个生产包补上 status/last_checked 后全部通过(与渲染层同构);
 * 2. 校验是整包拒绝且报出具体字段路径(阶段二写入 API 的地基)。
 */

const schema = JSON.parse(
  readFileSync(
    path.join("data", "contract", "stage_music_admissions_v3.schema.json"),
    "utf8",
  ),
);
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const REAL_DIR = path.join("data", "v3", "real");
const files = readdirSync(REAL_DIR).filter((f) => f.endsWith(".json"));

test("全部 20 个生产包补上 status/last_checked 后通过契约", () => {
  assert.equal(files.length, 20);
  for (const f of files) {
    const pkg = JSON.parse(readFileSync(path.join(REAL_DIR, f), "utf8"));
    const ok = validate({ ...pkg, status: "draft", last_checked: "2026-08-08" });
    assert.ok(
      ok,
      `${f}: ${JSON.stringify((validate.errors ?? []).slice(0, 3))}`,
    );
  }
});

test("缺 status/last_checked 的旧包不通过", () => {
  const pkg = JSON.parse(readFileSync(path.join(REAL_DIR, files[0]), "utf8"));
  assert.equal(validate(pkg), false);
  const missing = validate.errors.map((e) => e.params?.missingProperty);
  assert.ok(missing.includes("status"));
  assert.ok(missing.includes("last_checked"));
});

test("字段违规报出具体 instancePath,多处违规全部报出", () => {
  const pkg = JSON.parse(readFileSync(path.join(REAL_DIR, files[0]), "utf8"));
  const broken = {
    ...pkg,
    status: "live",
    last_checked: "2026-08-08",
    program_offerings: [
      { ...pkg.program_offerings[0], program_url: "", made_up_field: 1 },
      ...pkg.program_offerings.slice(1),
    ],
  };
  assert.equal(validate(broken), false);
  const errs = validate.errors;
  assert.ok(errs.some((e) => e.instancePath === "/status"));
  assert.ok(
    errs.some((e) => e.instancePath === "/program_offerings/0/program_url"),
  );
  assert.ok(
    errs.some(
      (e) =>
        e.instancePath === "/program_offerings/0" &&
        e.params?.additionalProperty === "made_up_field",
    ),
  );
});

test("draft/published 之外的 status 值被拒绝", () => {
  const pkg = JSON.parse(readFileSync(path.join(REAL_DIR, files[0]), "utf8"));
  for (const [status, expected] of [
    ["draft", true],
    ["published", true],
    ["unreviewed", false],
  ]) {
    const ok = validate({ ...pkg, status, last_checked: "2026-08-08" });
    assert.equal(ok, expected, `status=${status}`);
  }
});
