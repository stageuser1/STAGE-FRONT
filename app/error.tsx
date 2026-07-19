"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Route-level error boundary: an honest retryable failure card —
 * never a blank page, never stale data presented as fresh.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-line bg-white px-5 py-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <Icon name="alert" size={24} />
        </div>
        <h1 className="text-base font-semibold text-ink-900">加载失败</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
          数据加载出现问题，请重试；若持续失败，可能是数据服务暂时不可用。
        </p>
        <button
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          onClick={() => reset()}
          type="button"
        >
          重试
        </button>
        <div className="mt-4">
          <button
            className="text-xs font-medium text-ink-400 underline-offset-2 hover:underline"
            onClick={() => setShowDetail((current) => !current)}
            type="button"
          >
            {showDetail ? "收起详情" : "查看详情"}
          </button>
          {showDetail ? (
            <p className="mx-auto mt-2 max-w-sm break-words rounded-lg bg-ink-50 px-3 py-2 text-left text-xs leading-5 text-ink-500">
              {error.message}
              {error.digest ? ` (digest: ${error.digest})` : null}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
