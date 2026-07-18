import type { LanguageRequirements } from "@/data/types";
import { MissingDataNote } from "./MissingDataNote";
import { ProseBlock } from "./ui/ProseBlock";

interface LanguageRequirementBlockProps {
  requirements?: LanguageRequirements | null;
}

export function LanguageRequirementBlock({
  requirements,
}: LanguageRequirementBlockProps) {
  return (
    <section className="rounded-xl border border-line bg-white p-4 shadow-card md:p-5">
      <LanguageRequirementContent requirements={requirements} />
    </section>
  );
}

export function LanguageRequirementContent({
  requirements,
}: LanguageRequirementBlockProps) {
  if (!requirements) {
    return (
      <>
        <h2 className="text-base font-semibold text-ink-900">
          语言要求{" "}
          <span className="text-xs font-normal text-ink-400">
            Language Requirements
          </span>
        </h2>
        <div className="mt-3">
          <MissingDataNote />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">
          语言要求{" "}
          <span className="text-xs font-normal text-ink-400">
            Language Requirements
          </span>
        </h2>
        <span
          className={
            requirements.english_required
              ? "inline-flex h-[22px] shrink-0 items-center rounded-full bg-brand-50 px-2.5 text-xs font-medium text-brand-700"
              : "inline-flex h-[22px] shrink-0 items-center rounded-full bg-ink-100 px-2.5 text-xs font-medium text-ink-500"
          }
        >
          {requirements.english_required === null
            ? "待确认"
            : requirements.english_required
              ? "需要英语成绩"
              : "不需要"}
        </span>
      </div>

      {requirements.instruction_language ? (
        <p className="mt-3 text-sm text-ink-700">
          授课语言：
          <span className="font-medium text-ink-900">
            {requirements.instruction_language}
          </span>
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {requirements.accepted_tests.length > 0 ? (
          requirements.accepted_tests.map((test) => (
            <div
              className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3.5 py-2.5"
              key={`${test.test_name}-${test.minimum_score ?? "missing"}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">
                  {test.test_name}
                </p>
                {test.section_minimums ? (
                  <p className="mt-0.5 text-xs leading-5 text-ink-500">
                    {test.section_minimums}
                  </p>
                ) : null}
                {test.notes ? (
                  <p className="mt-0.5 text-xs leading-5 text-ink-500">
                    {test.notes}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-900">
                {test.minimum_score ?? (
                  <span className="font-normal text-ink-400">分数待确认</span>
                )}
              </span>
            </div>
          ))
        ) : (
          <MissingDataNote />
        )}
      </div>

      <div className="mt-4 space-y-4 border-t border-line-subtle pt-3">
        <ProseBlock content={requirements.waiver_policy} label="豁免政策" />
        <ProseBlock content={requirements.notes} label="考试说明" />
        {!requirements.waiver_policy && !requirements.notes ? (
          <p className="text-xs text-ink-400">暂无豁免政策说明。</p>
        ) : null}
      </div>
    </>
  );
}
