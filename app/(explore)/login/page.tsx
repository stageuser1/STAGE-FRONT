"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useReviewerAuth } from "@/lib/directus-auth";

function reviewerReturnPath(): string {
  if (typeof window === "undefined") return "/";
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  if (requested?.startsWith("/") && !requested.startsWith("//")) {
    return requested === "/login" ? "/" : requested;
  }
  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (
        referrer.origin === window.location.origin &&
        referrer.pathname !== "/login"
      ) {
        return `${referrer.pathname}${referrer.search}${referrer.hash}`;
      }
    } catch {
      // Ignore invalid or cross-origin referrers.
    }
  }
  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, isReviewer, login, logout, user } = useReviewerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [returnTo, setReturnTo] = useState("/");

  useEffect(() => {
    setReturnTo(reviewerReturnPath());
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(reviewerReturnPath());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center bg-page px-4 py-10">
      <section className="w-full rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
        <p className="text-[22px] font-extrabold leading-6 tracking-tight text-brand-600">
          STAGE
        </p>
        <h1 className="mt-2 text-xl font-semibold text-ink-900">
          审核员登录
          <span className="ml-2 text-xs font-normal text-ink-400">
            Reviewer Login
          </span>
        </h1>

        {isLoading ? (
          <p className="mt-4 text-sm text-ink-500">正在检查登录状态…</p>
        ) : isReviewer && user ? (
          <div className="mt-4">
            <p className="text-sm text-ink-700">
              已登录：<span className="font-medium">{user.email}</span>
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                className="flex h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                href={returnTo}
              >
                继续浏览
              </Link>
              <button
                className="flex h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                onClick={() => void logout()}
                type="button"
              >
                退出登录
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-[13px] font-medium leading-[18px] text-ink-700">
              邮箱
              <input
                autoComplete="email"
                className="mt-1.5 h-11 w-full rounded-xl border border-line px-3 text-[15px] text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block text-[13px] font-medium leading-[18px] text-ink-700">
              密码
              <input
                autoComplete="current-password"
                className="mt-1.5 h-11 w-full rounded-xl border border-line px-3 text-[15px] text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <button
              className="h-11 w-full rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "登录中…" : "登录"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
