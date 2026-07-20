"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  PilotApplication,
  PilotAudition,
  PilotProgram,
  PilotSource,
} from "@/lib/pilot-data";
import { useReviewerAuth } from "@/lib/directus-auth";

type Value = string | number | boolean | string[] | null;
type EditableRecord = Record<string, Value> & { id: string | number; review_status: string };

interface FieldDefinition {
  field: string;
  label: string;
  kind: "text" | "textarea" | "date" | "number" | "select" | "string-list";
  options?: string[];
}

const PROGRAM_FIELDS: FieldDefinition[] = [
  { field: "language_of_instruction", label: "Language of instruction", kind: "string-list" },
  { field: "last_checked", label: "Last checked", kind: "date" },
];

const APPLICATION_FIELDS: FieldDefinition[] = [
  { field: "application_deadline", label: "Application deadline", kind: "date" },
  { field: "deadline_notes", label: "Deadline notes", kind: "textarea" },
  { field: "tuition_annual", label: "Annual tuition", kind: "number" },
  {
    field: "tuition_currency", label: "Tuition currency", kind: "select",
    options: ["USD", "GBP", "EUR", "CAD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "JPY", "KRW", "CNY", "SGD", "HKD", "AUD", "NZD"],
  },
  {
    field: "scholarships_available", label: "Scholarships available", kind: "select",
    options: ["Yes", "No", "Unknown"],
  },
  { field: "scholarship_note", label: "Scholarship note", kind: "textarea" },
  { field: "toefl_minimum", label: "TOEFL minimum", kind: "number" },
  { field: "ielts_minimum", label: "IELTS minimum", kind: "number" },
  { field: "conditional_notes", label: "Conditional notes", kind: "textarea" },
];

const AUDITION_FIELDS: FieldDefinition[] = [
  {
    field: "prescreening_required", label: "Prescreening required", kind: "select",
    options: ["Yes", "No", "Varies", "Unknown"],
  },
  { field: "prescreening_deadline", label: "Prescreening deadline", kind: "date" },
  {
    field: "audition_required", label: "Audition required", kind: "select",
    options: ["Yes", "No", "Varies", "Unknown"],
  },
  {
    field: "audition_format", label: "Audition format", kind: "select",
    options: ["Live Only", "Recorded Only", "Live or Recorded", "Regional", "Multiple Rounds", "Unknown"],
  },
  { field: "repertoire_summary", label: "Repertoire summary", kind: "textarea" },
  { field: "conditional_notes", label: "Conditional notes", kind: "textarea" },
];

function inputValue(value: Value | undefined, definition: FieldDefinition): string {
  if (value === null || value === undefined) return "";
  if (definition.kind === "string-list") {
    return Array.isArray(value) ? value.join(", ") : String(value);
  }
  return String(value);
}

function outputValue(value: string, definition: FieldDefinition): unknown {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (definition.kind === "number") return Number(trimmed);
  if (definition.kind === "string-list") {
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return value;
}

function ReviewRecordCard({
  collection,
  title,
  record,
  definitions,
}: {
  collection: string;
  title: string;
  record: EditableRecord;
  definitions: FieldDefinition[];
}) {
  const router = useRouter();
  const { request } = useReviewerAuth();
  const initial = useMemo(
    () => Object.fromEntries(definitions.map((definition) => [definition.field, inputValue(record[definition.field], definition)])),
    [definitions, record],
  );
  const [saved, setSaved] = useState<Record<string, string>>(initial);
  const [draft, setDraft] = useState<Record<string, string>>(initial);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(record.review_status);

  useEffect(() => {
    setSaved(initial);
    setDraft(initial);
    setStatus(record.review_status);
  }, [initial, record.review_status]);

  const dirty = definitions.some(({ field }) => draft[field] !== saved[field]);

  async function assertUnchanged() {
    const fields = [...definitions.map(({ field }) => field), "review_status"].join(",");
    const current = await request<Record<string, Value>>(
      `/items/${collection}/${record.id}?fields=${encodeURIComponent(fields)}`,
    );
    const changed = definitions.some((definition) =>
      inputValue(current[definition.field], definition) !== saved[definition.field],
    ) || String(current.review_status ?? "") !== status;
    if (changed) throw new Error("Record changed, re-apply your edit.");
  }

  async function save() {
    const changed = definitions.filter(({ field }) => draft[field] !== saved[field]);
    if (changed.length === 0) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await assertUnchanged();
      const payload = Object.fromEntries(
        changed.map((definition) => [definition.field, outputValue(draft[definition.field], definition)]),
      );
      const response = await request<Record<string, Value> | undefined>(
        `/items/${collection}/${record.id}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
      const next = { ...saved };
      changed.forEach((definition) => {
        next[definition.field] = inputValue(
          response?.[definition.field] ?? (payload[definition.field] as Value),
          definition,
        );
      });
      setSaved(next);
      setDraft(next);
      setEditing(false);
      setMessage("Saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function mark(nextStatus: "Verified" | "Outdated") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await assertUnchanged();
      const response = await request<Record<string, Value> | undefined>(
        `/items/${collection}/${record.id}`,
        { method: "PATCH", body: JSON.stringify({ review_status: nextStatus }) },
      );
      setStatus(String(response?.review_status ?? nextStatus));
      setMessage(nextStatus === "Verified" ? "Marked Verified." : "Marked Needs Update.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">{status}</span>
        {!editing ? (
          <>
            <button className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold" disabled={busy} onClick={() => setEditing(true)} type="button">Edit</button>
            <button className="min-h-11 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white" disabled={busy} onClick={() => void mark("Verified")} type="button">Mark Verified</button>
            <button className="min-h-11 rounded-xl bg-amber-100 px-3 text-sm font-semibold text-amber-800" disabled={busy} onClick={() => void mark("Outdated")} type="button">Mark Needs Update</button>
          </>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {definitions.map((definition) => (
            <label className={definition.kind === "textarea" ? "md:col-span-2" : ""} key={definition.field}>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{definition.label}</span>
              {definition.kind === "textarea" ? (
                <textarea className="min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm" onChange={(event) => setDraft((current) => ({ ...current, [definition.field]: event.target.value }))} value={draft[definition.field]} />
              ) : definition.kind === "select" ? (
                <select className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setDraft((current) => ({ ...current, [definition.field]: event.target.value }))} value={draft[definition.field]}>
                  <option value="">—</option>
                  {definition.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" inputMode={definition.kind === "number" ? "decimal" : undefined} onChange={(event) => setDraft((current) => ({ ...current, [definition.field]: event.target.value }))} type={definition.kind === "date" ? "date" : "text"} value={draft[definition.field]} />
              )}
            </label>
          ))}
          <div className="flex gap-2 md:col-span-2 md:justify-end">
            <button className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold" disabled={busy} onClick={() => { setDraft(saved); setEditing(false); setError(null); }} type="button">Cancel</button>
            <button className="min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white" disabled={busy || !dirty} onClick={() => void save()} type="button">{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p> : null}
    </section>
  );
}

export function PilotReviewerPanel({
  program,
  application,
  audition,
  sources,
}: {
  program: PilotProgram;
  application: PilotApplication | null;
  audition: PilotAudition | null;
  sources: PilotSource[];
}) {
  const { isReviewer } = useReviewerAuth();
  if (!isReviewer) return null;

  return (
    <aside aria-label="Reviewer controls" className="mt-8 space-y-4 border-t border-slate-200 pt-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Reviewer workspace</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">Active fields only</h2>
        <p className="mt-1 text-sm text-slate-600">Saves patch changed fields only. Status changes are explicit and protected imports will not overwrite Verified records.</p>
      </div>
      <ReviewRecordCard collection="program_offerings" definitions={PROGRAM_FIELDS} record={program as unknown as EditableRecord} title="Program offering" />
      {application ? <ReviewRecordCard collection="application_requirements" definitions={APPLICATION_FIELDS} record={application as unknown as EditableRecord} title="Current application cycle" /> : null}
      {audition ? <ReviewRecordCard collection="audition_requirements" definitions={AUDITION_FIELDS} record={audition as unknown as EditableRecord} title="Current audition cycle" /> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Supporting sources · read only</h3>
        <div className="mt-3 space-y-3">
          {sources.map((source) => (
            <div className="rounded-xl bg-slate-50 p-3 text-sm" key={String(source.id)}>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{source.related_field ?? "General"}</span>
                <span>Retrieved {source.retrieved_date}</span>
              </div>
              <a className="mt-1 block break-all font-medium text-violet-700 underline" href={source.source_url} rel="noreferrer" target="_blank">{source.source_url}</a>
              {source.source_quote ? <blockquote className="mt-2 border-l-2 border-violet-300 pl-3 text-slate-700">{source.source_quote}</blockquote> : null}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
