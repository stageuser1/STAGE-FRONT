"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReviewerAuth } from "@/lib/directus-auth";

/**
 * Desktop header entry for the reviewer workflow: a quiet link when
 * logged out, a labeled session pill when the reviewer mode is active.
 */
export function ReviewerHeaderLink() {
  const pathname = usePathname() ?? "/";
  const { isLoading, isReviewer, user } = useReviewerAuth();
  if (isLoading) return null;

  if (isReviewer && user) {
    return (
      <Link
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
        href="/login"
        title={user.email}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        审核模式
      </Link>
    );
  }

  return (
    <Link
      className="text-xs font-medium text-ink-500 transition hover:text-brand-600"
      href={`/login?returnTo=${encodeURIComponent(pathname)}`}
    >
      审核入口
    </Link>
  );
}
