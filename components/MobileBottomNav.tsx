"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./ui/Icon";
import { useReviewerAuth } from "@/lib/directus-auth";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  isActive: (pathname: string) => boolean;
}

const items: NavItem[] = [
  { href: "/", label: "首页", icon: "home", isActive: (p) => p === "/" },
  {
    href: "/search",
    label: "搜索",
    icon: "search",
    isActive: (p) => p.startsWith("/search"),
  },
  {
    href: "/login",
    label: "我的",
    icon: "user",
    isActive: (p) => p.startsWith("/login"),
  },
];

/**
 * Fixed three-item bottom navigation for phones (hidden ≥768px).
 * Only real destinations — 收藏/对比 stay out until those features exist.
 */
export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";
  const { isReviewer } = useReviewerAuth();

  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur md:hidden"
    >
      <div className="pb-safe mx-auto flex max-w-md items-stretch">
        {items.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                active ? "text-brand-600" : "text-ink-500 hover:text-ink-700"
              }`}
              href={item.href}
              key={item.href}
            >
              <span className="relative">
                <Icon name={item.icon} size={22} strokeWidth={active ? 2.4 : 2} />
                {item.href === "/login" && isReviewer ? (
                  <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
