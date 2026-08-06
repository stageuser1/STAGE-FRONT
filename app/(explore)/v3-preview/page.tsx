import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { ProgramCardV3 } from "@/components/program/v3/ProgramCardV3";
import { previewProgramsV3 } from "@/data/v3/preview-registry";

/**
 * T3 preview surface: renders every mock Web Card scenario against the
 * blueprint's §2.1 structure. Not wired to Directus — mock data only, per
 * the T3 brief. Not a production route; production `/schools/...` routing
 * is untouched (see T3 handoff notes on the URL-scheme question).
 */
export default function V3PreviewPage() {
  return (
    <>
      <MobileHeader />
      <PageShell>
        <h1 className="text-lg font-semibold text-ink-900">
          STAGE V3 Web Card 预览(mock 数据)
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          覆盖:三种费用形态、金标签 0/1/3、编辑观点有/无、四种 freshness
          状态、曲目要求超长/为空、截止日已过/未过。末尾四条是 T1b 产出的
          茱莉亚真实数据(school slug 带 -t1b 后缀以区分)。
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {previewProgramsV3.map((program) => (
            <ProgramCardV3
              key={`${program.school.slug}-${program.publishing.slug ?? program.offering.field_ref}`}
              program={program}
            />
          ))}
        </div>
      </PageShell>
    </>
  );
}
