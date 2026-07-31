"use client";

/**
 * The modal layer the practice page opens twice: to offer a restore, and to
 * confirm a submit.
 *
 * Not `window.confirm` — that is banned for new Lab components (Plan §4.1.5)
 * and it could not list eleven clickable question numbers anyway. Not a dialog
 * library either: two dialogs do not earn a dependency, and `<dialog>`'s own
 * `showModal()` needs an imperative call from an effect to open, which is more
 * machinery than a conditionally rendered layer.
 *
 * What it does provide, because a hand-rolled layer usually forgets: the panel
 * takes focus on open, Escape closes it, focus returns to whatever had it
 * before, and the page behind cannot be scrolled while it is up.
 *
 * What it deliberately does not provide is a focus trap. A real trap is a
 * keydown cycle over every focusable descendant, and getting it subtly wrong is
 * worse than not having it: Tab out of this panel lands on the page behind,
 * which is inert-looking but reachable, and the same Escape gets the candidate
 * back. If a third dialog appears, that is the point to take on a primitive
 * that does it properly.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";

export function ListeningDialog({
  title,
  /** Escape and the scrim both route here. Cancel, not confirm — never destructive. */
  onDismiss,
  children,
}: {
  title: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    // The panel takes focus only if nothing inside it already has it: both
    // dialogs `autoFocus` their primary button, and that runs before this
    // effect — focusing the panel unconditionally would take it straight back
    // off the control the candidate is meant to be able to press with Enter.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDismiss();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = bodyOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-5 py-10">
      {/*
        The scrim is its own element rather than a background colour on the
        wrapper: `opacity` on the wrapper would fade the panel with it, and the
        token set has no pre-mixed scrim colour to reach for instead.
      */}
      <button
        type="button"
        aria-label="关闭"
        tabIndex={-1}
        onClick={onDismiss}
        className="absolute inset-0 h-full w-full cursor-default bg-stage-neutral-900 opacity-40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-full w-full max-w-[460px] overflow-y-auto rounded-stage-lg border border-stage-border bg-stage-bg p-5 outline-none"
      >
        <h2
          id={titleId}
          className="text-stage-h4 font-semibold text-stage-fg"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
