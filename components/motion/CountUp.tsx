"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Number count-up for the credibility band (doc 03 §3): 0 → value once when it
 * enters view, via requestAnimationFrame (easeOutCubic). Native APIs only.
 *
 * SSR/no-JS/reduced-motion render the FINAL value, so numbers are never stuck
 * at 0 if JS or IntersectionObserver never runs.
 */
export function CountUp({
  value,
  suffix = "",
  className,
  duration = 800,
}: {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setDisplay(value);
      return;
    }

    let started = false;
    let raf = 0;
    const run = () => {
      if (started) return;
      started = true;
      const start = performance.now();
      setDisplay(0);
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(eased * value));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      run();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
