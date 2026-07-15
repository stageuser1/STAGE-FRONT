"use client";

import Link from "next/link";
import { useReviewerAuth } from "@/lib/directus-auth";

export function ReviewerSessionBar() {
  const { isReviewer, logout, user } = useReviewerAuth();
  if (!isReviewer || !user) return null;

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
