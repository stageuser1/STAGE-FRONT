"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PublicProgramDto } from "@/data/types";
import { DeadlineChip } from "@/components/ui/DeadlineChip";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  READINESS_ALGORITHM_VERSION,
  READINESS_RULE_SENTENCE,
  scoreDimensions,
} from "@/lib/fit/dimensions";
import {
  buildRequirementChecklist,
  ieltsGap,
  overallState,
  programLastChecked,
  programTuition,
} from "@/lib/fit/requirements";
import { loadProfile } from "@/lib/profile/storage";
import type { ProfileV2 } from "@/lib/profile/types";
import {
  isSaved,
  refreshSnapshot,
  saveProgram,
  unsaveProgram,
} from "@/lib/profile/saved";
import { BandGapMeter } from "./BandGapMeter";
import { RequirementRow } from "./RequirementRow";

/**
 * The program-page decision strip (C-02).
 *
 * Renders in full for anonymous visitors: every requirement the school states
 * is public and shows regardless. Only the COMPARISON needs a profile, and its
 * absence is an invitation rather than a wall — discovery is never gated.
 */
export function FitPanel({ program }: { program: PublicProgramDto }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileV2 | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  const snapshot = useMemo(
    () => ({
      programName: program.name,
      programNameZh: program.name_zh ?? null,
      schoolName: program.school_name,
      degreeLabel: program.degree?.name_zh ?? program.degree?.name ?? null,
      country: program.country,
      city: program.city,
      applicationDeadline: program.deadline.application_deadline,
      prescreeningDeadline: program.deadline.prescreening_deadline,
      auditionDate: program.deadline.audition_date,
      ieltsMinimum:
        program.language_requirements.accepted_tests.find(
          (test) => test.test_name === "IELTS",
        )?.minimum_score ?? null,
      tuitionAnnual: programTuition(program).amount,
      tuitionCurrency: programTuition(program).currency,
      lastCheckedAt: programLastChecked(program),
      workflowStatus: program.data_quality.status,
    }),
    [program],
  );

  useEffect(() => {
    setProfile(loadProfile());
    const alreadySaved = isSaved(program.id);
    setSaved(alreadySaved);
    // Visiting the page is how a saved snapshot stays fresh — but it must
    // never add the program to the shortlist by itself.
    if (alreadySaved) refreshSnapshot(program.id, snapshot);
    setReady(true);
  }, [program.id, snapshot]);

  // Cross-tab and cross-surface: editing the profile elsewhere updates here.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "stage.profile") setProfile(loadProfile());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const checklist = useMemo(
    () => buildRequirementChecklist(program, profile),
    [program, profile],
  );
  const dimensions = useMemo(
    () => scoreDimensions(program, profile, checklist),
    [program, profile, checklist],
  );
  const gap = useMemo(() => ieltsGap(program, profile), [program, profile]);
  const verdict = overallState(checklist);

  const profileHref = `/profile?return=${encodeURIComponent(pathname ?? "/schools")}`;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-line bg-white p-4 shadow-card md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-900">
              与你的匹配
            </h2>
            <p className="text-xs text-ink-400">Fit</p>
          </div>
          <StatusChip state={verdict} />
        </div>

        {!ready ? (
          <div className="mt-4 space-y-2" aria-busy="true">
            <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-ink-100" />
            <div className="h-12 animate-pulse rounded-lg bg-ink-50" />
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs leading-5 text-ink-500" aria-live="polite">
              {profile
                ? verdict === "gap"
                  ? "有要求尚未满足，展开下面的清单查看具体差距。"
                  : verdict === "unknown"
                    ? "部分要求尚未收录，结论可能变化。"
                    : "已收录的要求你都满足。"
                : "建立档案后，这里会显示你与该项目每一项要求的差距。"}
            </p>

            <dl className="mt-3 divide-y divide-line-subtle">
              {dimensions.map((dimension) => (
                <details className="group" key={dimension.key}>
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-1.5 [&::-webkit-details-marker]:hidden">
                    <dt className="text-sm text-ink-700">{dimension.label}</dt>
                    <dd className="flex items-center gap-2">
                      {dimension.score === null ? (
                        <span className="text-xs text-ink-400">待确认</span>
                      ) : (
                        <span
                          aria-hidden
                          className="flex h-1.5 w-16 overflow-hidden rounded-full bg-ink-100"
                        >
                          <span
                            className={`h-full rounded-full transition-[width] ${
                              dimension.score >= 0.99
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.round(dimension.score * 100)}%` }}
                          />
                        </span>
                      )}
                      <Icon
                        className="text-ink-400 transition-transform group-open:rotate-180"
                        name="chevron-down"
                        size={14}
                      />
                    </dd>
                  </summary>
                  <p className="pb-2 text-xs leading-5 text-ink-500">
                    {dimension.detail}
                    {dimension.missingProfileStep ? (
                      <>
                        {" "}
                        <Link
                          className="font-medium text-brand-600 underline-offset-2 hover:underline"
                          href={profileHref}
                        >
                          补全档案 →
                        </Link>
                      </>
                    ) : null}
                  </p>
                </details>
              ))}
            </dl>

            <div className="mt-4 border-t border-line-subtle pt-3">
              <BandGapMeter
                ctaHref={`/ielts-lab/suite?from=program:${program.id}`}
                gap={gap}
                profileHref={profileHref}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line-subtle pt-3">
              <DeadlineChip
                date={program.deadline.application_deadline}
                label="申请截止"
              />
              {program.deadline.prescreening_deadline ? (
                <DeadlineChip
                  date={program.deadline.prescreening_deadline}
                  label="预筛选截止"
                />
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (saved) {
                    unsaveProgram(program.id);
                    setSaved(false);
                  } else {
                    saveProgram(program.id, program.school_name, snapshot);
                    setSaved(true);
                  }
                }}
                className={
                  saved
                    ? "inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300"
                    : "inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-700"
                }
              >
                <Icon name={saved ? "check" : "bookmark"} size={16} />
                {saved ? "已加入我的清单" : "加入我的清单"}
              </button>
              {!profile ? (
                <Link
                  className="inline-flex h-10 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300"
                  href={profileHref}
                >
                  2 分钟建立档案
                </Link>
              ) : null}
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer list-none text-xs text-ink-400 underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
                这些结论怎么来的？· {READINESS_ALGORITHM_VERSION} ▾
              </summary>
              <p className="mt-1.5 text-xs leading-5 text-ink-500">
                {READINESS_RULE_SENTENCE}
              </p>
            </details>
          </>
        )}
      </section>

      <section
        className="rounded-xl border border-line bg-white p-4 shadow-card md:p-5"
        id="requirement-checklist"
      >
        <div className="mb-2">
          <h2 className="text-base font-semibold text-ink-900">申请清单</h2>
          <p className="text-xs text-ink-400">Requirement Checklist</p>
        </div>
        <div>
          {checklist.map((item) => (
            <RequirementRow
              item={item}
              key={item.key}
              status={program.data_quality.status}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
