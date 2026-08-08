// Relative, not `@/...`: loaded by both vitest and `node --test
// --experimental-strip-types`; the latter does not resolve the `@/` alias.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  adaptCanonicalPackage,
  type CanonicalPackage,
} from "../../lib/program-v3/package-adapter.ts";
import type { ProgramV3 } from "../../data/v3/types.ts";

/**
 * 测试语料:`data/v3/real/` 的 20 个 canonical 包,经与生产完全相同的
 * `adaptCanonicalPackage` 装配。
 *
 * 2026-08-08(OSS 迁移):生产读取通道 `data/v3/real-programs.ts` 已物理删除
 * (生产数据在 OSS,硬约束 A:不许本地 JSON fallback)。这 20 个包按裁决留在
 * 仓库原处,自此**只作测试夹具** —— 真实形状的语料,测的是渲染与纯逻辑,
 * 不是数据通道。生产代码禁止 import 本文件。
 */
const REAL_PACKAGE_DIR = path.join(process.cwd(), "data", "v3", "real");

export const fixtureProgramsV3: ProgramV3[] = readdirSync(REAL_PACKAGE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort((a, b) =>
    // 茱莉亚在最前,与旧生产顺序一致(部分测试断言首所学校)。
    a.startsWith("juilliard") ? -1 : b.startsWith("juilliard") ? 1 : a.localeCompare(b),
  )
  .flatMap((file) => {
    const raw = readFileSync(path.join(REAL_PACKAGE_DIR, file), "utf8");
    return adaptCanonicalPackage(JSON.parse(raw) as CanonicalPackage);
  });
