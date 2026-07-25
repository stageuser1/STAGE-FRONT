"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CATEGORIES,
  FREQUENCY_LABELS,
  countByCategory,
  filterExams,
} from "@/lib/ielts/catalog";
import type { ExamCategory, ExamFrequency, ExamSummary } from "@/lib/ielts/types";

const FREQUENCIES: ExamFrequency[] = ["high", "medium", "low"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-stage-primary bg-stage-primary text-white"
          : "border-stage-border text-stage-fg-muted hover:border-stage-primary hover:text-stage-fg"
      }`}
    >
      {children}
    </button>
  );
}

export function ExamCatalog({ exams }: { exams: ExamSummary[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExamCategory | "all">("all");
  const [frequency, setFrequency] = useState<ExamFrequency | "all">("all");

  const counts = useMemo(() => countByCategory(exams), [exams]);
  const visible = useMemo(
    () => filterExams(exams, { search, category, frequency }),
    [exams, search, category, frequency],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">雅思实验室 · 阅读题库</h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          共 {exams.length} 篇 · P1 {counts.P1} · P2 {counts.P2} · P3 {counts.P3}
        </p>
      </header>

      <div className="mb-6 space-y-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索标题…"
          aria-label="搜索题目标题"
          className="w-full rounded-stage-md border border-stage-border bg-stage-bg px-4 py-2 text-sm outline-none focus:border-stage-primary"
        />

        <div className="flex flex-wrap gap-2">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            全部
          </Chip>
          {CATEGORIES.map((value) => (
            <Chip
              key={value}
              active={category === value}
              onClick={() => setCategory(value)}
            >
              {value}
            </Chip>
          ))}
          <span className="mx-1 w-px bg-stage-border" aria-hidden />
          <Chip active={frequency === "all"} onClick={() => setFrequency("all")}>
            不限频次
          </Chip>
          {FREQUENCIES.map((value) => (
            <Chip
              key={value}
              active={frequency === value}
              onClick={() => setFrequency(value)}
            >
              {FREQUENCY_LABELS[value]}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-stage-fg-muted">
        匹配 {visible.length} 篇
      </p>

      {visible.length === 0 ? (
        <p className="rounded-stage-md border border-stage-border px-4 py-8 text-center text-sm text-stage-fg-muted">
          没有符合条件的文章，试试调整筛选条件。
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((exam) => (
            <li key={exam.id}>
              {exam.interactive ? (
                <Link
                  href={`/ielts-lab/practice/${exam.id}`}
                  className="block h-full rounded-stage-md border border-stage-border p-4 transition-colors hover:border-stage-primary"
                >
                  <ExamCardBody exam={exam} />
                </Link>
              ) : (
                <div className="h-full rounded-stage-md border border-dashed border-stage-border p-4 opacity-60">
                  <ExamCardBody exam={exam} />
                  <p className="mt-2 text-xs text-stage-fg-muted">
                    暂无交互版本
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExamCardBody({ exam }: { exam: ExamSummary }) {
  return (
    <>
      <div className="mb-1 flex items-center gap-2 text-xs text-stage-fg-muted">
        <span className="rounded bg-stage-bg-soft px-1.5 py-0.5 font-medium">
          {exam.category}
        </span>
        <span>{FREQUENCY_LABELS[exam.frequency]}</span>
        {exam.hasExplanation && <span>· 含解析</span>}
      </div>
      <p className="text-sm font-medium leading-snug">{exam.title}</p>
    </>
  );
}
