"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearRecords, computeStats, loadRecords } from "@/lib/ielts/storage";
import type { PracticeRecord } from "@/lib/ielts/types";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN");
}

export function PracticeHistory() {
  // Records live in localStorage, so they can only be read after mount.
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  if (records === null) {
    return (
      <p className="px-4 py-8 text-sm text-stage-fg-muted">加载练习记录…</p>
    );
  }

  const stats = computeStats(records);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">练习记录</h1>
          <p className="mt-1 text-sm text-stage-fg-muted">
            记录保存在本机浏览器中
          </p>
        </div>
        <Link
          href="/ielts-lab"
          className="text-sm text-stage-fg-muted transition-colors hover:text-stage-fg"
        >
          ← 返回题库
        </Link>
      </header>

      {records.length === 0 ? (
        <p className="rounded-stage-md border border-stage-border px-4 py-8 text-center text-sm text-stage-fg-muted">
          还没有练习记录。完成一篇阅读后会自动保存。
        </p>
      ) : (
        <>
          <dl className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat label="练习次数" value={String(stats.totalPractices)} />
            <Stat
              label="平均正确率"
              value={`${Math.round(stats.averageAccuracy * 100)}%`}
            />
            <Stat
              label="累计用时"
              value={`${Math.round(stats.totalTimeSeconds / 60)} 分钟`}
            />
          </dl>

          <ul className="space-y-2">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-stage-md border border-stage-border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{record.title}</p>
                  <p className="text-xs text-stage-fg-muted">
                    {record.category} · {formatDate(record.createdAt)} ·{" "}
                    {formatDuration(record.duration)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-stage-primary">
                  {record.correctAnswers}/{record.totalQuestions} ·{" "}
                  {Math.round(record.accuracy * 100)}%
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              if (!window.confirm("确定要清空全部练习记录吗？此操作无法撤销。")) return;
              clearRecords();
              setRecords([]);
            }}
            className="mt-6 rounded-stage-md border border-stage-border px-3 py-1.5 text-sm text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg"
          >
            清空记录
          </button>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-stage-md border border-stage-border px-4 py-3">
      <dt className="text-xs text-stage-fg-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
    </div>
  );
}
