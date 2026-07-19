"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  collection?: string;
  field: string;
  label: string;
  kind: "text" | "textarea" | "select";
  name?: string;
  recordId?: string;
  type?: "text" | "url" | "date";
  inputMode?: "decimal" | "numeric";
  options?: Array<{ label: string; value: string }>;
  serialize?: (value: string) => unknown;
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
  const router = useRouter();
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

  const isDirty =
    editing &&
    fields.some((definition) => {
      const name = definition.name ?? definition.field;
      return (draft[name] ?? "") !== (values[name] ?? "");
    });

  useEffect(() => {
    setValues(initial);
    setDraft(initial);
    setStatus(initialStatus);
  }, [initial, initialStatus]);

  // Leave guard: warn before the tab closes while an edit is unsaved.
  useEffect(() => {
    if (!isDirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  useEffect(() => {
    function syncStatus(event: Event) {
      const detail = (event as CustomEvent<{
        collection: string;
        recordId: string;
        status: ReviewStatus;
      }>).detail;
      const belongsToCard = fields.some(
        (definition) =>
          (definition.collection ?? collection) === detail.collection &&
          (definition.recordId ?? recordId) === detail.recordId,
      );
      if (belongsToCard) {
        setStatus(detail.status);
      }
    }
    window.addEventListener("stage:review-status", syncStatus);
    return () => window.removeEventListener("stage:review-status", syncStatus);
  }, [collection, fields, recordId]);

  function publishStatus(
    nextStatus: ReviewStatus,
    targetCollection = collection,
    targetRecordId = recordId,
  ) {
    setStatus(nextStatus);
    window.dispatchEvent(
      new CustomEvent("stage:review-status", {
        detail: {
          collection: targetCollection,
          recordId: targetRecordId,
          status: nextStatus,
        },
      }),
    );
  }

  async function patch(
    targetCollection: string,
    targetRecordId: string,
    payload: Record<string, unknown>,
  ) {
    return request<Record<string, unknown>>(
      `/items/${targetCollection}/${targetRecordId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  }

  async function save() {
    const changed = fields.filter(
      (definition) => {
        const name = definition.name ?? definition.field;
        return draft[name] !== values[name];
      },
    );
    if (changed.length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payloads = new Map<string, Record<string, unknown>>();
      changed.forEach((definition) => {
        const name = definition.name ?? definition.field;
        const value = draft[name] ?? "";
        const targetCollection = definition.collection ?? collection;
        const targetRecordId = definition.recordId ?? recordId;
        const targetKey = `${targetCollection}:${targetRecordId}`;
        const payload = payloads.get(targetKey) ?? {
          review_status: "human_edited",
        };
        payload[definition.field] = definition.serialize
          ? definition.serialize(value)
          : value.trim() === ""
            ? null
            : value;
        payloads.set(targetKey, payload);
      });

      const savedTargets: string[] = [];
      for (const [targetKey, payload] of payloads.entries()) {
        const separator = targetKey.indexOf(":");
        const targetCollection = targetKey.slice(0, separator);
        const targetRecordId = targetKey.slice(separator + 1);
        try {
          await patch(targetCollection, targetRecordId, payload);
        } catch (caught) {
          const reason =
            caught instanceof Error ? caught.message : String(caught);
          if (savedTargets.length > 0) router.refresh();
          throw new Error(
            savedTargets.length > 0
              ? `Saved ${savedTargets.join(", ")}, but failed to save ${targetCollection} record ${targetRecordId}: ${reason}. The page may be partially saved and has been refreshed.`
              : `Failed to save ${targetCollection} record ${targetRecordId}: ${reason}`,
          );
        }
        savedTargets.push(`${targetCollection} record ${targetRecordId}`);
        publishStatus("human_edited", targetCollection, targetRecordId);
      }
      setValues({ ...draft });
      setEditing(false);
      setNotice("已保存");
      router.refresh();
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
      const targets = new Map<string, { collection: string; recordId: string }>();
      fields.forEach((definition) => {
        const targetCollection = definition.collection ?? collection;
        const targetRecordId = definition.recordId ?? recordId;
        targets.set(`${targetCollection}:${targetRecordId}`, {
          collection: targetCollection,
          recordId: targetRecordId,
        });
      });
      const savedTargets: string[] = [];
      for (const target of targets.values()) {
        try {
          await patch(target.collection, target.recordId, {
            review_status: nextStatus,
          });
        } catch (caught) {
          const reason =
            caught instanceof Error ? caught.message : String(caught);
          if (savedTargets.length > 0) router.refresh();
          throw new Error(
            savedTargets.length > 0
              ? `Updated ${savedTargets.join(", ")}, but failed to update ${target.collection} record ${target.recordId}: ${reason}. The page may be partially updated and has been refreshed.`
              : `Failed to update ${target.collection} record ${target.recordId}: ${reason}`,
          );
        }
        savedTargets.push(`${target.collection} record ${target.recordId}`);
        publishStatus(nextStatus, target.collection, target.recordId);
      }
      setNotice(
        nextStatus === "human_checked" ? "已标记为已核验" : "已标记为需更新",
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSaving(false);
    }
  }

  // Reviewer frame: dashed brand border marks an editable card at rest,
  // a solid brand border marks the active edit, and an amber left rule
  // flags unsaved changes. Public visitors see the plain card.
  const frame = !isReviewer
    ? "border border-line"
    : editing
      ? `border-2 border-brand-500 shadow-raised ${
          isDirty ? "border-l-amber-400" : ""
        }`
      : "border border-dashed border-brand-300";

  return (
    <section className={`rounded-2xl bg-white p-4 shadow-card md:p-5 ${frame}`}>
      {isReviewer ? (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 border-b border-line-subtle pb-3">
          <span className="mr-auto text-xs font-medium text-brand-600">
            可编辑
          </span>
          <ReviewStatusBadge status={status} />
          {isDirty ? (
            <span className="inline-flex h-[22px] items-center rounded-full bg-amber-50 px-2.5 text-xs font-medium text-amber-700">
              未保存更改
            </span>
          ) : null}
          {!editing ? (
          <>
            <button
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
              disabled={saving}
              onClick={() => {
                setDraft(values);
                setEditing(true);
                setError(null);
                setNotice(null);
              }}
              type="button"
            >
              编辑
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={saving}
              onClick={() => void updateStatus("human_checked")}
              type="button"
            >
              标记已核验
            </button>
            <button
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              disabled={saving}
              onClick={() => void updateStatus("needs_update")}
              type="button"
            >
              需更新
            </button>
          </>
          ) : null}
        </div>
      ) : null}

      {isReviewer && editing ? (
        <div className="space-y-4">
          {fields.map((definition) => {
            const name = definition.name ?? definition.field;
            const common = {
              id: `${idPrefix}-${name}`,
              label: definition.label,
              value: draft[name] ?? "",
              onChange: (value: string) =>
                setDraft((current) => ({
                  ...current,
                  [name]: value,
                })),
            };
            if (definition.kind === "textarea") {
              return <EditableTextarea key={name} {...common} />;
            }
            if (definition.kind === "select") {
              return (
                <EditableSelect
                  key={name}
                  {...common}
                  options={definition.options ?? []}
                />
              );
            }
            return (
              <EditableTextField
                key={name}
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
          <div className="sticky bottom-16 -mx-1 flex justify-end gap-2 rounded-xl bg-white/95 px-1 py-2 backdrop-blur md:bottom-4">
            <button
              className="h-10 rounded-xl border border-line px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              disabled={saving}
              onClick={() => {
                if (
                  isDirty &&
                  !window.confirm("有未保存的更改，确定要放弃吗？")
                ) {
                  return;
                }
                setDraft(values);
                setEditing(false);
                setError(null);
              }}
              type="button"
            >
              取消
            </button>
            <button
              className="h-10 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={saving}
              onClick={() => void save()}
              type="button"
            >
              {saving ? "保存中…" : "保存"}
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
