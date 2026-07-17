"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReviewerAuth } from "@/lib/directus-auth";

export function ReviewerSessionBar() {
  const pathname = usePathname();
  const { isLoading, isReviewer, logout, user } = useReviewerAuth();
  if (isLoading || pathname === "/login") return null;

  if (!isReviewer || !user) {
    const returnTo = pathname || "/";
    return (
      <div className="border-b border-gray-200 bg-white text-gray-700">
        <div className="mx-auto flex w-full max-w-md justify-end px-4 py-2 text-xs">
          <Link
            className="font-semibold text-blue-700"
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Reviewer login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-blue-200 bg-blue-50 text-blue-900">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-2 text-xs">
        <Link className="truncate font-semibold" href="/login">
          Reviewer · {user.email}
        </Link>
        <button
          className="shrink-0 font-semibold underline-offset-2 hover:underline"
          onClick={() => void logout()}
          type="button"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
