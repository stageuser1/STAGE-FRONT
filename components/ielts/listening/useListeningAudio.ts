"use client";

/**
 * Owns the <audio> element for the Listening player.
 *
 * The element is native and the hook is the only thing that touches it: no
 * audio library, and no second source of truth for position or rate. The
 * component renders `<audio ref={audioRef} />` and otherwise reads state.
 *
 * Direction of dependency is one-way — this file imports from `lib/ielts/` and
 * nothing from the component layer — so the arithmetic stays testable under
 * node --test and the hook stays a thin adapter over media events.
 *
 * Only the `free` policy exists today. Nothing here knows about policies at
 * all: a play-once or exam-locked player would constrain *which* of these
 * methods the UI may call, which is a decision for the component, not for the
 * element wrapper.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_PLAYBACK_RATE,
  clampSeek,
  type PlaybackRate,
} from "@/lib/ielts/listening-audio-utils";

/**
 * `idle` is before the first play, `ended` is a finished file still parked at
 * its last frame. They are distinct from `paused` because the toggle button
 * reads "播放" in all three but the bar means something different in each.
 */
export type ListeningAudioState =
  | "idle"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface UseListeningAudioOptions {
  src: string;
  /** Declared length, shown until the file reports its own. */
  durationSec: number;
  onTimeUpdate?: (sec: number) => void;
}

export interface ListeningAudio {
  /** Attach to the rendered `<audio>`; the hook does nothing until it is set. */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  state: ListeningAudioState;
  currentSec: number;
  /** Metadata length once loaded, the declared fallback before that. */
  durationSec: number;
  rate: PlaybackRate;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (sec: number) => void;
  setRate: (rate: PlaybackRate) => void;
}

export function useListeningAudio({
  src,
  durationSec,
  onTimeUpdate,
}: UseListeningAudioOptions): ListeningAudio {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<ListeningAudioState>("idle");
  const [currentSec, setCurrentSec] = useState(0);
  const [duration, setDuration] = useState(durationSec);
  const [rate, setRateState] = useState<PlaybackRate>(DEFAULT_PLAYBACK_RATE);

  /**
   * Latest-callback and latest-fallback refs.
   *
   * `timeupdate` fires ~4×/second, so the listener effect must not re-subscribe
   * when a parent passes a fresh `onTimeUpdate` closure on every render, and
   * must not re-subscribe when `durationSec` changes either. Reading both
   * through refs keeps the subscription keyed on `src` alone.
   */
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const fallbackDurationRef = useRef(durationSec);
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
    fallbackDurationRef.current = durationSec;
  });

  // A new file is a new clock. Reset before the listeners below re-attach so a
  // stale position never renders against the incoming track.
  useEffect(() => {
    setState("idle");
    setCurrentSec(0);
    setDuration(fallbackDurationRef.current);
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const readDuration = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentSec(el.currentTime);
      onTimeUpdateRef.current?.(el.currentTime);
    };
    const handlePlay = () => setState("playing");
    // `pause` also fires at the end of a track in some engines; `ended` is the
    // more specific state and must not be downgraded by the event that follows.
    const handlePause = () =>
      setState((prev) => (prev === "ended" ? prev : "paused"));
    const handleEnded = () => setState("ended");
    const handleError = () => setState("error");

    el.addEventListener("loadedmetadata", readDuration);
    el.addEventListener("durationchange", readDuration);
    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("play", handlePlay);
    el.addEventListener("pause", handlePause);
    el.addEventListener("ended", handleEnded);
    el.addEventListener("error", handleError);

    // Loading a new source resets playbackRate to 1; re-assert the chosen rate
    // so a mid-session source swap does not silently drop back to normal speed.
    el.playbackRate = rate;
    readDuration();

    return () => {
      el.removeEventListener("loadedmetadata", readDuration);
      el.removeEventListener("durationchange", readDuration);
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("play", handlePlay);
      el.removeEventListener("pause", handlePause);
      el.removeEventListener("ended", handleEnded);
      el.removeEventListener("error", handleError);
    };
    // `rate` is applied here only as a re-assertion after a source change; the
    // setter below is what carries a user's rate change to the element, so
    // re-subscribing on every rate change would be pure churn.
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    // Autoplay policies and a missing file both reject here. Surfacing it as
    // `error` is what lets the component render a notice instead of leaving a
    // dead button that looks like it worked.
    void el.play().catch(() => setState("error"));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) play();
    else pause();
  }, [play, pause]);

  const seek = useCallback((sec: number) => {
    const el = audioRef.current;
    if (!el) return;
    // Clamp against the element's own duration rather than React state: state
    // can lag a `durationchange` by a frame, and the element is what throws.
    const next = clampSeek(sec, el.duration);
    el.currentTime = next;
    setCurrentSec(next);
    // A seek away from the end makes the track playable again.
    setState((prev) => (prev === "ended" && next < el.duration ? "paused" : prev));
  }, []);

  const setRate = useCallback((next: PlaybackRate) => {
    setRateState(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, []);

  return {
    audioRef,
    state,
    currentSec,
    durationSec: duration,
    rate,
    play,
    pause,
    toggle,
    seek,
    setRate,
  };
}
