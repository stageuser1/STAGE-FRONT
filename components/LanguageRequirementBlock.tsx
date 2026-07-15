import type { LanguageRequirements } from "@/data/types";
import { MissingDataNote } from "./MissingDataNote";

interface LanguageRequirementBlockProps {
  requirements?: LanguageRequirements | null;
}

export function LanguageRequirementBlock({
  requirements,
}: LanguageRequirementBlockProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
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
        <h2 className="text-base font-semibold text-gray-900">
          英语要求 English Requirement
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
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            英语要求 English Requirement
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            授课语言: {requirements.instruction_language ?? "暂未收录"}
          </p>
        </div>
        <span
          className={
            requirements.english_required
              ? "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
              : "rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600"
          }
        >
          {requirements.english_required === null
            ? "待确认"
            : requirements.english_required
              ? "需要"
              : "不需要"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {requirements.accepted_tests.length > 0 ? (
          requirements.accepted_tests.map((test) => (
            <div
              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
              key={`${test.test_name}-${test.minimum_score ?? "missing"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {test.test_name}
                  </p>
                  {test.section_minimums ? (
                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {test.section_minimums}
                    </p>
                  ) : null}
                </div>
                <span className="text-right text-sm font-semibold text-gray-900">
                  {test.minimum_score ?? <MissingDataNote />}
                </span>
              </div>
              {test.minimum_score === null ? (
                <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  需要人工核验
                </span>
              ) : null}
              {test.notes ? (
                <p className="mt-2 text-xs leading-5 text-gray-600">
                  {test.notes}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <MissingDataNote />
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3 text-sm leading-6 text-gray-600">
        <p>
          豁免政策: {requirements.waiver_policy ?? <MissingDataNote />}
        </p>
        {requirements.notes ? <p className="mt-1">{requirements.notes}</p> : null}
      </div>
    </>
  );
}
