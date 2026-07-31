"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  SPEAKING_FREQUENCY_LABELS,
  SPEAKING_PARTS,
  SPEAKING_PART_BLURB,
  SPEAKING_PART_LABELS,
  speakingFrequency,
  type SpeakingFrequency,
  type SpeakingPart,
  type SpeakingQuestion,
  type SpeakingTopic,
} from "@/lib/ielts/speaking-types";
import {
  downloadFile,
  exportFilename,
  mergeStates,
  parseImport,
  toJson,
} from "@/lib/ielts/speaking-io";
import {
  clearAllSpeaking,
  hasMaterial,
  loadSpeakingStates,
  replaceSpeakingStates,
  type SpeakingQuestionState,
} from "@/lib/ielts/speaking-session";
import { Icon } from "@/components/ui/Icon";
import { SpeakingSteps } from "./SpeakingSteps";
import {
  BUTTON_SECONDARY,
  Badge,
  ConfirmButton,
  FIELD,
} from "./ui";

type FrequencyFilter = SpeakingFrequency | "all";
type Sort = "corpus" | "frequency";

const PAGE_SIZE = 24;

/**
 * 题目 — step one of the five-step Speaking flow.
 *
 * Layout from the approved export's `SpeakingScreen.jsx` at `step === 0`: the
 * page title, the step rail, a pill Part switch, then a card grid of prompts
 * that each end in 选择此题 →. Four things the export's three-card mock did not
 * have to solve are added around it, because this corpus is 324 real prompts
 * rather than eight: search, a topic filter, a frequency facet and paging.
 *
 * The row status is derived from local material only; there is no accuracy, no
 * score and nothing that ranks one learner's answer against anything.
 */
