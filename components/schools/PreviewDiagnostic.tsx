import { MobileHeader, PageShell } from "@/components/MobileHeader";
import type { ContractViolation } from "@/lib/contract/validate";

/**
 * 预览面的诊断页(阶段二)。只可能在 preview token 有效时出现 —— token
 * 无效一律 `notFound()`,所以这里可以放心显示 bucket/region 与字段路径。
 *
 * 存在的理由:阶段三的人工复核拿 `?preview=` 逐页核对,"看不到"必须能
 * 区分是"包没传上去"还是"包不合规"。后者在此之前只能在 `POST` 的 422
 * 里看到,复核阶段完全看不见。
 */
export function PreviewDiagnostic({
  slug,
  reason,
  bucket,
  region,
  violations,
}: {
  slug: string;
  reason: "missing" | "invalid";
  bucket?: string;
  region?: string;
  violations?: ContractViolation[];
}) {
  return (
    <>
      <MobileHeader backHref="/schools" subtitle="预览诊断" />
      <PageShell width="reading">
        <div className="rounded-lg border border-[#eeeeee] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            预览诊断 · 此页仅在预览令牌有效时可见
          </p>

          {reason === "missing" ? (
            <>
              <h1 className="mt-3 text-xl font-semibold">OSS 里没有这个包</h1>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                对象键 <code className="text-[13px]">schools/{slug}.json</code> 不存在。
                常见原因:包还没入库、slug 拼写与包内 <code>school_ref</code> 不一致、
                或者传到了别的 bucket。
              </p>
              <dl className="mt-4 text-sm leading-6 text-ink-700">
                <div className="flex gap-2">
                  <dt className="text-ink-500">当前 bucket</dt>
                  <dd>
                    <code className="text-[13px]">{bucket}</code>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-500">当前 region</dt>
                  <dd>
                    <code className="text-[13px]">{region}</code>
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-xl font-semibold">包未通过契约校验</h1>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                <code className="text-[13px]">schools/{slug}.json</code> 存在,但不符合
                <code className="ml-1 text-[13px]">
                  data/contract/stage_music_admissions_v3.schema.json
                </code>
                ,因此不会被任何公开面渲染。逐条修正后重新入库:
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6">
                {(violations ?? []).map((v, i) => (
                  <li className="text-ink-700" key={`${v.instancePath}-${i}`}>
                    <code className="text-[13px] text-brand-600">
                      {v.instancePath || "(顶层)"}
                    </code>{" "}
                    {v.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </PageShell>
    </>
  );
}
