"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { DegreeLevel } from "@/data/types";
import {
  loadProfileResult,
  saveProfile,
} from "@/lib/profile/storage";
import {
  BUDGET_CEILING_USD,
  BUDGET_LABELS,
  GPA_LABELS,
  PROFILE_STEPS,
  STEP_HINTS,
  STEP_TITLES,
  createEmptyProfile,
  type BudgetBand,
  type EnglishTest,
  type GpaBand,
  type ProfileStepId,
  type ProfileV1,
} from "@/lib/profile/types";
import { BandStepper, ChipGroup, ProfileStep } from "./ProfileStep";

export interface ProfileOptions {
  fields: Array<{ value: string; label: string }>;
  countries: Array<{ value: string; label: string }>;
  degrees: Array<{ value: string; label: string }>;
}

const ENTRY_TERMS = [
  { value: "2027-fall", label: "2027 秋季" },
  { value: "2028-fall", label: "2028 秋季" },
  { value: "undecided", label: "还没定" },
];

const CURRENT_LEVELS: Array<{ value: DegreeLevel; label: string }> = [
  { value: "bachelor", label: "本科在读 / 已毕业" },
  { value: "master", label: "硕士在读 / 已毕业" },
  { value: "diploma", label: "文凭课程" },
  { value: "certificate", label: "其他" },
];

const ENGLISH_TESTS: Array<{ value: EnglishTest; label: string }> = [
  { value: "IELTS", label: "雅思 IELTS" },
  { value: "TOEFL", label: "托福 TOEFL" },
  { value: "Duolingo", label: "多邻国 Duolingo" },
  { value: "none", label: "还没考" },
];

function timeLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * The five-step progressive profile (P-04).
 *
 * Autosaves on every change, on tab-hide and on unload — the C1 draft contract
 * applied to profiling. There is deliberately no network call anywhere in this
 * component: the profile lives in this browser and the UI says so.
 */
