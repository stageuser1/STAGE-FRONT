"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { dismissNudge, loadProfile } from "@/lib/profile/storage";
import { profileCompleteness } from "@/lib/profile/derive";

const NUDGE_ID = "explore-build-profile";

/**
 * Inline invitation to build a profile.
 *
 * An inline row, never a modal, and its dismissal persists — a welcome dialog
 * that reappears on every visit is one of the defects this product set out not
 * to repeat. Discovery is never gated: this only ever adds a personal column,
 * it never withholds the catalog.
 */
export function ProfileNudge() {
  const pathname = usePathname();
  // Rendered only after localStorage has been read, so the row cannot flash in
  // for someone who already dismissed it or already has a profile.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (profile?.nudges[NUDGE_ID]) return;
    if (profileCompleteness(profile) >= 1) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <section className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
      <Icon className="shrink-0 text-brand-600" name="target" size={18} />
      <p className="min-w-0 flex-1 text-[13px] leading-5 text-ink-700">
        建立档案后，这里的每个项目都会显示它与你的差距——语言、时间、材料和预算。
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/profile?return=${encodeURIComponent(pathname ?? "/schools")}`}
          className="inline-flex h-9 items-center rounded-lg bg-ink-900 px-3 text-[13px] font-semibold text-white transition hover:bg-ink-700"
        >
          2 分钟建立档案
        </Link>
        <button
          type="button"
          onClick={() => {
            dismissNudge(NUDGE_ID);
            setVisible(false);
          }}
          aria-label="不再显示建立档案提示"
          className="inline-flex h-9 items-center rounded-lg px-2 text-[13px] text-ink-500 transition hover:text-ink-700"
        >
          不再提示
        </button>
      </div>
    </section>
  );
}
