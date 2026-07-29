import type { Metadata } from "next";
import { QUESTION_TYPE_GUIDES } from "@/content/ielts-question-types";
import { getAllExams } from "@/lib/ielts/catalog";
import { questionTypeLabel } from "@/lib/ielts/question-types";
import questionTypeIndex from "@/lib/ielts/question-types.json";
import { PageHeader } from "@/components/ielts/ui";

export const metadata: Metadata = {
  title: "题型说明 · IELTS Lab",
  description:
    "STAGE IELTS Lab 题型说明：每种阅读题型要求你做什么，以及它在当前题库中的题量。",
};

const INDEX = questionTypeIndex as {
  kinds: string[];
  exams: Record<string, Record<string, number>>;
};

interface TypeTally {
  /** Questions of this kind across the corpus. */
  questions: number;
  /** Passages containing at least one question of this kind. */
  passages: number;
}

/**
 * Real counts, computed at build time from the two shipped indices.
 *
 * The exam index is the definition of "the current corpus", so the tally is
 * driven by it rather than by the type index's key set: a passage that is
 * indexed but no longer listed must not inflate a number the learner reads as
 * "how much of this is in the 题库". Both indices are static imports, so this
 * runs once during the build and the route stays static.
 */
function tallyTypes(): {
  byKind: Map<string, TypeTally>;
  passages: number;
  questions: number;
} {
  const byKind = new Map<string, TypeTally>();
  let passages = 0;
  let questions = 0;

  for (const exam of getAllExams()) {
    const indexed = INDEX.exams[exam.id];
    // One catalog record carries no interactive question data. It is counted
    // nowhere rather than counted as zero — see Plan §6.8, `null ≠ 0`.
    if (!indexed) continue;
    passages += 1;

    const seen = new Set<string>();
    for (const kindIndex of Object.values(indexed)) {
      const kind = INDEX.kinds[kindIndex];
      if (!kind) continue;
      questions += 1;
      const tally = byKind.get(kind) ?? { questions: 0, passages: 0 };
      tally.questions += 1;
      if (!seen.has(kind)) {
        tally.passages += 1;
        seen.add(kind);
      }
      byKind.set(kind, tally);
    }
  }

  return { byKind, passages, questions };
}

export default function IeltsQuestionTypesPage() {
  const { byKind, passages, questions } = tallyTypes();

  // Corpus first, copy second: a kind present in the index with no entry
  // written for it would silently vanish from a page whose whole job is to be
  // complete, so it fails the build instead.
  const missing = INDEX.kinds.filter(
    (kind) => !QUESTION_TYPE_GUIDES.some((guide) => guide.kind === kind),
  );
  if (missing.length > 0) {
    throw new Error(
      `content/ielts-question-types.ts is missing entries for: ${missing.join(", ")}`,
    );
  }

  // Commonest first — the order a learner working through the 题库 meets them.
  const entries = QUESTION_TYPE_GUIDES.map((guide) => ({
    ...guide,
    label: questionTypeLabel(guide.kind),
    tally: byKind.get(guide.kind) ?? { questions: 0, passages: 0 },
  }))
    .filter((entry) => entry.tally.questions > 0)
    .sort((a, b) => b.tally.questions - a.tally.questions);

  return (
    <div>
      <PageHeader
        title="题型说明"
        subtitle={`每种题型要求你做什么，以及它在当前题库中的题量。题量统计自 ${passages} 篇可作答文章、共 ${questions} 道题。`}
      />

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/*
          Subject rail. Reading is the only subject with a corpus, so there is
          no switcher: a control with a single option promises choices that do
          not exist. The other three appear here when their modules ship
          (Plan §2.6) — no placeholder rows in the meantime.
        */}
        <nav
          aria-label="题型目录"
          className="shrink-0 md:w-44 md:self-start lg:w-52"
        >
          <p className="text-stage-2xs font-semibold uppercase tracking-stage-eyebrow text-stage-fg-subtle">
            科目
          </p>
          <p className="mt-1.5 text-stage-xs font-medium text-stage-fg">
            Reading 阅读
            <span className="sr-only">（当前科目）</span>
          </p>
          <ul className="mt-3 border-t border-stage-border">
            {entries.map((entry) => (
              <li key={entry.kind} className="border-b border-stage-border">
                <a
                  href={`#type-${entry.kind}`}
                  className="flex min-h-9 items-center justify-between gap-2 py-1.5 text-stage-xs text-stage-fg-muted transition-colors duration-stage-fast hover:text-stage-fg"
                >
                  <span className="truncate">{entry.label}</span>
                  <span className="shrink-0 tabular-nums text-stage-2xs text-stage-fg-subtle">
                    {entry.tally.questions}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 overflow-hidden rounded-stage-lg border border-stage-border">
          {entries.map((entry) => (
            <article
              key={entry.kind}
              id={`type-${entry.kind}`}
              className="scroll-mt-6 border-b border-stage-border px-4 py-4 last:border-b-0 sm:px-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-stage-sm font-semibold text-stage-fg">
                  {entry.label}{" "}
                  <span className="font-normal text-stage-fg-muted">
                    {entry.en}
                  </span>
                </h2>
                {/* Counts, not a share: a percentage would invite reading it as
                    a difficulty or importance signal, which it is not. */}
                <p className="text-stage-2xs tabular-nums text-stage-fg-subtle">
                  当前题库 {entry.tally.questions} 题 · 出现在{" "}
                  {entry.tally.passages} 篇文章
                </p>
              </div>
              <p className="mt-2 max-w-prose text-stage-xs text-stage-fg-body">
                {entry.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <p className="mt-6 text-stage-2xs text-stage-fg-subtle">
        本页只说明每种题型的作答方法，不包含任何文章内容或答案。
      </p>
    </div>
  );
}
