import { ieltsPreview as d } from "@/content/landing";

/**
 * IELTS simulation preview (doc 03 §2.1) — the hero product mock.
 *
 * Self-contained, static-data, token-pure. NO real logic: the timer, progress,
 * selection, and score are decorative. Server component; animations are CSS
 * only (band fill once on mount, soft colon pulse), both disabled under
 * prefers-reduced-motion via globals.css. Marked aria-hidden with an sr-only
 * label. This component seeds the future IELTS Lab — kept clean.
 *
 * `scale` renders the reduced-size reuse in the IELTS Lab feature section.
 */
export function IeltsSimPreview({ scale = "full" }: { scale?: "full" | "compact" }) {
  const compact = scale === "compact";

  return (
    <div aria-hidden="true">
      <span className="sr-only">{d.ariaLabel}</span>
      <div className="overflow-hidden rounded-stage-xl bg-stage-surface-dark text-stage-fg-on-dark shadow-stage-md ring-1 ring-white/10">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-white/25" />
          <span className="h-3 w-3 rounded-full bg-white/20" />
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="mx-auto font-stage-mono text-caption tracking-normal text-stage-fg-on-dark-muted">
            {d.urlLabel}
          </span>
        </div>

        {/* test header */}
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <p className="text-caption font-medium tracking-normal text-stage-fg-on-dark-muted">
            {d.examTitle}
          </p>
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-stage-mono text-caption tracking-normal text-stage-fg-on-dark">
            {d.timer.split(":")[0]}
            <span className="stage-animate-pulse-soft">:</span>
            {d.timer.split(":")[1]}
          </span>
        </div>
        <div className="mx-5 mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-stage-blue-500"
            style={{ width: `${d.progressPercent}%` }}
          />
        </div>

        {/* body: passage + question */}
        <div className={`grid gap-4 p-5 ${compact ? "" : "sm:grid-cols-2"}`}>
          <div className="space-y-2.5">
            <span className="block h-2.5 w-full rounded-full bg-white/10" />
            <span className="block h-2.5 w-11/12 rounded-full bg-white/10" />
            <span className="block h-2.5 w-full rounded-full bg-stage-blue-400/30" />
            <span className="block h-2.5 w-4/5 rounded-full bg-white/10" />
            <span className="block h-2.5 w-10/12 rounded-full bg-white/10" />
          </div>

          <div className="rounded-stage-md bg-white/5 p-4">
            <p className="font-stage-mono text-caption tracking-normal text-stage-blue-200">
              {d.questionLabel}
            </p>
            <ul className="mt-3 space-y-2">
              {d.answers.map((answer, i) => {
                const selected = i === d.selectedAnswer;
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-2.5 rounded-stage-sm px-3 py-2 ${
                      selected
                        ? "bg-stage-blue-500/15 ring-1 ring-stage-blue-500"
                        : "ring-1 ring-white/10"
                    }`}
                  >
                    <span
                      className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                        selected
                          ? "border-stage-blue-400 bg-stage-blue-500"
                          : "border-white/30"
                      }`}
                    />
                    <span className="truncate text-caption tracking-normal text-stage-fg-on-dark-muted">
                      {answer}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* AI assessment strip */}
        <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-caption font-medium uppercase text-stage-fg-on-dark-muted">
              {d.aiLabel}
            </span>
            <span className="font-stage-mono text-caption tracking-normal text-stage-success">
              {d.aiScoreLabel} {d.aiScore}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="stage-animate-band h-full origin-left rounded-full bg-stage-success"
              style={{ width: `${d.aiBandPercent}%` }}
            />
          </div>
          <span className="mt-3 inline-block rounded-full bg-stage-blue-500/15 px-3 py-1 text-caption tracking-normal text-stage-blue-200">
            {d.aiFeedback}
          </span>
        </div>
      </div>
    </div>
  );
}
