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
  { label: "探索", icon: "home", href: "/schools", isActive: (p) => p === "/schools" },
  {
    label: "搜索",
    icon: "search",
    href: "/search",
    isActive: (p) => p.startsWith("/search"),
  },
  {
    label: "实验室",
    icon: "target",
    href: "/ielts-lab",
    isActive: (p) => p.startsWith("/ielts-lab"),
  },
  {
    label: "学习中心",
    icon: "trend",
    href: "/dashboard",
    isActive: (p) => p.startsWith("/dashboard"),
  },
  {
    // Points at the learner's own profile, NOT /login — that route is reviewer
    // CMS authentication and has never been a learner destination.
    label: "我的",
    icon: "user",
    href: "/profile",
    isActive: (p) => p.startsWith("/profile"),
  },
];

/**
 * Fixed bottom navigation for phones (hidden ≥768px).
 *
 * Five real destinations now that the lab, the dashboard and the profile
 * exist; the inert 收藏 placeholder is gone, because a tab that does nothing
 * is worse than one fewer tab.
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
