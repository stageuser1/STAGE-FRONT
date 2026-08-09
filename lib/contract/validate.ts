import Ajv2020, { type ValidateFunction, type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { CanonicalPackage } from "../program-v3/package-adapter.ts";

/**
 * 读写共用的唯一校验器(契约:data/contract/stage_music_admissions_v3.schema.json)。
 * OSS 读通道(lib/oss/schools.ts)与写入 API(阶段二)都必须走这里 ——
 * 不允许出现第二个 ajv 实例或第二份 schema 拷贝。
 *
 * schema 用 readFileSync 而不是 import:与 data/v3 静态包同一个教训
 * (webpack 把大 JSON 卷进持久缓存,见 pre-oss-migration 基线的
 * data/v3/real-programs.ts 注释),契约文件虽小,但读法保持一致,
 * 且改 schema 不触发重新打包。
 */

const SCHEMA_PATH = path.join(
  process.cwd(),
  "data",
  "contract",
  "stage_music_admissions_v3.schema.json",
);

/**
 * `publishing.programs[]` 里被写入闸门与索引重建**当作值用**的字段。
 *
 * `CanonicalPackage` 把它建模为 `Record<string, unknown>` —— 那对只做形状
 * 搬运的适配器够用,但对"取 slug 去查保留字""取 slug 写进索引"不够:
 * 校验器已经保证了这些字段的存在与类型,类型就该说出来,而不是让调用方
 * 各自 `as string`(那正是断言掩盖真实类型错误的老路,见 T3b 的教训)。
 *
 * 用 type 而非 interface:interface 没有索引签名,无法赋给
 * `Record<string, unknown>`,会把 `ContractPackage` 与 `CanonicalPackage`
 * 的兼容性割断。
 */
export type ContractPublishingProgram = {
  program_offering_ref: string;
  slug: string;
  [key: string]: unknown;
};

/** 契约包 = 渲染层消费的集合形状 + OSS 迁移新增的发布控制字段。 */
export interface ContractPackage extends Omit<CanonicalPackage, "publishing"> {
  status: "draft" | "published";
  last_checked: string;
  publishing: { programs: ContractPublishingProgram[] };
}

let compiled: ValidateFunction | null = null;

function validator(): ValidateFunction {
  if (!compiled) {
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    addFormats(ajv);
    compiled = ajv.compile(
      JSON.parse(readFileSync(SCHEMA_PATH, "utf8")) as object,
    );
  }
  return compiled;
}

export interface ContractViolation {
  /** JSON Pointer 定位到具体字段,如 `/program_offerings/3/program_url`。 */
  instancePath: string;
  message: string;
}

export type ContractResult =
  | { ok: true; pkg: ContractPackage }
  | { ok: false; violations: ContractViolation[] };

/** 整包校验:全部合规才返回 ok,任何字段不合规都报出具体位置。 */
export function validateContractPackage(data: unknown): ContractResult {
  const validate = validator();
  if (validate(data)) {
    return { ok: true, pkg: data as unknown as ContractPackage };
  }
  const violations = (validate.errors ?? []).map(
    (e: ErrorObject): ContractViolation => ({
      instancePath: e.instancePath,
      message: e.message ?? "invalid",
    }),
  );
  return { ok: false, violations };
}
