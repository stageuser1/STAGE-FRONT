"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./ui/Icon";
import { useReviewerAuth } from "@/lib/directus-auth";

interface NavItem {
  label: string;
  icon: IconName;
  /** Destination when the feature exists; null renders an inert placeholder. */
  href: string | null;
  isActive?: (pathname: string) => boolean;
}

const items: NavItem[] = [
  { label: "探索", icon: "home", href: "/", isActive: (p) => p === "/" },
  {
    label: "院校",
    icon: "search",
    href: "/search",
    isActive: (p) => p.startsWith("/search"),
  },
  { label: "收藏", icon: "heart", href: null },
  {
    label: "我的",
    icon: "user",
    href: "/login",
    isActive: (p) => p.startsWith("/login"),
  },
];

/**
 * Fixed four-item bottom navigation for phones (hidden ≥768px), matching
 * the product design. 收藏 renders as a placeholder until that feature
 * ships, so there is no tap dead-end on a missing route.
 */
export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";
  const { isReviewer } = useReviewerAuth();

  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[#eeeeee] bg-white/95 backdrop-blur md:hidden"
    >
      <div className="pb-safe mx-auto flex max-w-[402px] items-stretch">
        {items.map((item) => {
          const active = item.href ? item.isActive?.(pathname) ?? false : false;
          const content = (
            <>
              <span className="relative">
                <Icon
                  name={item.icon}
                  size={22}
                  strokeWidth={active ? 2.4 : 2}
                />
                {item.href === "/login" && isReviewer ? (
                  <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                ) : null}
              </span>
              {item.label}
            </>
          );
          const className = `relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
            active ? "text-brand-600" : "text-ink-500"
          }`;

          if (!item.href) {
            return (
              <button
                aria-label={item.label}
                className={`${className} cursor-default`}
                key={item.label}
                type="button"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`${className} hover:text-ink-700`}
              href={item.href}
              key={item.label}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
