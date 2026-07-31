"use client";

/**
 * The Listening transport: play/pause, a seek bar with question markers, the
 * clock, and the rate ladder.
 *
 * Layout follows the approved export — a round primary-filled play button on
 * the left, the bar taking the remaining width, elapsed and total tucked under
 * its two ends, rate on the right. Tokens are the stage-* family and the
 * control classes from `components/ielts/ui.tsx`, as everywhere else in Lab.
 *
 * Only `policy="free"` is implemented. The prop is typed with all three values
 * so callers written against the eventual play-once and exam modes typecheck
 * today, but passing either renders a notice instead of a player: a silently
 * free player under an exam policy would be an integrity bug, and failing
 * visibly is the only safe reading of an unimplemented restriction.
 *
 * No autoplay, and no audio library.
 */

import { useId } from "react";

import {
  PLAYBACK_RATES,
  anchorPositions,
  formatRate,
  formatTime,
  isPlaybackRate,
  type ListeningAnchor,
} from "@/lib/ielts/listening-audio-utils";

import { useListeningAudio } from "./useListeningAudio";

export type ListeningPlaybackPolicy = "free" | "once" | "exam";

export interface ListeningAudioPlayerProps {
  src: string;
  /** Declared length, shown until the file reports its own. */
  durationSec: number;
  policy: ListeningPlaybackPolicy;
  /** Question markers on the bar. Clicking one seeks to it. */
  anchors?: ListeningAnchor[];
  onTimeUpdate?: (sec: number) => void;
}

/** Round, primary-filled, 44px — the export's single transport control. */
const TOGGLE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-stage-pill bg-stage-primary text-stage-fg-on-dark transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-primary-hover active:bg-stage-primary-press disabled:cursor-not-allowed disabled:opacity-50";

export function ListeningAudioPlayer({
  src,
  durationSec,
  policy,
  anchors,
  onTimeUpdate,
}: ListeningAudioPlayerProps) {
  const seekId = useId();
  const {
    audioRef,
    state,
    currentSec,
    durationSec: duration,
    rate,
    toggle,
    seek,
    setRate,
  } = useListeningAudio({ src, durationSec, onTimeUpdate });

  // Hooks first, so the unsupported branch does not change the hook order.
  if (policy !== "free") {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `ListeningAudioPlayer: policy "${policy}" is not implemented; only "free" is available.`,
      );
    }
    return (
      <p
        role="alert"
        className="rounded-stage-lg border border-stage-border bg-stage-bg-soft px-4 py-6 text-center text-stage-xs text-stage-fg-muted"
      >
        该播放模式尚未开放。
      </p>
    );
  }

  const playing = state === "playing";
  const failed = state === "error";
  // Markers are withheld until a real length is known; before that every
  // position collapses to 0 and they would stack on the left edge.
  const markers = duration > 0 ? anchorPositions(anchors, duration) : [];

  return (
    <div className="rounded-stage-lg border border-stage-border bg-stage-bg p-4">
      {/* preload="metadata" is what fills the clock without fetching audio the
          candidate may never play; there is no autoPlay and no loop. */}
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={failed}
          aria-label={playing ? "暂停" : "播放"}
          className={TOGGLE}
        >
          <PlayPauseIcon playing={playing} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="relative">
            <label htmlFor={seekId} className="sr-only">
              播放进度
            </label>
            {/* A native range: arrow keys, Home/End and drag-to-seek all come
                for free, and match whatever the candidate's OS already does. */}
            <input
              id={seekId}
              type="range"
              min={0}
              max={duration > 0 ? duration : 0}
              step={0.1}
              value={Math.min(currentSec, duration)}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={failed || duration <= 0}
              aria-valuetext={`${formatTime(currentSec)} / ${formatTime(duration)}`}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-stage-pill bg-stage-neutral-200 accent-stage-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            {markers.length > 0 ? (
              // Ticks sit on the track. Each is a real button so a marker is
              // reachable by keyboard as well as clickable; `-translate-x-1/2`
              // centres the 2px tick on its timestamp rather than starting it
              // there, which would drift a marker right by half its width.
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5">
                {markers.map((marker) => (
                  <button
                    key={marker.questionNo}
                    type="button"
                    onClick={() => seek(marker.timestampSec)}
                    aria-label={`跳转到第 ${marker.questionNo} 题 ${formatTime(marker.timestampSec)}`}
                    style={{ left: `${marker.fraction * 100}%` }}
                    className="pointer-events-auto absolute top-0 h-1.5 w-0.5 -translate-x-1/2 rounded-stage-pill bg-stage-primary-press"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between text-stage-2xs tabular-nums text-stage-fg-muted">
            <span>{formatTime(currentSec)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <label className="shrink-0">
          <span className="sr-only">播放速度</span>
          <select
            value={rate}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (isPlaybackRate(next)) setRate(next);
            }}
            disabled={failed}
            className="rounded-stage-sm border border-stage-border-strong bg-stage-bg px-2 py-1 text-stage-2xs tabular-nums text-stage-fg-body outline-none transition-colors duration-stage-fast focus:border-stage-primary focus:shadow-stage-focus disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PLAYBACK_RATES.map((option) => (
              <option key={option} value={option}>
                {formatRate(option)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {failed ? (
        <p role="alert" className="mt-3 text-stage-2xs text-stage-danger">
          音频加载失败，请稍后重试。
        </p>
      ) : null}
    </div>
  );
}

/** Inline so the transport carries no icon-set dependency. */
function PlayPauseIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="currentColor"
    >
      {playing ? (
        <>
          <rect x="4" y="3" width="3" height="10" rx="1" />
          <rect x="9" y="3" width="3" height="10" rx="1" />
        </>
      ) : (
        // Nudged right by 1px: a triangle centred on its bounding box reads as
        // sitting left of centre inside a circle.
        <path d="M5.5 3.4a.6.6 0 0 1 .92-.5l6.1 4.1a.6.6 0 0 1 0 1l-6.1 4.1a.6.6 0 0 1-.92-.5z" />
      )}
    </svg>
  );
}
