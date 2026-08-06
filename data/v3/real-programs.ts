// Relative, not `@/...`: this file is reachable from `app/sitemap.ts`, which
// tests/program_v3_ai_ready.test.mjs imports directly under `node --test
// --experimental-strip-types` — that loader does not resolve the `@/` alias
// (see app/robots.ts for the fuller explanation).
import {
  adaptCanonicalPackage,
  type CanonicalPackage,
} from "../../lib/program-v3/package-adapter.ts";
import { programOfferingRef } from "../../lib/program-v3/format.ts";
// Import attribute required for Node's native ESM loader (used by `node
// --test` on the sitemap.ts chain, see above); Next's bundler ignores it and
// loads the JSON the same way it always has.
import juilliardPackage from "./real/juilliard-vocal-arts-pilot.json" with { type: "json" };
import clevelandPackage from "./real/cleveland-institute-of-music.json" with { type: "json" };
import colburnPackage from "./real/colburn.json" with { type: "json" };
import curtisPackage from "./real/curtis.json" with { type: "json" };
import eastmanPackage from "./real/eastman.json" with { type: "json" };
import guildhallPackage from "./real/guildhall-school-of-music-and-drama.json" with { type: "json" };
import jacobsPackage from "./real/jacobs-school-of-music.json" with { type: "json" };
import manhattanPackage from "./real/manhattan-school-of-music.json" with { type: "json" };
import necPackage from "./real/new-england-conservatory.json" with { type: "json" };
import northwesternPackage from "./real/northwestern-bienen-school-of-music.json" with { type: "json" };
import oberlinPackage from "./real/oberlin-conservatory-of-music.json" with { type: "json" };
import peabodyPackage from "./real/peabody-institute.json" with { type: "json" };
import ricePackage from "./real/rice-shepherd-school-of-music.json" with { type: "json" };
import royalAcademyPackage from "./real/royal-academy-of-music.json" with { type: "json" };
import royalCollegePackage from "./real/royal-college-of-music.json" with { type: "json" };
import royalScotlandPackage from "./real/royal-conservatoire-of-scotland.json" with { type: "json" };
import royalNorthernPackage from "./real/royal-northern-college-of-music.json" with { type: "json" };
import michiganPackage from "./real/university-of-michigan-smtd.json" with { type: "json" };
import uscPackage from "./real/usc-thornton-school-of-music.json" with { type: "json" };
import yalePackage from "./real/yale-school-of-music.json" with { type: "json" };
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
const REAL_PACKAGES = [
  juilliardPackage,
  clevelandPackage,
  colburnPackage,
  curtisPackage,
  eastmanPackage,
  guildhallPackage,
  jacobsPackage,
  manhattanPackage,
  necPackage,
  northwesternPackage,
  oberlinPackage,
  peabodyPackage,
  ricePackage,
  royalAcademyPackage,
  royalCollegePackage,
  royalScotlandPackage,
  royalNorthernPackage,
  michiganPackage,
  uscPackage,
  yalePackage,
];

export const realProgramsV3: ProgramV3[] = REAL_PACKAGES.flatMap((pkg) =>
  adaptCanonicalPackage(pkg as unknown as CanonicalPackage),
);

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
