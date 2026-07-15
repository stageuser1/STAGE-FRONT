"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import type { ReviewStatus } from "@/data/types";
import { useReviewerAuth } from "@/lib/directus-auth";
import {
  EditableSelect,
  EditableTextField,
  EditableTextarea,
} from "./EditableFields";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type FormValues = Record<string, string>;

export interface EditableFieldDefinition {
  field: string;
  label: string;
  kind: "text" | "textarea" | "select";
  type?: "text" | "url" | "date";
  inputMode?: "decimal" | "numeric";
  options?: Array<{ label: string; value: string }>;
  serialize?: (value: string) => string | number | boolean | null;
}

interface ReviewerEditableCardProps {
  collection: string;
  fields: EditableFieldDefinition[];
  initialStatus: ReviewStatus | null;
  initialValues: Record<string, string | number | boolean | null>;
  recordId: string;
  renderView: (values: FormValues) => ReactNode;
}

function formValues(
  values: Record<string, string | number | boolean | null>,
): FormValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === null ? "" : String(value),
    ]),
  );
}

export function ReviewerEditableCard({
  collection,
  fields,
  initialStatus,
  initialValues,
  recordId,
  renderView,
}: ReviewerEditableCardProps) {
  const idPrefix = useId();
  const { isReviewer, request } = useReviewerAuth();
  const initial = useMemo(() => formValues(initialValues), [initialValues]);
  const [values, setValues] = useState<FormValues>(initial);
  const [draft, setDraft] = useState<FormValues>(initial);
  const [status, setStatus] = useState<ReviewStatus | null>(initialStatus);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    function syncStatus(event: Event) {
      const detail = (event as CustomEvent<{
        collection: string;
        recordId: string;
        status: ReviewStatus;
      }>).detail;
      if (detail.collection === collection && detail.recordId === recordId) {
        setStatus(detail.status);
      }
    }
    window.addEventListener("stage:review-status", syncStatus);
    return () => window.removeEventListener("stage:review-status", syncStatus);
  }, [collection, recordId]);

  function publishStatus(nextStatus: ReviewStatus) {
    setStatus(nextStatus);
    window.dispatchEvent(
      new CustomEvent("stage:review-status", {
        detail: { collection, recordId, status: nextStatus },
      }),
    );
  }

  async function patch(payload: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/items/${collection}/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async function save() {
    const changed = fields.filter(
      (definition) => draft[definition.field] !== values[definition.field],
    );
    if (changed.length === 0) {
      setEditing(false);
      return;
    }
    const payload: Record<string, unknown> = { review_status: "human_edited" };
    changed.forEach((definition) => {
      const value = draft[definition.field] ?? "";
      payload[definition.field] = definition.serialize
        ? definition.serialize(value)
        : value.trim() === ""
          ? null
          : value;
    });

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await patch(payload);
      setValues(draft);
      publishStatus("human_edited");
      setEditing(false);
      setNotice("Saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(nextStatus: "human_checked" | "needs_update") {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await patch({ review_status: nextStatus });
      publishStatus(nextStatus);
      setNotice(nextStatus === "human_checked" ? "Verified" : "Flagged");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      {isReviewer ? (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 border-b border-gray-100 pb-3">
          <ReviewStatusBadge status={status} />
          {!editing ? (
          <>
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700"
              disabled={saving}
              onClick={() => {
                setDraft(values);
                setEditing(true);
                setError(null);
                setNotice(null);
              }}
              type="button"
            >
              Edit
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              disabled={saving}
              onClick={() => void updateStatus("human_checked")}
              type="button"
            >
              Mark Verified
            </button>
            <button
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-60"
              disabled={saving}
              onClick={() => void updateStatus("needs_update")}
              type="button"
            >
              Needs Update
            </button>
          </>
          ) : null}
        </div>
      ) : null}

      {isReviewer && editing ? (
        <div className="space-y-4">
          {fields.map((definition) => {
            const common = {
              id: `${idPrefix}-${definition.field}`,
              label: definition.label,
              value: draft[definition.field] ?? "",
              onChange: (value: string) =>
                setDraft((current) => ({
                  ...current,
                  [definition.field]: value,
                })),
            };
            if (definition.kind === "textarea") {
              return <EditableTextarea key={definition.field} {...common} />;
            }
            if (definition.kind === "select") {
              return (
                <EditableSelect
                  key={definition.field}
                  {...common}
                  options={definition.options ?? []}
                />
              );
            }
            return (
              <EditableTextField
                key={definition.field}
                {...common}
                inputMode={definition.inputMode}
                type={definition.type}
              />
            );
          })}
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              disabled={saving}
              onClick={() => {
                setDraft(values);
                setEditing(false);
                setError(null);
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={saving}
              onClick={() => void save()}
              type="button"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        renderView(values)
      )}

      {!editing && (error || notice) ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? notice}
        </p>
      ) : null}
    </section>
  );
}
