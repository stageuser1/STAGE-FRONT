import Link from "next/link";

import type { PilotProgramData } from "@/lib/pilot-data";
import { PilotReviewerPanel } from "./PilotReviewerPanel";

function numberValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dateLabel(value: string | null | undefined, includeYear = true): string | null {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(parsed);
}

function money(amount: number | null, currency: string | null): string | null {
  if (amount === null || !currency) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function Missing() {
  return <span aria-label="Missing value" data-missing="true">—</span>;
}

function DecisionAtom({
  label,
  value,
  subline,
  attention = false,
}: {
  label: string;
  value: React.ReactNode;
  subline?: React.ReactNode;
  attention?: boolean;
}) {
  const missing = value === null;
  return (
    <div className={`min-w-0 rounded-2xl border p-3.5 ${missing ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-950"}`}>
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {attention ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Being updated</span> : null}
      </div>
      <p className="mt-2 break-words text-sm font-semibold leading-5" data-testid={`decision-${label.toLowerCase()}`}>{missing ? <Missing /> : value}</p>
      {subline ? <p className="mt-1 text-xs leading-4 text-slate-500">{subline}</p> : null}
    </div>
  );
}

function Expandable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-slate-900">
        {title}
        <span aria-hidden="true" className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-700">{children}</div>
    </details>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2 last:border-0 sm:grid-cols-[11rem_1fr]">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="m-0 text-slate-900">{value ?? <Missing />}</dd>
    </div>
  );
}

export function PilotProgramView({ data }: { data: PilotProgramData }) {
  const { program, application, audition, sources } = data;
  const school = program.school_id;
  const city = school.city_ref;
  const country = city?.country_ref;
  const tuition = numberValue(application?.tuition_annual);
  const livingMonthly = numberValue(city?.living_cost_monthly_est);
  const tuitionCurrency = application?.tuition_currency ?? null;
  const livingCurrency = city?.living_cost_currency ?? tuitionCurrency;
  const canTotal = tuition !== null && livingMonthly !== null && tuitionCurrency === livingCurrency;
  const annualLiving = livingMonthly === null ? null : livingMonthly * 12;
  const annualTotal = canTotal ? tuition + annualLiving! : null;
  const duration = numberValue(program.duration_years);
  const fullTotal = annualTotal !== null && duration !== null ? annualTotal * duration : null;
  const costValue = annualTotal !== null
    ? `≈ ${money(annualTotal, tuitionCurrency)} /yr total`
    : tuition !== null
      ? `${money(tuition, tuitionCurrency)} /yr tuition`
      : null;
  const costSubline = annualTotal !== null
    ? `tuition ${money(tuition, tuitionCurrency)} + living est. ${money(annualLiving, livingCurrency)}`
    : application?.scholarships_available === "Yes"
      ? "Aid available"
      : undefined;
  const languageParts = [
    ...(program.language_of_instruction ?? []),
    ...(application?.toefl_minimum != null ? [`TOEFL ${application.toefl_minimum}`] : []),
    ...(application?.ielts_minimum != null ? [`IELTS ${application.ielts_minimum}`] : []),
  ];
  const deadlineMissing = application?.application_deadline == null;
  const tuitionMissing = application?.tuition_annual == null;
  const needsReview = application?.review_status === "Needs Review";
  const lastChecked = new Date(`${program.last_checked}T00:00:00Z`);
  const stale = !Number.isNaN(lastChecked.getTime()) && Date.now() - lastChecked.getTime() > 365 * 24 * 60 * 60 * 1000;
  const hostname = (() => {
    try { return new URL(program.program_url).hostname.replace(/^www\./, ""); }
    catch { return program.program_url; }
  })();

  return (
    <main className="min-h-screen bg-[#f4f2ed] pb-24 text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-800" href={`/pilot/school/${school.slug}`}>← All {school.school_name} pilot programs</Link>

        <header className="mt-6 max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">STAGE pilot · {program.degree_level_id.abbreviation ?? program.degree_level_id.degree_level_name}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl" data-testid="program-title">{program.official_program_name}</h1>
          <p className="mt-3 text-base text-slate-600">
            {program.degree_level_id.degree_level_name} · {school.school_name} · {school.city ?? city?.city_name ?? "—"}, {school.country ?? country?.country_name ?? "—"}
          </p>
        </header>

        <section aria-label="Decision bar" className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5" data-testid="decision-bar">
          <DecisionAtom attention={needsReview && deadlineMissing} label="Deadline" value={dateLabel(application?.application_deadline)} />
          <DecisionAtom
            label="Prescreen"
            value={audition?.prescreening_required === "Yes"
              ? `Yes · due ${dateLabel(audition.prescreening_deadline, false) ?? "—"}`
              : audition?.prescreening_required ?? null}
          />
          <DecisionAtom attention={needsReview && tuitionMissing} label="Cost" subline={costSubline} value={costValue} />
          <DecisionAtom label="Audition" value={audition?.audition_required === "Yes" ? `Yes · ${audition.audition_format ?? "Unknown"}` : audition?.audition_required ?? null} />
          <DecisionAtom label="Language" subline={application?.english_language_tests?.length ? `Accepted test: ${application.english_language_tests.join(" · ")}` : undefined} value={languageParts.length ? languageParts.join(" · ") : null} />
        </section>

        <section className="mt-8 grid gap-3">
          <Expandable title="Repertoire">
            <p className="whitespace-pre-line">{audition?.repertoire_summary ?? <Missing />}</p>
            {audition?.conditional_notes ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-slate-600">{audition.conditional_notes}</p> : null}
          </Expandable>

          <Expandable title="Cost detail">
            <dl>
              <DetailRow label="Annual tuition" value={money(tuition, tuitionCurrency)} />
              <DetailRow label="Scholarships" value={application?.scholarships_available ?? null} />
              <DetailRow label="Scholarship note" value={application?.scholarship_note ?? null} />
              <DetailRow label="City living band" value={city?.living_cost_band ?? null} />
              <DetailRow label="Monthly living estimate" value={money(livingMonthly, livingCurrency)} />
              <DetailRow label="Program duration" value={duration !== null ? `${duration} year${duration === 1 ? "" : "s"}` : null} />
              <DetailRow label="One-year total" value={money(annualTotal, tuitionCurrency)} />
              <DetailRow label="Full-duration total" value={money(fullTotal, tuitionCurrency)} />
            </dl>
          </Expandable>

          <Expandable title="Eligibility">
            <dl>
              <DetailRow label="Language of instruction" value={program.language_of_instruction?.join(" · ") ?? null} />
              <DetailRow label="Accepted English tests" value={application?.english_language_tests?.join(" · ") ?? null} />
              <DetailRow label="TOEFL minimum" value={application?.toefl_minimum ?? null} />
              <DetailRow label="IELTS minimum" value={application?.ielts_minimum ?? null} />
              <DetailRow label="Conditions" value={application?.conditional_notes ?? null} />
              {country ? (
                <>
                  <DetailRow label="Student visa context" value={country.visa_summary} />
                  <DetailRow label="Post-study work" value={country.post_study_work} />
                </>
              ) : null}
            </dl>
          </Expandable>
        </section>

        <footer className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>Source:</span>
          <a className="font-medium text-violet-800 underline" href={program.program_url} rel="noreferrer" target="_blank">{hostname}</a>
          <span>· Last checked {dateLabel(program.last_checked)}</span>
          {stale ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Data may be outdated</span> : null}
        </footer>

        <PilotReviewerPanel application={application} audition={audition} program={program} sources={sources} />
      </div>
    </main>
  );
}
