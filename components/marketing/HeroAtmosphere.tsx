"use client";

import { useEffect, useRef } from "react";

/**
 * Hero atmosphere (original, Verseo-inspired). Renders the luminous sky wash,
 * masked grid, glow, an original CSS cloud band, and a fade-to-white — all
 * decorative (aria-hidden), all behind the hero content.
 *
 * The only interactive part is the cloud motion: as the user scrolls through
 * the hero, the cloud band steps rightward (a stop-motion-like character), then
 * stops once the hero has scrolled past. Implementation notes:
 *   - scroll is passive + rAF-throttled; we never call setState per frame
 *   - progress is derived from the hero section's rect and clamped to [0,1]
 *   - progress is quantized to N steps → stepped translateX (the "frame" feel)
 *   - we write a single CSS custom property (--hero-cloud-x); the GPU-composited
 *     transform lives in CSS (.stage-clouds), so no layout work per frame
 *   - prefers-reduced-motion pins travel to 0 and skips the listener work
 *   - listeners are cleaned up on unmount
 *
 * All visual constants are CSS variables on .stage-hero (see globals.css).
 */
export function HeroAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // The hero <section> is the atmosphere's positioned parent and carries the
    // --hero-* tunables; read geometry from it.
    const section = el?.parentElement;
    if (!el || !section) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const update = () => {
      raf = 0;

      if (reduce.matches) {
        el.style.setProperty("--hero-cloud-x", "0px");
        return;
      }

      const styles = getComputedStyle(el);
      const travel =
        parseFloat(styles.getPropertyValue("--hero-cloud-travel-x")) || 300;
      const steps =
        parseInt(styles.getPropertyValue("--hero-cloud-step-count"), 10) || 40;

      const rect = section.getBoundingClientRect();
      const range = rect.height || 1;
      // 0 when the hero top sits at the viewport top; 1 once fully scrolled past.
      const progress = Math.min(1, Math.max(0, -rect.top / range));
      const stepped = Math.round(progress * steps) / steps;

      el.style.setProperty("--hero-cloud-x", `${Math.round(stepped * travel)}px`);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    reduce.addEventListener?.("change", update);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reduce.removeEventListener?.("change", update);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="stage-atmosphere">
      <div className="stage-sky" />
      <div className="stage-grid" />
      <div className="stage-glow" />
      <div className="stage-clouds" />
      <div className="stage-hero-fade" />
    </div>
  );
}
