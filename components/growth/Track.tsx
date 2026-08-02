"use client";

import { useEffect, useRef } from "react";
import { claimOnce, emit, today, type GrowthEventKind, type GrowthPayload, type Section } from "@/lib/growth/emit";

/**
 * The UI-layer entry points for growth telemetry.
 *
 * Every Lab page is a server component, so this file is the client boundary the
 * emission points sit behind. Nothing here does any work when the ingest env is
 * unset — `emit` returns immediately — so the components below stay mounted and
 * inert rather than being conditionally rendered.
 */

/**
 * Fires `kind` once per mount.
 *
 * The ref guard is load-bearing under React Strict Mode, which mounts effects
 * twice in development and would otherwise double every module view.
 */
export function useTrackOnMount(
  kind: GrowthEventKind,
  payload: GrowthPayload,
  enabled = true,
): void {
  const fired = useRef(false);
  // Serialised so an inline object literal at the call site does not re-run the
  // effect on every render; the payloads here are flat and tiny.
  const key = JSON.stringify(payload);
  useEffect(() => {
    if (!enabled || fired.current) return;
    fired.current = true;
    emit(kind, JSON.parse(key) as GrowthPayload);
  }, [kind, key, enabled]);
}

/**
 * Declarative one-shot emitter for server-rendered pages.
 *
 * Renders nothing. Placed in a page body it says, in one line, "entering this
 * surface is the event" — which is exactly the rule for `lab_module_view`.
 */
export function Track({
  kind,
  payload = {},
}: {
  kind: GrowthEventKind;
  payload?: GrowthPayload;
}) {
  useTrackOnMount(kind, payload);
  return null;
}

/** Entering a module's main surface. */
export function TrackModuleView({ section }: { section: Section }) {
  useTrackOnMount("lab_module_view", { section });
  return null;
}

/**
 * The visitor heartbeat: `lab_active_day`, at most once per calendar day.
 *
 * Mounted by the Lab shell layout rather than by any one page, because the
 * event is defined over Lab surfaces generally — a visitor who only opens their
 * mistake book was active that day just as much as one who opened a module.
 */
export function TrackActiveDay() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (claimOnce(`active_day:${today()}`)) emit("lab_active_day");
  }, []);
  return null;
}

/**
 * Records a submitted attempt: the submit event itself, and — the first time
 * this visitor ever finishes anything — the funnel's `lab_first_practice`.
 *
 * Called from submit handlers, so it is a plain function rather than a hook.
 *
 * Returns whether this was the first-ever submit, which is the one piece of
 * information the product itself uses: the community card's result placement is
 * 首次交卷后 (Business Blueprint §2). The claim is local storage, not telemetry,
 * so the answer — and therefore what the learner sees — is identical whether or
 * not the ingest env is configured.
 */
export function trackPracticeSubmit(
  section: Section,
  payload: GrowthPayload,
): boolean {
  emit("lab_practice_submit", { section, ...payload });
  const first = claimOnce("first_practice");
  if (first) emit("lab_first_practice", { section });
  return first;
}
