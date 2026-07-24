"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealState = "idle" | "hidden" | "shown";

/**
 * Scroll-entrance wrapper (doc 02 §5): fade + 16px rise, once at ~15%
 * visibility, `delay` staggers siblings.
 *
 * Progressive enhancement (SSR/no-JS safe, LCP-friendly): server render is
 * "idle" with NO inline style, so content is visible in the HTML and never
 * depends on JS to appear. On mount, above-the-fold content shows immediately
 * (no flash, instant LCP); below-the-fold content hides while off-screen and
 * animates in via IntersectionObserver on scroll. Reduced motion shows
 * everything immediately. Native APIs only — no animation library.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<RevealState>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setState("shown");
      return;
    }

    // Already in view at mount (e.g. hero): reveal immediately, no hide/flash.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      setState("shown");
      return;
    }

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style =
    state === "idle"
      ? undefined
      : {
          opacity: state === "hidden" ? 0 : 1,
          transform: state === "hidden" ? "translateY(16px)" : "none",
          transition: `opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        };

  return (
    // @ts-expect-error — dynamic tag with a shared ref is fine for these tags
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
