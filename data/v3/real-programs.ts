// Relative, not `@/...`: this file is reachable from `app/sitemap.ts`, which
// tests/program_v3_ai_ready.test.mjs imports directly under `node --test
// --experimental-strip-types` — that loader does not resolve the `@/` alias
// (see app/robots.ts for the fuller explanation).
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  adaptCanonicalPackage,
  type CanonicalPackage,
} from "../../lib/program-v3/package-adapter.ts";
import { programOfferingRef } from "../../lib/program-v3/format.ts";
import type { ProgramV3 } from "./types";

/**
 * T1b 跑通的**真实** canonical 包(茱莉亚 Vocal Arts pilot,Mode F 已产出
 * publishing 块),原样复制自
 * `D:\STAGE_NIGHT_PROCESSOR\output\The_Juilliard_School\Vocal_Arts_Pilot\juilliard.json`
 * (2026-08-03),未做任何字段编辑 —— 复制进仓库只是为了让前端能在没有那台
 * 处理机的环境里(CI、别人的机器)也跑同一份真实数据。
 *
 * 校名/项目 slug 原样取自包(`juilliard` / `voice-bm` 等)—— 这是 T3b
 * (2026-08-05 人类裁决:部分迁移)真正挂在 `/schools/{school-slug}/
 * {program-slug}` 上的数据源,不再加任何后缀。`/v3-preview` 预览面需要
 * 单独的碰撞规避后缀(与 T3 mock 的同名茱莉亚声乐 BM 撞车),那个后缀现在
 * 只在 `preview-registry.ts` 里、只为预览面而加,不污染这份生产数据。
 */
/**
 * 2026-08-06:从 1 所扩到 **20 所**。19 个新包由
 * `scripts/export_canonical_packages.py` 从 Directus canonical 层批量导出、
 * 经 Mode F 产出 `publishing` 块,同样原样复制自
 * `D:\STAGE_NIGHT_PROCESSOR\output\{School_Name}\{school_ref}.json`,前端不做
 * 任何字段编辑。
 *
 * **这 19 个包的 `workflow_status.review_status` 是为试验上线批量翻转的,
 * 数据未经人工复核** —— 每个包的 `data_quality.review_notes[0]` 是一条
 * `⚠ NOT FOR PRODUCTION` 标记,说明了这一点。茱莉亚那个包不在此列,它是 T1b
 * 人工核过的。
 *
 * 顺序即页面顺序:`buildBrowseModel()` 保留数组顺序,所以 tab 行的第一所是
 * 茱莉亚(唯一人工复核过的),其余按 school_ref 字母序。
 */
/**
 * **包从文件系统读,不再 `import ... with { type: "json" }`(裁决 2026-08-06)。**
 *
 * 静态 import 让 webpack 把这 20 个 JSON 当模块处理。原始体积 16.9 MB,解析成
 * AST 再序列化进持久化缓存后膨胀十几倍:第三次 Vercel 构建崩在
 * `ENOSPC: no space left on device`(第 929 页,
 * `/schools/peabody_institute/guitar-mm-historical-performance`),日志末尾的
 * 体积报告点名 `.next/cache/webpack/server-production/1.pack` **257 MB**。
 * 那一次的页数优化其实是生效的(6168 → 2612,前 900 页跑得很快),撞的是磁盘
 * 不是时间。
 *
 * `readFileSync` 的路径是运行期拼出来的,webpack 静态分析看不见,于是这 20 个
 * 文件**完全不进 bundle、不进 webpack 缓存**。
 *
 * 这样做的前提是**所有消费方都在服务端**,已逐个核实:`app/sitemap.ts`、
 * 三条 `/schools/[schoolId]/[programSlug]` 路由、`SchoolsBrowsePage.tsx` 全是
 * 服务端组件;唯一的客户端组件 `SchoolsBrowse.tsx` 通过 props 拿数据,自己不
 * import 这个模块。测试跑在 Node 里(`node --test` 与 vitest),`node:fs` 同样
 * 可用。**客户端组件永远不要 import 这个文件** —— 那会在打包时炸出同样的问题,
 * 而且是以更难诊断的形式。
 *
 * 运行期(按需渲染未预生成的 params)也要读到这些文件,所以 `next.config.ts`
 * 的 `outputFileTracingIncludes` 把 `data/v3/real/**` 显式带进那三条路由的
 * 函数包 —— 与 Listening 数据集同样的手法、同样的理由:文件追踪看不见
 * `readFileSync` 的动态路径。
 */
