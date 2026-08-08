/**
 * 契约校验 CLI(阶段三入库流程的本地前置检查):
 *   node scripts/oss/validate-package.mjs <package.json 路径>
 *
 * 与读通道 / 写入 API 用同一份契约
 * (data/contract/stage_music_admissions_v3.schema.json),同一 ajv 配置
 * (2020-12,strict,allErrors)。全部合规 exit 0;任何字段不合规 exit 1
 * 并逐条打印 instancePath —— 与阶段二写入 API 的 422 响应同一口径。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/oss/validate-package.mjs <package.json>");
  process.exit(2);
}

const schema = JSON.parse(
  readFileSync(
    path.join("data", "contract", "stage_music_admissions_v3.schema.json"),
    "utf8",
  ),
);
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const pkg = JSON.parse(readFileSync(file, "utf8"));
if (validate(pkg)) {
  const school = pkg.schools?.[0];
  console.log(
    `PASS ${file}\n  school: ${school?.school_ref} (${school?.school_name})` +
      `\n  status: ${pkg.status}  last_checked: ${pkg.last_checked}` +
      `\n  offerings: ${pkg.program_offerings.length}  publishing.programs: ${pkg.publishing.programs.length}`,
  );
  process.exit(0);
}

console.error(`FAIL ${file} — ${validate.errors.length} 处violations:`);
for (const e of validate.errors) {
  console.error(`  ${e.instancePath || "(root)"} ${e.message}`);
}
process.exit(1);
