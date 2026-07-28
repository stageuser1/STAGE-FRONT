"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { nav } from "@/content/landing";

/**
 * The navbar's mobile menu — the only interactive client component in the
 * marketing chrome. Full-width panel under the bar; body scroll locked while
 * open; closes on link click and Escape. Same links and same CTA as the desktop
 * bar (ruling C7), so the two never drift.
 */
export function MarketingMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? nav.menuLabel.close : nav.menuLabel.open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-stage-sm text-stage-fg transition-colors duration-stage-base hover:bg-stage-primary-soft"
      >
        <Icon name={open ? "close" : "menu"} size={24} />
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-stage-border bg-stage-bg px-6 pb-6 pt-2">
          <nav className="flex flex-col" aria-label="移动端导航">
            {nav.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-stage-border py-3.5 text-stage-body text-stage-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={nav.cta.href}
            onClick={() => setOpen(false)}
            className="mt-5 block rounded-stage-sm bg-stage-primary py-3 text-center text-stage-sm font-medium text-stage-fg-on-dark"
          >
            {nav.cta.label}
          </Link>
        </div>
      ) : null}
    </>
  );
}
