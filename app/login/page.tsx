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
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center bg-gray-50 px-4 py-10">
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase text-blue-700">STAGE</p>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">
          Reviewer login
        </h1>

        {isLoading ? (
          <p className="mt-4 text-sm text-gray-600">Checking session…</p>
        ) : isReviewer && user ? (
          <div className="mt-4">
            <p className="text-sm text-gray-700">Logged in as {user.email}</p>
            <div className="mt-4 flex gap-3">
              <Link
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                href={returnTo}
              >
                Continue
              </Link>
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                onClick={() => void logout()}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Logging in…" : "Login"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