const REAL_PACKAGE_FILES = [
  // 茱莉亚在最前:它是唯一人工复核过的包,tab 行的第一所就是它
  // (`buildBrowseModel()` 保留数组顺序)。其余按 school_ref 字母序。
  "juilliard-vocal-arts-pilot.json",
  "cleveland-institute-of-music.json",
  "colburn.json",
  "curtis.json",
  "eastman.json",
  "guildhall-school-of-music-and-drama.json",
  "jacobs-school-of-music.json",
  "manhattan-school-of-music.json",
  "new-england-conservatory.json",
  "northwestern-bienen-school-of-music.json",
  "oberlin-conservatory-of-music.json",
  "peabody-institute.json",
  "rice-shepherd-school-of-music.json",
  "royal-academy-of-music.json",
  "royal-college-of-music.json",
  "royal-conservatoire-of-scotland.json",
  "royal-northern-college-of-music.json",
  "university-of-michigan-smtd.json",
  "usc-thornton-school-of-music.json",
  "yale-school-of-music.json",
];

/**
 * `process.cwd()`,不是 `import.meta.url`:webpack 对
 * `new URL("./x", import.meta.url)` 有专门的 asset 处理,会把文件重新拉回
 * bundle —— 那正是这次要摆脱的东西。`next build` 与 `npm test` 的 cwd 都是
 * 仓库根,两边一致。
 */
const REAL_PACKAGE_DIR = path.join(process.cwd(), "data", "v3", "real");

export const realProgramsV3: ProgramV3[] = REAL_PACKAGE_FILES.flatMap((file) => {
  const raw = readFileSync(path.join(REAL_PACKAGE_DIR, file), "utf8");
  return adaptCanonicalPackage(JSON.parse(raw) as CanonicalPackage);
});

/**
 * `publishing.slug` values that cannot be routed to under
 * `/schools/{school-slug}/{program-slug}` because they collide with a real,
 * existing path segment (ruling T3b-R1, 2026-08-05 — found by Codex, not
 * constructed).
 *
 * The collision is Next.js route-resolution order, not a naming clash a
 * human would notice: a **static** segment is matched before a **dynamic**
 * one at the same position. `[programSlug]` sits at the same position as
 * this tree's own literal `programs/` folder (the pre-T3b legacy route,
 * `/schools/{schoolId}/programs/{programId}`, which still serves programs
 * with no Mode F slug and is not being retired by this migration). So a
 * program whose slug is literally `"programs"` resolves its own detail page
 * correctly (`/schools/x/programs` has no 4th segment, nothing for the
 * legacy route to match) — but its share-card/OG sub-paths do not:
 * `/schools/x/programs/share-card` has the same 4-segment shape as the
 * legacy route's `/schools/{schoolId}/programs/{programId}`, and Next commits
 * to the static `programs/` folder before ever considering that "programs"
 * might instead be this program's *own* slug — landing on the legacy route
 * with `programId: "share-card"` instead of this route's share-card image.
 *
 * `"share-card"` and `"opengraph-image"` are reserved for the mirror-image
 * reason: they are this *same* route's own literal children (this
 * directory's `share-card/route.tsx` and `opengraph-image.tsx`) — a program
 * slug equal to one of them would collide with its own sibling sub-route the
 * instant this tree grows a second-level dynamic segment, and reserving it
 * now costs nothing.
 *
 * This list is exactly the real, on-disk path segments as of this ruling —
 * "扫一遍实际存在的路径段", not a hypothetical superset. **If a new
 * sub-route is added under `app/(explore)/schools/[schoolId]/[programSlug]/`
 * (another image variant, an API route, etc.), its literal segment name
 * must be added here too**, or it silently reopens this exact bug for
 * whichever slug happens to match the new name.
 */
export const RESERVED_PROGRAM_SLUGS = ["programs", "share-card", "opengraph-image"];

