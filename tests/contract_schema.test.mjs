import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

/**
 * 契约本体测试(data/contract/stage_music_admissions_v3.schema.json)。
 * 断言 Step 0 的两个核心性质,防止后续改动悄悄漂移:
 * 1. 现存 20 个生产包补上「语料冻结之后新增的字段」后全部通过(与渲染层同构);
 * 2. 校验是整包拒绝且报出具体字段路径(阶段二写入 API 的地基)。
 *
 * ## 注入项清单(每次新增 required 字段都要在这里显式记账)
 *
 * `data/v3/real/` 的 20 个包冻结于 2026-08-06,此后契约新增的 required 字段
 * 它们必然没有。测试注入这些字段再校验 —— 测的是「契约是否仍描述真实数据的
 * 形状」,不是「旧包是否恰好完整」。注入项**只增不改**,且每一项都要写明来历:
 *
 * | 注入字段 | 加入日期 | 为什么旧包没有 |
 * |---|---|---|
 * | `status` | 2026-08-08 | OSS 迁移的 draft/published 分离,旧包时代没有发布态 |
 * | `last_checked`(顶层) | 2026-08-08 | 同上,包级核对日期是迁移新增 |
 * | `major_declaration_requirements` | 2026-08-10 | 「入学后申报专业的门槛」维度,Berklee 抽取时才发现 |
 *
 * **这张表存在的意义**:让「测试变红 → 加个注入项让它变绿」这个动作留下痕迹。
 * 若某次新增字段其实不该是 required,红灯是信号,不该用注入掩盖过去。
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

/** 见文件头的注入项清单 —— 新增 required 字段时改这里,并同步更新那张表。 */
function withPostFreezeFields(pkg) {
  return {
    ...pkg,
    status: "draft",
    last_checked: "2026-08-08",
    program_offerings: pkg.program_offerings.map((o) => ({
      major_declaration_requirements: null,
      ...o,
    })),
  };
}

test("全部 20 个生产包补上 status/last_checked 后通过契约", () => {
  assert.equal(files.length, 20);
  for (const f of files) {
    const pkg = JSON.parse(readFileSync(path.join(REAL_DIR, f), "utf8"));
    const ok = validate(withPostFreezeFields(pkg));
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
    const ok = validate({ ...withPostFreezeFields(pkg), status });
    assert.equal(ok, expected, `status=${status}`);
  }
});
