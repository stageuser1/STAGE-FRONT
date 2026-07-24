"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { nav } from "@/content/landing";

/**
 * The navbar's mobile menu — the only interactive client component in the
 * navbar (doc 03 §1). Full-width panel under the bar; body scroll locked while
 * open; closes on link click and Escape.
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
        aria-label={open ? "关闭菜单" : "打开菜单"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-stage-sm text-stage-fg transition hover:bg-stage-blue-50"
      >
        <Icon name={open ? "close" : "menu"} size={24} />
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-stage-border bg-stage-bg px-6 pb-6 pt-2 shadow-stage-md">
          <nav className="flex flex-col" aria-label="移动端导航">
            {nav.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 border-b border-stage-border py-3.5 text-body text-stage-fg"
              >
                {link.label}
                {link.soon ? (
                  <span className="rounded-full bg-stage-blue-100 px-2 py-0.5 text-caption font-medium text-stage-blue-600">
                    即将上线
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href={nav.login.href}
              onClick={() => setOpen(false)}
              className="rounded-stage-md border border-stage-border py-2.5 text-center text-body font-medium text-stage-fg"
            >
              {nav.login.label}
            </Link>
            <Link
              href={nav.cta.href}
              onClick={() => setOpen(false)}
              className="rounded-stage-md bg-stage-primary py-2.5 text-center text-body font-medium text-stage-fg-on-dark"
            >
              {nav.cta.label}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
