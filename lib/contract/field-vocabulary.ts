import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * 跨校 `field_ref` 合法值清单(裁决 2026-08-10)。
 *
 * Directus 退场后词表没有中央归属:词表活在每个包自带的 `fields` 数组里。
 * 若一所学校写 `music_business`、另一所写 `music_management`,浏览页就会
 * 分裂成两个互不相干的类目,而且**没有任何机制会发现**。写入闸门查这份清单
 * 就是那个机制。
 *
 * **边界(运营者裁决)**:只做合法值清单,不做层级、别名、翻译。想加新 field
 * 就在同一个 commit 里改这个文件 —— 那次显式改动本身就是把关点,不是障碍。
 *
 * 没有 `server-only`:纯函数 + readFileSync,写入闸门要能被离线单测
 * (与 `lib/contract/validate.ts` 同一理由与同一读法)。
 */

const VOCABULARY_PATH = path.join(
  process.cwd(),
  "data",
  "contract",
  "field-vocabulary.json",
);

let cached: Set<string> | null = null;

export function fieldVocabulary(): Set<string> {
  if (!cached) {
    const raw = JSON.parse(readFileSync(VOCABULARY_PATH, "utf8")) as {
      field_refs?: unknown;
    };
    if (!Array.isArray(raw.field_refs)) {
      throw new Error(
        `[contract] ${VOCABULARY_PATH} 缺少 field_refs 数组 —— 词表读不到时必须响亮失败,` +
          `不能退化成「什么都放行」`,
      );
    }
    cached = new Set(raw.field_refs.filter((r): r is string => typeof r === "string"));
  }
  return cached;
}

/** 返回不在册的 field_ref(去重、保持首次出现顺序)。 */
export function unknownFieldRefs(refs: readonly string[]): string[] {
  const vocabulary = fieldVocabulary();
  const seen = new Set<string>();
  const unknown: string[] = [];
  for (const ref of refs) {
    if (!vocabulary.has(ref) && !seen.has(ref)) {
      seen.add(ref);
      unknown.push(ref);
    }
  }
  return unknown;
}
