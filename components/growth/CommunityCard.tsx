"use client";

import { useEffect, useState } from "react";
import { emit } from "@/lib/growth/emit";
import { useTrackOnMount } from "@/components/growth/Track";
import { Icon } from "@/components/ui/Icon";

/**
 * The community guidance card (B-track B1, merged into E2).
 *
 * One component, three placements, all of them moments of demonstrated intent
 * rather than interruptions: just after a first submit, on the review screen,
 * and as a thin dismissible rule on the Lab overview. It is the site's only
 * outbound touchpoint — there is no signup, no form, and nothing is collected
 * here (Business Blueprint §2, §3 Q4).
 *
 * Tone follows the private-domain playbook: state what the group is for and
 * let the learner decide. No urgency, no scarcity, no claim about scores. The
 * Lab copy red lines apply verbatim — nothing on this card estimates, predicts,
 * or counts down anything.
 */

/** Placement slugs, ≤32 chars, matching the `placement` field in the contract. */
export type CommunityPlacement = "result" | "review" | "overview";

/**
 * The WeCom group live QR, supplied by the owner as a static asset.
 *
 * A live code so the group can roll over when it fills; see
 * `public/community/README.md` for the exact filename expected here.
 */
const QR_SRC = "/community/wecom-group-qr.png";

/** Banner dismissal. `stage.*` key convention, same pattern as the starter strip. */
const DISMISS_KEY = "stage.ielts.community";

const HEADING = "加入 STAGE 备考社群";
const LEAD = "扫码进入企业微信交流群，和同样在准备海外音乐院校的同学一起备考。";
const POINTS = [
  "院校与专业申请要点的整理与更新提醒",
  "作品集、申请材料与面试准备的答疑",
  "备考节奏与练习方法的日常交流",
] as const;
const PRIVACY_NOTE = "群内不涉及你的练习内容——本站的练习记录只保存在本机浏览器。";

/** Marks the click before the learner's attention leaves for their phone. */
function onQrEngage(placement: CommunityPlacement): void {
  emit("community_card_click", { placement });
}

/**
 * The full card, for the result panel and the review screen.
 *
 * `shown` fires on mount rather than on scroll: these two placements sit in the
 * first screen of their surface, so mount and visibility are the same moment,
 * and an IntersectionObserver would be machinery for no extra truth.
 */
export function CommunityCard({
  placement,
  className = "",
}: {
  placement: Exclude<CommunityPlacement, "overview">;
  className?: string;
}) {
  useTrackOnMount("community_card_shown", { placement });

  return (
    <aside
      aria-labelledby={`community-${placement}-heading`}
      className={`rounded-stage-lg border border-stage-border bg-stage-bg p-[18px] ${className}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h2
            id={`community-${placement}-heading`}
            className="text-stage-sm font-semibold text-stage-fg"
          >
            {HEADING}
          </h2>
          <p className="mt-1.5 max-w-stage-measure text-stage-xs leading-[1.7] text-stage-fg-body">
            {LEAD}
          </p>
          <ul className="mt-3 space-y-1.5">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-stage-xs leading-[1.7] text-stage-fg-muted"
              >
                <span aria-hidden className="grid flex-none pt-[3px] text-stage-primary">
                  <Icon name="check" size={13} strokeWidth={2.5} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-stage-2xs leading-[1.6] text-stage-fg-subtle">
            {PRIVACY_NOTE}
          </p>
        </div>

        <QrPanel placement={placement} />
      </div>
    </aside>
  );
}

/**
 * The QR itself.
 *
 * A plain `<img>`: the source is a static asset of fixed size that must render
 * at its natural scale to stay scannable, and `next/image` would add a layout
 * pipeline for no benefit (the same reasoning the listening map labels use).
 *
 * `onPointerDown` rather than `onClick` because the gesture that matters here
 * is a phone being raised, not a click that may never come.
 */
function QrPanel({ placement }: { placement: CommunityPlacement }) {
  return (
    <div
      onPointerDown={() => onQrEngage(placement)}
      className="flex flex-none flex-col items-center gap-2 self-center sm:self-start"
    >
      <img
        src={QR_SRC}
        alt="STAGE 备考社群企业微信群二维码"
        width={132}
        height={132}
        className="h-[132px] w-[132px] rounded-stage-sm border border-stage-border bg-stage-bg-soft object-contain"
      />
      <p className="text-stage-2xs text-stage-fg-subtle">用微信扫码进群</p>
    </div>
  );
}

/**
 * The overview placement: a thin rule, never a banner.
 *
 * The Plan forbids marketing-weight promos inside the study surface, so this
 * matches the starter strip's treatment exactly — one row, one close button,
 * and a dismissal that persists. Rendered only after the flag has been read so
 * a returning learner never sees it flash.
 */
export function CommunityBanner() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(DISMISS_KEY) !== "dismissed");
    } catch {
      // Private-mode storage refusal: show it, it costs one row.
      setVisible(true);
    }
  }, []);

  useTrackOnMount("community_card_shown", { placement: "overview" }, visible);

  if (!visible) return null;

  return (
    <aside
      aria-label="备考社群"
      className="rounded-stage-md border border-stage-border px-4 py-[11px]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 text-stage-xs text-stage-fg-body">
          <span className="font-medium">{HEADING}</span>
          <span className="text-stage-fg-subtle">
            {" "}
            — 和同样在准备海外音乐院校的同学交流申请与备考。
          </span>
        </p>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen((current) => !current);
            if (!open) onQrEngage("overview");
          }}
          className="rounded-stage-sm border border-stage-border-strong bg-stage-bg px-2.5 py-1 text-stage-2xs text-stage-fg transition-colors duration-stage-fast hover:bg-stage-bg-soft"
        >
          {open ? "收起二维码" : "查看二维码"}
        </button>
        <button
          type="button"
          aria-label="关闭社群提示"
          title="关闭社群提示"
          onClick={() => {
            setVisible(false);
            try {
              window.localStorage.setItem(DISMISS_KEY, "dismissed");
            } catch {
              // Dismissal is a preference; failing to store it is not an error.
            }
          }}
          className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-stage-sm border border-transparent text-stage-fg-muted transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-bg-soft hover:text-stage-fg"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      {open ? (
        <div className="mt-3 border-t border-stage-border pt-3">
          <QrPanel placement="overview" />
          <p className="mt-2 text-stage-2xs leading-[1.6] text-stage-fg-subtle">
            {PRIVACY_NOTE}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
