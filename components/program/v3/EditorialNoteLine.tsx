import type { EditorialNoteV3 } from "@/data/v3/types";

/**
 * §2.1 item 3 / §1.3: editorial opinion, always prefixed 「编辑观点」, never
 * merged into answer_sentence or JSON-LD. `null` → the whole row is absent
 * (not an empty state — editorial coverage is optional by design), and its
 * spacing goes with it, so no wrapper element survives (ruling T3-R3.1).
 */
export function EditorialNoteLine({
  note,
  className = "",
}: {
  note: EditorialNoteV3 | null;
  className?: string;
}) {
  if (!note) return null;
  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm leading-5 text-ink-700 ${className}`}
    >
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-ink-100 px-2 text-[11px] font-medium text-ink-500">
        编辑观点
      </span>
      <span>{note.short_positioning}</span>
      {note.key_difficulty ? (
        <span className="text-ink-500">· {note.key_difficulty}</span>
      ) : null}
    </p>
  );
}
