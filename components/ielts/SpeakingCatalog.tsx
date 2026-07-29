"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  SPEAKING_PARTS,
  SPEAKING_PART_BLURB,
  SPEAKING_PART_LABELS,
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
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  Chip,
  ConfirmButton,
  EmptyNote,
  FIELD,
  PageHeader,
  Tabs,
  Tag,
} from "./ui";

/** `Tabs` keys are strings, so the part filter is keyed `p1`/`p2`/`p3`. */
type PartFilter = "all" | "p1" | "p2" | "p3";

const PART_OPTIONS: ReadonlyArray<{ value: PartFilter; label: string }> = [
  { value: "all", label: "全部" },
  ...SPEAKING_PARTS.map((part) => ({
    value: `p${part}` as PartFilter,
    label: SPEAKING_PART_LABELS[part],
  })),
];

function partOf(filter: PartFilter): SpeakingPart | null {
  return filter === "all" ? null : (Number(filter.slice(1)) as SpeakingPart);
}

const PAGE_SIZE = 20;

/**
 * 题目 — step one of the Speaking flow (master-spec 批次三 §1).
 *
 * A browsing surface over the static corpus, filtered by part and topic. The
 * row status is derived from local material only; there is no accuracy, no
 * score and nothing that ranks one learner's answer against anything.
 *
 * The export/import controls sit at the foot of the page rather than in the
 * header — §6 asks for them "在 Speaking 板块设置角落，低调呈现", and they are
 * maintenance, not the thing a learner came here to do.
 */
export function SpeakingCatalog({ topics }: { topics: SpeakingTopic[] }) {
  const [part, setPart] = useState<PartFilter>("all");
  const [topicId, setTopicId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // localStorage is unreadable until after mount, so status appears with its
  // data rather than flashing "未开始" on questions that have material.
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

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const wanted = partOf(part);
    return questions.filter((question) => {
      if (wanted !== null && question.part !== wanted) return false;
      if (topicId !== "all" && question.topicId !== topicId) return false;
      if (needle === "") return true;
      return (
        question.textEn.toLowerCase().includes(needle) ||
        question.topicLabelEn.toLowerCase().includes(needle) ||
        question.topicLabelZh.includes(needle)
      );
    });
  }, [questions, part, topicId, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamped rather than reset, so narrowing a filter lands on the last page
  // instead of silently throwing away the reading position.
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const withMaterial = useMemo(
    () => [...states.values()].filter((state) => hasMaterial(state)).length,
    [states],
  );

  return (
    <div>
      <PageHeader
        title="口语素材库"
        subtitle="按 Part 浏览题目，选一道走完五步流程。你写下的想法与草稿只保存在本机浏览器。"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Tabs
          value={part}
          onChange={(next) => {
            setPart(next);
            setPage(1);
          }}
          options={PART_OPTIONS}
          label="口语部分"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="搜索题目"
          aria-label="搜索题目"
          className={`w-full sm:w-64 ${FIELD}`}
        />
      </div>

      {partOf(part) !== null ? (
        <p className="mb-3 text-stage-2xs text-stage-fg-subtle">
          {SPEAKING_PART_LABELS[partOf(part)!]} ·{" "}
          {SPEAKING_PART_BLURB[partOf(part)!]}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip
          active={topicId === "all"}
          onClick={() => {
            setTopicId("all");
            setPage(1);
          }}
        >
          全部话题
        </Chip>
        {topics.map((topic) => (
          <Chip
            key={topic.id}
            active={topicId === topic.id}
            onClick={() => {
              setTopicId(topic.id);
              setPage(1);
            }}
          >
            {topic.labelZh}
          </Chip>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-stage-2xs text-stage-fg-subtle">
        <span className="tabular-nums">共 {filtered.length} 道题目</span>
        {withMaterial > 0 ? (
          <span className="tabular-nums">已有素材 {withMaterial} 道</span>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyNote>没有符合条件的题目。</EmptyNote>
      ) : (
        <ul className="divide-y divide-stage-border rounded-stage-lg border border-stage-border bg-stage-bg">
          {visible.map((question) => (
            <QuestionRow
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
 * One question row.
 *
 * The status line is the learner's own progress through the five steps, stated
 * in counts of what they wrote. `进入素材库` / `继续构建` are the entry words the
 * master spec fixes for this module (批次一 §4), so the row uses the same pair.
 */
function QuestionRow({
  question,
  state,
}: {
  question: SpeakingQuestion;
  state: SpeakingQuestionState | null;
}) {
  const fragments = state?.fragments.length ?? 0;
  const blocks = state?.draft.length ?? 0;
  const solos = state?.soloEvents.length ?? 0;

  const status =
    solos > 0
      ? `已完成独立表达 ${solos} 次`
      : blocks > 0
        ? `草稿 ${blocks} 段`
        : fragments > 0
          ? `想法 ${fragments} 条`
          : null;

  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-stage-xs text-stage-fg">{question.textEn}</p>
        {question.glossZh ? (
          <p className="mt-1 text-stage-2xs text-stage-fg-subtle">
            {question.glossZh}
          </p>
        ) : null}
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <Tag>{SPEAKING_PART_LABELS[question.part]}</Tag>
          <Tag>
            {question.topicLabelEn} {question.topicLabelZh}
          </Tag>
          {status ? (
            <span className="text-stage-2xs text-stage-fg-muted">{status}</span>
          ) : null}
        </p>
      </div>
      <Link
        href={`/ielts-lab/speaking/${question.id}`}
        className={fragments > 0 || blocks > 0 ? BUTTON_SECONDARY : BUTTON_PRIMARY}
      >
        {fragments > 0 || blocks > 0 ? "继续构建" : "进入素材库"}
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
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
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
 * The settings corner (批次三 §6).
 *
 * Export writes every question's material into one file; import merges it back,
 * newer side winning per question. Deliberately unobtrusive: a `<details>` that
 * starts closed, at the foot of the page.
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
    <details className="mt-8 rounded-stage-lg border border-stage-border bg-stage-bg-soft px-4 py-3">
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
