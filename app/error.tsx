"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Route-level error boundary: an honest retryable failure card —
 * never a blank page, never stale data presented as fresh.
 *
 * The card is deliberately incurious: the copy is the same sentence for
 * every failure, and the only failure-specific thing on screen is the
 * digest, an opaque hash the user can quote to support. Messages and
 * stacks describe our internals, so they go to the console (and from
 * there to monitoring) rather than to the reader.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[stage-front] route error boundary", error);
  }, [error]);

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
        {error.digest ? (
          <p className="mt-4 text-xs leading-5 text-ink-400">
            参考编号 <span className="font-mono">{error.digest}</span>
            <br />
            如需协助，请在联系我们时附上此编号。
          </p>
        ) : null}
      </div>
    </main>
  );
}