/**
 * Fails the build, loudly, if any real program's slug hits
 * `RESERVED_PROGRAM_SLUGS` — never silently drops the offending route.
 *
 * §1.4: `slug` is generated once by Mode F and then frozen; frozen means
 * this repo cannot fix an already-generated colliding slug, only detect it.
 * The real source-of-truth fix belongs to Mode F itself (T2), which should
 * refuse to *generate* a reserved slug in the first place — see the T3b
 * handoff's note to T2. This check is the frontend's half: it cannot
 * prevent a bad slug from being generated, but it can refuse to silently
 * ship a route that would 404 or serve the wrong program in production,
 * which is worse than a loud build failure a human sees immediately.
 *
 * Called from all three route trees' `generateStaticParams()`
 * (`page.tsx`, `opengraph-image.tsx`, `share-card/route.tsx`) via
 * `productionProgramRouteParams()` below, so there is exactly one place
 * this validation lives rather than three copies that could drift.
 *
 * Exported (not module-private) so tests can exercise the reserved-word
 * collision directly against a synthetic program list, without mutating the
 * one real `realProgramsV3` array (which is a build-time singleton, not a
 * fixture — the tests need to *inject* a colliding slug, never actually
 * carry one).
 */
export function assertNoReservedSlugCollisions(programs: ProgramV3[]): void {
  const offenders = programs.filter(
    (program) =>
      program.publishing.slug !== null &&
      RESERVED_PROGRAM_SLUGS.includes(program.publishing.slug),
  );
  if (offenders.length === 0) return;
  const detail = offenders
    .map(
      (p) =>
        `  - ${p.school.slug}/${p.publishing.slug} (school_ref=${p.offering.school_ref}, field_ref=${p.offering.field_ref}, degree_level_ref=${p.offering.degree_level_ref})`,
    )
    .join("\n");
  throw new Error(
    `[T3b-R1] publishing.slug 命中保留字,无法安全路由到 ` +
      `/schools/{school}/{slug}(share-card / OG 子路径会被 Next 优先解析成旧的 ` +
      `/schools/{schoolId}/programs/{programId} 路由):\n${detail}\n` +
      `保留字清单:${RESERVED_PROGRAM_SLUGS.join(", ")}。` +
      `这必须在源头(Mode F / T2)避免生成这些 slug —— 前端只能检测,不能安全地` +
      `为已冻结的 slug 挑一个新值。`,
  );
}

/**
 * Shared `generateStaticParams()` body for all three production routes
 * under `/schools/{school-slug}/{program-slug}` (the detail page, the OG
 * image, and the share-card image) — one filter, one collision check,
 * three call sites, so the check cannot be present in one route and
 * forgotten in another.
 *
 * `programs` defaults to the real production data so every route's
 * `generateStaticParams = productionProgramRouteParams` keeps working with
 * zero arguments (Next calls it that way); tests pass a synthetic list to
 * exercise the reserved-slug guard without touching `realProgramsV3` itself.
 */
export function productionProgramRouteParams(
  programs: ProgramV3[] = realProgramsV3,
): { schoolId: string; programSlug: string }[] {
  const routable = programs.filter((program) => program.publishing.slug !== null);
  assertNoReservedSlugCollisions(routable);
  return routable.map((program) => ({
    schoolId: program.school.slug,
    programSlug: program.publishing.slug as string,
  }));
}

/** Production lookup for `/schools/{school-slug}/{program-slug}` — real
 * (Directus/Mode-F-backed) data only, never `data/v3/mock-programs.ts`. */
export function findProductionProgramV3(
  schoolSlug: string,
  programSlug: string,
): ProgramV3 | undefined {
  return realProgramsV3.find(
    (program) =>
      program.school.slug === schoolSlug &&
      program.publishing.slug === programSlug,
  );
}

/** Mirrors `mock-programs.ts`'s `relatedMockProgramsV3`, scoped to real data
 * only — a related-program ref must resolve within the same production set,
 * not reach into the mock/preview-only fixtures. */
export function relatedProductionProgramsV3(program: ProgramV3): ProgramV3[] {
  return program.related_program_refs
    .map((ref) => realProgramsV3.find((p) => programOfferingRef(p) === ref))
    .filter((p): p is ProgramV3 => Boolean(p));
}