export function ProfileFlow({ options }: { options: ProfileOptions }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = searchParams.get("return");
  const prefillBand = searchParams.get("prefillBand");

  const [profile, setProfile] = useState<ProfileV1 | null>(null);
  const [loadState, setLoadState] = useState<
    "loading" | "ok" | "future" | "unmigratable"
  >("loading");
  const [rawBackup, setRawBackup] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [finished, setFinished] = useState(false);

  // Kept in a ref so the visibility/unload flush always writes the newest
  // value without re-registering the listener on every keystroke.
  const latest = useRef<ProfileV1 | null>(null);

  useEffect(() => {
    const result = loadProfileResult();
    if (result.status === "future") {
      setLoadState("future");
      return;
    }
    if (result.status === "unmigratable") {
      setRawBackup(result.raw);
      setLoadState("unmigratable");
      return;
    }

    const existing =
      result.status === "ok" ? result.profile : createEmptyProfile();
    // A band handed over from the suite result prefills step ⑤ but is still
    // editable and still skippable — it is a suggestion, not a decision.
    if (prefillBand && result.status !== "ok") {
      const band = Number(prefillBand);
      if (Number.isFinite(band)) {
        existing.english.currentOverall = band;
        existing.english.currentSource = "lab_estimate";
      }
    }
    setProfile(existing);
    latest.current = existing;
    setLoadState("ok");

    // Resume where the learner stopped rather than restarting the interview.
    const firstPristine = PROFILE_STEPS.findIndex(
      (step) => existing.steps[step] === "pristine",
    );
    setStepIndex(firstPristine === -1 ? 0 : firstPristine);
  }, [prefillBand]);

  const commit = useCallback((next: ProfileV1) => {
    latest.current = next;
    setProfile(next);
    const ok = saveProfile(next);
    setSaveFailed(!ok);
    if (ok) setSavedAt(timeLabel(new Date().toISOString()));
  }, []);

  // Flush on tab-hide and unload: a learner who closes the tab mid-step has
  // still answered the question.
  useEffect(() => {
    const flush = () => {
      if (latest.current) saveProfile(latest.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  const update = useCallback(
    (patch: (current: ProfileV1) => ProfileV1) => {
      const current = latest.current;
      if (!current) return;
      commit(patch(current));
    },
    [commit],
  );

  const stepId: ProfileStepId = PROFILE_STEPS[stepIndex];

  const markAndAdvance = useCallback(
    (state: "answered" | "skipped") => {
      update((current) => ({
        ...current,
        steps: { ...current.steps, [stepId]: state },
      }));
      if (stepIndex + 1 >= PROFILE_STEPS.length) {
        setFinished(true);
        if (returnPath) router.replace(returnPath);
        return;
      }
      setStepIndex(stepIndex + 1);
    },
    [update, stepId, stepIndex, returnPath, router],
  );

  const states = useMemo(
    () => PROFILE_STEPS.map((step) => profile?.steps[step] ?? "pristine"),
    [profile],
  );

  if (loadState === "loading") {
    return (
      <div className="mx-auto w-full max-w-xl" aria-busy="true">
        <div className="h-64 animate-pulse rounded-stage-md bg-stage-bg-soft" />
      </div>
    );
  }

  if (loadState === "future") {
    return (
      <Notice
        title="档案由更新版本创建"
        body="这份档案是由更新版本的 STAGE 保存的，为避免丢失内容，这里不会修改它。请刷新页面或更新到最新版本。"
      />
    );
  }

  if (loadState === "unmigratable") {
    return (
      <Notice
        title="档案格式无法读取"
        body="本机保存的档案无法解析。你可以先下载备份，再重新填写。"
        action={
          <div className="flex flex-wrap gap-2">
            {rawBackup ? (
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([rawBackup], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "stage-profile-backup.json";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded-stage-md border border-stage-border px-4 py-2 text-sm"
              >
                下载旧档案
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const fresh = createEmptyProfile();
                commit(fresh);
                setLoadState("ok");
                setStepIndex(0);
              }}
              className="rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark"
            >
              重新填写
            </button>
          </div>
        }
      />
    );
  }

  if (!profile) return null;

  if (finished && !returnPath) {
    return (
      <Notice
        title="档案已保存"
        body="你的档案保存在本机浏览器，未上传到任何服务器。现在可以去看看哪些项目适合你。"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark"
            >
              去学习中心
            </Link>
            <Link
              href="/schools"
              className="rounded-stage-md border border-stage-border px-4 py-2 text-sm"
            >
              浏览院校
            </Link>
            <button
              type="button"
              onClick={() => {
                setFinished(false);
                setStepIndex(0);
              }}
              className="rounded-stage-md border border-stage-border px-4 py-2 text-sm"
            >
              继续修改
            </button>
          </div>
        }
      />
    );
  }

  return (
    <ProfileStep
      hint={STEP_HINTS[stepId]}
      index={stepIndex + 1}
      isLast={stepIndex + 1 === PROFILE_STEPS.length}
      onBack={stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined}
      onNext={() => markAndAdvance("answered")}
      onSkip={() => markAndAdvance("skipped")}
      saveFailed={saveFailed}
      savedAt={savedAt}
      states={states}
      stepId={stepId}
      title={STEP_TITLES[stepId]}
      total={PROFILE_STEPS.length}
    >
      {stepId === "discipline" ? (
        <div className="space-y-5">
          <ChipGroup
            label="专业方向"
            onToggle={(value) =>
              update((current) => ({
                ...current,
                discipline: {
                  ...current.discipline,
                  fieldSlugs: current.discipline.fieldSlugs.includes(value)
                    ? current.discipline.fieldSlugs.filter((v) => v !== value)
                    : [...current.discipline.fieldSlugs, value],
                },
              }))
            }
            options={options.fields}
            selected={profile.discipline.fieldSlugs}
          />
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-stage-fg-muted">
              主修乐器 / 方向（选填）
            </span>
            <input
              type="text"
              value={profile.discipline.instrument ?? ""}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  discipline: {
                    ...current.discipline,
                    instrument: event.target.value || null,
                  },
                }))
              }
              placeholder="例如 小提琴"
              className="w-full rounded-stage-md border border-stage-border bg-stage-bg px-3 py-2 text-sm outline-none focus:border-stage-primary"
            />
          </label>
        </div>
      ) : null}

      {stepId === "target" ? (
        <div className="space-y-5">
          <ChipGroup
            label="目标学位"
            onToggle={(value) =>
              update((current) => ({
                ...current,
                target: {
                  ...current.target,
                  degreeSlugs: current.target.degreeSlugs.includes(value)
                    ? current.target.degreeSlugs.filter((v) => v !== value)
                    : [...current.target.degreeSlugs, value],
                },
              }))
            }
            options={options.degrees}
            selected={profile.target.degreeSlugs}
          />
          <ChipGroup
            label="入学学期"
            multi={false}
            onToggle={(value) =>
              update((current) => ({
                ...current,
                target: {
                  ...current.target,
                  entryTerm:
                    current.target.entryTerm === value ? null : value,
                },
              }))
            }
            options={ENTRY_TERMS}
            selected={profile.target.entryTerm ? [profile.target.entryTerm] : []}
          />
        </div>
      ) : null}

      {stepId === "geography" ? (
        <div className="space-y-5">
          <ChipGroup
            label="目标国家 / 地区"
            onToggle={(value) =>
              update((current) => ({
                ...current,
                geography: {
                  ...current.geography,
                  countries: current.geography.countries.includes(value)
                    ? current.geography.countries.filter((v) => v !== value)
                    : [...current.geography.countries, value],
                },
              }))
            }
            options={options.countries}
            selected={profile.geography.countries}
          />
          <ChipGroup
            columns
            label="每年学费预算"
            multi={false}
            onToggle={(value) =>
              update((current) => {
                const band =
                  current.geography.budgetBand === value
                    ? null
                    : (value as BudgetBand);
                return {
                  ...current,
                  geography: {
                    ...current.geography,
                    budgetBand: band,
                    budgetCeilingUsd: band ? BUDGET_CEILING_USD[band] : null,
                  },
                };
              })
            }
            options={(Object.keys(BUDGET_LABELS) as BudgetBand[]).map(
              (value) => ({ value, label: BUDGET_LABELS[value] }),
            )}
            selected={
              profile.geography.budgetBand ? [profile.geography.budgetBand] : []
            }
          />
        </div>
      ) : null}

      {stepId === "academic" ? (
        <div className="space-y-5">
          <ChipGroup
            columns
            label="目前学历"
            multi={false}
            onToggle={(value) =>
              update((current) => ({
                ...current,
                academic: {
                  ...current.academic,
                  currentLevel:
                    current.academic.currentLevel === value
                      ? null
                      : (value as DegreeLevel),
                },
              }))
            }
            options={CURRENT_LEVELS}
            selected={
              profile.academic.currentLevel ? [profile.academic.currentLevel] : []
            }
          />
          <ChipGroup
            columns
            label="GPA 区间"
            multi={false}
            onToggle={(value) =>
              update((current) => ({
                ...current,
                academic: {
                  ...current.academic,
                  gpaBand:
                    current.academic.gpaBand === value
                      ? null
                      : (value as GpaBand),
                },
              }))
            }
            options={(Object.keys(GPA_LABELS) as GpaBand[]).map((value) => ({
              value,
              label: GPA_LABELS[value],
            }))}
            selected={profile.academic.gpaBand ? [profile.academic.gpaBand] : []}
          />
        </div>
      ) : null}

      {stepId === "english" ? (
        <div className="space-y-5">
          <ChipGroup
            label="考试情况"
            multi={false}
            onToggle={(value) =>
              update((current) => ({
                ...current,
                english: {
                  ...current.english,
                  test:
                    current.english.test === value
                      ? null
                      : (value as EnglishTest),
                  hasScore: value === "none" ? false : true,
                },
              }))
            }
            options={ENGLISH_TESTS}
            selected={profile.english.test ? [profile.english.test] : []}
          />

          {profile.english.test && profile.english.test !== "none" ? (
            <BandStepper
              label="当前总分"
              onChange={(next) =>
                update((current) => ({
                  ...current,
                  english: {
                    ...current.english,
                    currentOverall: next,
                    // A number the learner typed is theirs, not an estimate.
                    currentSource: next === null ? null : "self_reported",
                  },
                }))
              }
              value={profile.english.currentOverall}
            />
          ) : null}

          <BandStepper
            label="目标总分"
            onChange={(next) =>
              update((current) => ({
                ...current,
                english: { ...current.english, targetOverall: next },
              }))
            }
            value={profile.english.targetOverall}
          />

          {profile.english.labEstimate ? (
            <p className="rounded-stage-sm bg-stage-bg-soft px-3 py-2 text-xs text-stage-fg-muted">
              雅思实验室估算：{profile.english.labEstimate.band.toFixed(1)}
              （基于 {profile.english.labEstimate.recordCount} 次练习共{" "}
              {profile.english.labEstimate.questionCount} 题）· 估算仅供参考
            </p>
          ) : null}
        </div>
      ) : null}
    </ProfileStep>
  );
}

function Notice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-stage-md border border-stage-border bg-stage-bg p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-stage-fg-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
