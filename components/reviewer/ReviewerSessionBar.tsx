"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReviewerAuth } from "@/lib/directus-auth";

/**
 * Reviewer-mode frame: nothing renders for public visitors (the login
 * entry lives in the header and the 我的 nav item). When a reviewer is
 * authenticated, a brand top rule plus a labeled session bar make the
 * mode unmistakable on every page.
 */
export function ReviewerSessionBar() {
  const pathname = usePathname();
  const { isLoading, isReviewer, logout, user } = useReviewerAuth();
  if (isLoading || pathname === "/login" || !isReviewer || !user) return null;

  return (
    <div className="sticky top-0 z-20 border-b border-brand-100 bg-brand-50">
      <div className="h-0.5 bg-brand-600" />
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-1.5 text-xs md:max-w-3xl md:px-6 lg:max-w-5xl">
        <Link
          className="flex min-w-0 items-center gap-2 font-semibold text-brand-700"
          href="/login"
        >
          <span className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-brand-600 px-2 text-[11px] font-semibold text-white">
            审核模式
          </span>
          <span className="truncate font-medium text-brand-700/80">
            {user.email}
          </span>
        </Link>
        <button
          className="shrink-0 font-semibold text-brand-700 underline-offset-2 hover:underline"
          onClick={() => void logout()}
          type="button"
        >
          退出
        </button>
      </div>
    </div>
  );
}
