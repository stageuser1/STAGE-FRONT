"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ExploreProgram } from "@/lib/explore/types";
import { READINESS_ALGORITHM_VERSION } from "@/lib/fit/dimensions";
import { summariseSchoolFit } from "@/lib/fit/school-fit";
import { loadProfile } from "@/lib/profile/storage";
import type { ProfileV2 } from "@/lib/profile/types";

/**
 * School-level fit snapshot (P-02).
 *
 * Renders in the no-profile state as the same strip with "—" counts and a
 * build-profile CTA. The visible hole is the invitation: hiding the strip
 * entirely would hide the fact that this comparison exists at all.
 */
export function SchoolFitStrip({
  programs,
  schoolName,
}: {
  programs: ExploreProgram[];
  schoolName: string;
}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileV2 | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  if (programs.length === 0) return null;

  const summary = summariseSchoolFit(programs, profile);
  const cell = (label: string, value: string, tone = "text-ink-900") => (
    <div className="rounded-lg bg-ink-50 px-3 py-2.5" key={label}>
      <p className="text-xs leading-4 text-ink-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold leading-6 tabular-nums ${tone}`}>
        {value}
      </p>
    </div>
  );

  return (
    <section
      aria-label="与你的匹配"
      className="rounded-xl border border-line bg-white p-4 shadow-card md:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-6 text-ink-900">
            与你的匹配
          </h2>
          <p className="text-xs leading-4 text-ink-400">
            Fit across {programs.length} programs
          </p>
        </div>
      </div>

      {!ready ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <div className="h-16 animate-pulse rounded-lg bg-ink-50" key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {cell(
              "可申请",
              profile ? String(summary.eligible) : "—",
              "text-emerald-700",
            )}
            {cell("有差距", profile ? String(summary.gap) : "—", "text-amber-700")}
            {cell("待确认", profile ? String(summary.unknown) : "—")}
            {cell(
              "最低语言要求",
              summary.minIelts !== null ? `IELTS ${summary.minIelts.toFixed(1)}` : "暂未收录",
            )}
          </div>

          <p className="mt-2.5 text-xs leading-5 text-ink-500">
            {profile
              ? `按你的档案比对 ${schoolName} 已收录的 ${programs.length} 个项目的语言、截止与预算要求。各项目的完整要求以项目页为准 · ${READINESS_ALGORITHM_VERSION}`
              : "建立档案后，这里会显示这所学校有多少项目适合你、差在哪里。"}
          </p>

          {!profile ? (
            <Link
              className="mt-3 inline-flex h-10 items-center rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-700"
              href={`/profile?return=${encodeURIComponent(pathname ?? "/schools")}`}
            >
              2 分钟建立档案
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
