import { lab } from "@/content/landing";

/**
 * IELTS Lab 区块配图 — the **Reading** evidence review (Plan 小项2, which
 * replaces the spec's listening-review image).
 *
 * Two panes: the passage on the left with the evidence sentence highlighted,
 * the question and its error evidence on the right. Deliberately absent:
 * timestamps, any listening chrome, and any score / Band / assessment-progress
 * / AI element whatsoever (spec §五.1, supplement-spec §五.1).
 *
 * Hand-built and static. Decorative, aria-hidden.
 */
export function ReadingEvidenceMock() {
  const d = lab.mock;
  return (
    <div>
      <span className="sr-only">{d.ariaLabel}</span>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-stage-lg border border-stage-border bg-stage-bg"
      >
        <div className="grid md:grid-cols-2">
          {/* left pane — passage */}
          <div className="border-b border-stage-border p-4 md:border-b-0 md:border-r">
            <p className="text-stage-2xs font-medium tracking-stage-eyebrow text-stage-fg-subtle">
              {d.passageTitle}
            </p>
            <div className="mt-3 space-y-3">
              {d.paragraphs.map((paragraph) => (
                <div key={paragraph.marker} className="flex gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-stage-xs bg-stage-neutral-100 px-1.5 py-0.5 font-stage-mono text-stage-2xs text-stage-fg-subtle">
                    {paragraph.marker}
                  </span>
                  <p
                    className={`text-stage-2xs leading-relaxed ${
                      paragraph.highlighted
                        ? "rounded-stage-xs bg-stage-gold-50 px-1.5 py-0.5 text-stage-fg-body ring-1 ring-stage-gold-200"
                        : "text-stage-fg-subtle"
                    }`}
                  >
                    {paragraph.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* right pane — question + error evidence */}
          <div className="bg-stage-bg-soft p-4">
            <p className="font-stage-mono text-stage-2xs text-stage-blue-700">
              {d.question.label}
            </p>
            <p className="mt-2 text-stage-2xs leading-relaxed text-stage-fg-body">
              {d.question.stem}
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-stage-md border border-stage-border bg-stage-bg px-3 py-2">
                <dt className="text-stage-2xs text-stage-fg-subtle">
                  {d.question.yourAnswer.label}
                </dt>
                <dd className="mt-0.5 font-stage-mono text-stage-sm font-semibold text-stage-red-600">
                  {d.question.yourAnswer.value}
                </dd>
              </div>
              <div className="rounded-stage-md border border-stage-green-100 bg-stage-green-50 px-3 py-2">
                <dt className="text-stage-2xs text-stage-green-700">
                  {d.question.correctAnswer.label}
                </dt>
                <dd className="mt-0.5 font-stage-mono text-stage-sm font-semibold text-stage-green-700">
                  {d.question.correctAnswer.value}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-stage-2xs text-stage-fg-muted">
              {d.question.reason}
            </p>
            <span className="mt-3 inline-flex items-center rounded-stage-sm border border-stage-border-strong bg-stage-bg px-2.5 py-1.5 text-stage-2xs font-medium text-stage-primary">
              {d.question.evidenceLink}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
