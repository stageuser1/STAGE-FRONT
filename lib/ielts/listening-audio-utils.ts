/**
 * Pure helpers for the Listening audio player.
 *
 * Split out of the component for one reason: this repo has node --test over
 * `lib/` and no DOM test runner, so anything that lives inside a `.tsx` file
 * cannot be asserted on. Seeking, rate options and the clock are the parts of
 * the player with real edge cases — a negative seek, a drag past the end, an
 * anchor sitting outside the media — so they live here, where they can be
 * tested, and `ListeningAudioPlayer` is left holding only markup and wiring.
 *
 * Nothing here touches an HTMLAudioElement or React. That is deliberate: the
 * hook owns the element, this file owns the arithmetic.
 */

/* --------------------------------------------------------------------------
 * Playback rate
 * ----------------------------------------------------------------------- */

/**
 * The fixed rate ladder. A tuple rather than `number[]` so `PlaybackRate` is
 * the union of the four literals and a caller cannot pass 2.0 by accident.
 */
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export const DEFAULT_PLAYBACK_RATE: PlaybackRate = 1;

export function isPlaybackRate(value: number): value is PlaybackRate {
  return (PLAYBACK_RATES as readonly number[]).includes(value);
}

/**
 * Rate as it is printed on the control: `0.75×`, `1.0×`, `1.25×`, `1.5×`.
 *
 * Two decimals then a single trailing zero stripped, rather than `toFixed(1)`:
 * one decimal would round 0.75 to "0.8" and print a rate the player does not
 * have. This keeps 1 at "1.0" — the design shows the whole rate padded — while
 * leaving 0.75 and 1.25 intact.
 */
export function formatRate(rate: number): string {
  return `${rate.toFixed(2).replace(/0$/, "")}×`;
}

/* --------------------------------------------------------------------------
 * Clock
 * ----------------------------------------------------------------------- */

/**
 * Seconds as `m:ss`, or `h:mm:ss` once past the hour.
 *
 * Listening sets run 5–10 minutes, so the hour branch is not for real material;
 * it is there because `audio.duration` is whatever the file says it is, and a
 * malformed placeholder reporting 4000 seconds should render "1:06:40" rather
 * than "66:40". A non-finite duration — the value an unloaded element reports —
 * reads as "0:00" instead of "NaN:aN".
 */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";

  const total = Math.floor(sec);
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);

  const ss = String(seconds).padStart(2, "0");
  if (hours === 0) return `${minutes}:${ss}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
}

/* --------------------------------------------------------------------------
 * Seeking
 * ----------------------------------------------------------------------- */

/**
 * Clamps a requested position into the media.
 *
 * Assigning an out-of-range `currentTime` throws in some engines and silently
 * does nothing in others, so every seek goes through here first. A duration
 * that is not yet known (0, NaN, Infinity before metadata loads) collapses the
 * range to a single point at 0: seeking into a file whose length is unknown has
 * no defined destination, and parking at the start is the recoverable answer.
 */
export function clampSeek(sec: number, duration: number): number {
  if (!Number.isFinite(sec)) return 0;
  const max = Number.isFinite(duration) && duration > 0 ? duration : 0;
  return Math.min(Math.max(sec, 0), max);
}

/** A question marker placed on the seek bar. */
export interface ListeningAnchor {
  questionNo: number;
  timestampSec: number;
}

/** An anchor plus where it sits on the bar, as a [0,1] fraction of the width. */
export interface AnchorPosition extends ListeningAnchor {
  fraction: number;
}

/**
 * Places anchors along the bar.
 *
 * Anchors are authored against the set's declared `durationSec`, while the bar
 * is drawn against whatever the loaded file reports; the two can disagree, and
 * a placeholder audio file makes them disagree badly. Clamping through
 * `clampSeek` means a marker never renders outside the track — it stacks at one
 * end instead, which reads as "at the start/end" rather than as a broken layout.
 *
 * An unknown duration puts every marker at 0 for the same reason `clampSeek`
 * does; the caller is expected to withhold the markers until metadata lands.
 */
export function anchorPositions(
  anchors: readonly ListeningAnchor[] | undefined,
  duration: number,
): AnchorPosition[] {
  if (!anchors || anchors.length === 0) return [];

  const usable = Number.isFinite(duration) && duration > 0 ? duration : 0;

  return anchors.map((anchor) => {
    const timestampSec = clampSeek(anchor.timestampSec, usable);
    return {
      questionNo: anchor.questionNo,
      timestampSec,
      fraction: usable === 0 ? 0 : timestampSec / usable,
    };
  });
}