export function SpeakingCatalog({ topics }: { topics: SpeakingTopic[] }) {
  const [part, setPart] = useState<SpeakingPart>(1);
  const [topicId, setTopicId] = useState<string>("all");
  const [frequency, setFrequency] = useState<FrequencyFilter>("all");
  const [sort, setSort] = useState<Sort>("corpus");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // localStorage is unreadable until after mount, so status appears with its
  // data rather than flashing on questions that have material.
  const [states, setStates] = useState<Map<string, SpeakingQuestionState>>(
    new Map(),
  );

  useEffect(() => {
    setStates(loadSpeakingStates());
  }, []);

  const questions = useMemo(
    () => topics.flatMap((topic) => topic.questions),
    [topics],
  );

  /** Topics that actually hold a question of the chosen part. */
  const partTopics = useMemo(
    () =>
      topics.filter((topic) =>
        topic.questions.some((question) => question.part === part),
      ),
    [topics, part],
  );

  const inPart = useMemo(
    () => questions.filter((question) => question.part === part),
    [questions, part],
  );

  const frequencyCounts = useMemo(() => {
    const counts = new Map<SpeakingFrequency, number>();
    for (const question of inPart) {
      const band = speakingFrequency(question.recallCount);
      if (band) counts.set(band, (counts.get(band) ?? 0) + 1);
    }
    return counts;
  }, [inPart]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matched = inPart.filter((question) => {
      if (topicId !== "all" && question.topicId !== topicId) return false;
      if (
        frequency !== "all" &&
        speakingFrequency(question.recallCount) !== frequency
      ) {
        return false;
      }
      if (needle === "") return true;
      return (
        question.textEn.toLowerCase().includes(needle) ||
        question.topicLabelEn.toLowerCase().includes(needle) ||
        question.topicLabelZh.includes(needle)
      );
    });

    if (sort === "corpus") return matched;
    // Highest recall first, corpus order within a tie so the list is stable;
    // rows with no recall data sort last rather than as a zero.
    return [...matched].sort(
      (left, right) => (right.recallCount ?? -1) - (left.recallCount ?? -1),
    );
  }, [inPart, topicId, frequency, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamped rather than reset, so narrowing a filter lands on the last page
  // instead of silently throwing away the reading position.
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function reset<T>(setter: (next: T) => void) {
    return (next: T) => {
      setter(next);
      setPage(1);
    };
  }

  return (
    <div className="grid content-start gap-[18px]">
      <div className="flex flex-wrap items-center gap-3.5">
        <h1 className="flex-1 text-stage-h2 font-bold leading-[1.15] text-stage-fg">
          Speaking
        </h1>
      </div>

      <SpeakingSteps current={0} />

      <div className="flex flex-wrap items-center gap-3">
        <PartTabs
          value={part}
          onChange={(next) => {
            setPart(next);
            setTopicId("all");
            setFrequency("all");
            setPage(1);
          }}
        />
        <p className="text-stage-xs text-stage-fg-subtle">
          {SPEAKING_PART_BLURB[part]}
        </p>
      </div>

      <SearchField value={search} onChange={reset(setSearch)} />

      <div className="grid gap-3">
        <FacetRow label="频次">
          <FilterPill
            selected={frequency === "all"}
            onClick={() => reset(setFrequency)("all")}
          >
            全部
          </FilterPill>
          {(["high", "medium"] as const).map((band) => (
            <FilterPill
              key={band}
              selected={frequency === band}
              onClick={() =>
                reset(setFrequency)(frequency === band ? "all" : band)
              }
              count={frequencyCounts.get(band) ?? 0}
            >
              {SPEAKING_FREQUENCY_LABELS[band]}
            </FilterPill>
          ))}
          <FilterPill
            selected={sort === "frequency"}
            onClick={() =>
              setSort(sort === "frequency" ? "corpus" : "frequency")
            }
          >
            高频优先排序
          </FilterPill>
        </FacetRow>

        <FacetRow label="话题">
          <select
            value={topicId}
            onChange={(event) => reset(setTopicId)(event.target.value)}
            aria-label="话题"
            className={`h-[34px] py-0 ${FIELD}`}
          >
            <option value="all">全部话题（{partTopics.length}）</option>
            {partTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.labelZh} {topic.labelEn}
              </option>
            ))}
          </select>
          <span className="text-stage-xs tabular-nums text-stage-fg-subtle">
            共 {filtered.length} 道题目
          </span>
        </FacetRow>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-stage-lg border border-stage-border bg-stage-bg-soft px-[18px] py-7 text-center text-stage-sm text-stage-fg-subtle">
          没有符合条件的题目，试试调整筛选条件。
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
          {visible.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              state={states.get(question.id) ?? null}
            />
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <Pagination page={current} pageCount={pageCount} onChange={setPage} />
      ) : null}

      <MaterialCorner
        states={states}
        onChange={(next) => setStates(new Map(next.map((s) => [s.questionId, s])))}
      />
    </div>
  );
}

/**
 * The Part switch, at the export's `Tabs variant="pill"` geometry: a sunken 8px
 * tray with 4px of padding, holding 4px-radius tabs; the selected one is a white
 * chip. Local rather than `./ui`'s `Tabs`, which is the fully-rounded segmented
 * control this screen does not use.
 */
function PartTabs({
  value,
  onChange,
}: {
  value: SpeakingPart;
  onChange: (next: SpeakingPart) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="口语部分"
      className="inline-flex gap-1.5 rounded-stage-sm bg-stage-bg-soft p-1"
    >
      {SPEAKING_PARTS.map((part) => {
        const active = part === value;
        return (
          <button
            key={part}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(part)}
            className={`whitespace-nowrap rounded-stage-xs px-4 py-2 text-stage-sm font-medium transition-colors duration-stage-fast ease-stage-standard ${
              active
                ? "bg-stage-bg text-stage-fg shadow-stage-xs"
                : "text-stage-fg-muted hover:text-stage-fg"
            }`}
          >
            {SPEAKING_PART_LABELS[part]}
          </button>
        );
      })}
    </div>
  );
}

/** Full-width search box, identical to the Reading catalog's. */
function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex h-11 items-center gap-2.5 rounded-stage-sm border border-stage-border-strong bg-stage-bg px-3.5 transition-colors duration-stage-fast ease-stage-standard focus-within:border-stage-blue-500 focus-within:shadow-stage-focus">
      <span aria-hidden className="grid flex-none text-stage-fg-subtle">
        <Icon name="search" size={18} />
      </span>
      <span className="sr-only">搜索题目</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索题目或话题"
        className="min-w-0 flex-1 bg-transparent text-stage-sm text-stage-fg outline-none placeholder:text-stage-fg-subtle"
      />
    </label>
  );
}

function FacetRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="w-11 flex-none text-stage-xs text-stage-fg-subtle">
        {label}
      </span>
      {children}
    </div>
  );
}

/** The Reading catalog's facet pill, at the same sizes, so the two banks read alike. */
function FilterPill({
  selected,
  onClick,
  count,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-[34px] flex-none items-center gap-1.5 whitespace-nowrap rounded-stage-pill border px-3.5 text-stage-sm font-medium transition-colors duration-stage-fast ease-stage-standard ${
        selected
          ? "border-stage-primary bg-stage-primary text-stage-fg-on-dark"
          : "border-stage-border bg-stage-bg text-stage-fg-body hover:border-stage-border-strong hover:bg-stage-bg-soft"
      }`}
    >
      {children}
      {count !== undefined ? (
        <span className="ml-0.5 font-stage-mono text-[11px] opacity-75">
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * One prompt card.
 *
 * The export's card: 18px padding, a 15px prompt, a 13px gloss and a blue
 * 选择此题 → at the foot. The gloss line is omitted entirely when the corpus has
 * none — 306 of 324 prompts have no gloss, and a placeholder on all of them
 * would be 306 lines saying nothing.
 *
 * A Part 2 card carries its `You should say:` bullets, because a cue card
 * *is* the prompt: choosing one without seeing them is choosing blind.
 */
function QuestionCard({
  question,
  state,
}: {
  question: SpeakingQuestion;
  state: SpeakingQuestionState | null;
}) {
  const band = speakingFrequency(question.recallCount);
  const started = hasMaterial(state);

  return (
    <li className="relative grid content-start gap-1.5 rounded-stage-lg border border-stage-border bg-stage-bg p-[18px] transition-[border-color,box-shadow] duration-stage-base ease-stage-standard hover:border-stage-border-strong hover:shadow-stage-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* No band for a prompt with no recall data: the corpus does not say
            it is infrequent, only that it never came from a recall. */}
        {band ? (
          <Badge tone={band === "high" ? "accent" : "neutral"}>
            {SPEAKING_FREQUENCY_LABELS[band]}
          </Badge>
        ) : null}
        <Badge tone="neutral">
          {question.topicLabelEn} {question.topicLabelZh}
        </Badge>
      </div>

      <span className="text-stage-sm font-semibold leading-[1.5] text-stage-fg">
        {question.textEn}
      </span>
      {question.glossZh ? (
        <span className="text-stage-xs text-stage-fg-subtle">
          {question.glossZh}
        </span>
      ) : null}

      {question.cuePoints.length > 0 ? (
        <ul className="mt-1 grid gap-1 rounded-stage-md border border-stage-border bg-stage-bg-soft px-3 py-2.5">
          <li className="text-stage-2xs font-medium text-stage-fg-muted">
            You should say:
          </li>
          {question.cuePoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-stage-xs text-stage-fg-body"
            >
              <span
                aria-hidden
                className="mt-2 inline-block h-1 w-1 flex-none rounded-stage-pill bg-stage-border-strong"
              />
              {point}
            </li>
          ))}
        </ul>
      ) : null}

      {started ? (
        <span className="mt-1 text-stage-2xs text-stage-fg-subtle">
          已有素材 · 想法 {state?.fragments.length ?? 0} 条
        </span>
      ) : null}

      {/* The stretched link makes the whole card the target; it is the only
          interactive element in the card, so nothing sits under it. */}
      <Link
        href={`/ielts-lab/speaking/${question.id}`}
        className="mt-1 text-stage-xs font-semibold text-stage-primary after:absolute after:inset-0 after:content-['']"
      >
        {started ? "继续构建 →" : "选择此题 →"}
        <span className="sr-only">：{question.textEn}</span>
      </Link>
    </li>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
}) {
  const control =
    "rounded-stage-sm border border-stage-border px-3 py-1.5 text-stage-2xs transition-colors duration-stage-fast disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="题目分页"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${control} text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg`}
      >
        Previous
      </button>
      {Array.from({ length: pageCount }, (_item, index) => index + 1).map(
        (number) => (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            aria-current={number === page ? "page" : undefined}
            className={`${control} tabular-nums ${
              number === page
                ? "border-stage-primary bg-stage-primary font-medium text-stage-fg-on-dark"
                : "text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg"
            }`}
          >
            {number}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className={`${control} text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg`}
      >
        Next
      </button>
    </nav>
  );
}

/**
 * The settings corner.
 *
 * Export writes every question's material into one file; import merges it back,
 * newer side winning per question. The export puts these two as icon buttons in
 * the page header; they stay a closed `<details>` at the foot here, because the
 * Lab's icon set has no download or upload glyph and adding one is a change to a
 * shared file this work is not allowed to make.
 */
function MaterialCorner({
  states,
  onChange,
}: {
  states: Map<string, SpeakingQuestionState>;
  onChange: (next: SpeakingQuestionState[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const all = [...states.values()];
  const material = all.filter((state) => hasMaterial(state));

  async function handleImport(file: File) {
    try {
      const imported = parseImport(await file.text());
      const merged = mergeStates(all, imported);
      replaceSpeakingStates(merged.states);
      onChange(merged.states);
      setNotice(
        merged.added === 0 && merged.updated === 0
          ? "文件中的素材都已存在，未做改动。"
          : `已导入 ${merged.added} 道新题目的素材，更新 ${merged.updated} 道。`,
      );
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "导入失败。");
    }
  }

  return (
    <details className="rounded-stage-lg border border-stage-border bg-stage-bg-soft px-4 py-3">
      <summary className="cursor-pointer text-stage-2xs text-stage-fg-muted marker:text-stage-fg-subtle">
        素材管理
      </summary>

      <p className="mt-3 text-stage-2xs text-stage-fg-subtle">
        口语素材只保存在本机浏览器。导出一份 JSON 可以备份，或迁移到另一台设备；
        导入时同一道题目以更新时间较晚的一份为准。
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={material.length === 0}
          onClick={() => downloadFile(exportFilename(), toJson(material))}
          className={BUTTON_SECONDARY}
        >
          导出素材
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={BUTTON_SECONDARY}
        >
          导入素材
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Reset first, so picking the same file twice still fires a change
            // event and a failed import can be retried.
            event.target.value = "";
            if (file) void handleImport(file);
          }}
        />
        {material.length > 0 ? (
          <ConfirmButton
            label="清空全部素材"
            question="清空全部口语素材？此操作无法撤销。"
            onConfirm={() => {
              clearAllSpeaking();
              onChange([]);
              setNotice("已清空全部口语素材。");
            }}
          />
        ) : null}
        <span className="text-stage-2xs tabular-nums text-stage-fg-subtle">
          {material.length} 道题目有素材
        </span>
      </div>

      {notice ? (
        <p
          role="status"
          className="mt-3 rounded-stage-sm border border-stage-border bg-stage-bg px-3 py-2 text-stage-2xs text-stage-fg-body"
        >
          {notice}
        </p>
      ) : null}
    </details>
  );
}
