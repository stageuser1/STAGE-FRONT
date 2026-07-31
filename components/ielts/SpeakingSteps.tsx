"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { SPEAKING_STEPS } from "@/lib/ielts/speaking-session";
import { Icon } from "@/components/ui/Icon";

/**
 * The five-step rail, resident above 题目 and above every step of the flow.
 *
 * Geometry read from the approved export's `SpeakingScreen.jsx` (`spSt.steps` /
 * `.step` / `.stepN` / `.arrow`): a hairline-ruled row of underline tabs, 13px
 * labels, an 18px numbered disc, chevrons between. A completed step turns green
 * and swaps its number for a tick, so the state survives greyscale.
 *
 * One component for two surfaces, because the rail spans a page boundary: 题目
 * is the catalog route and the other four are the question route, and a rail
 * that looked different on either side would read as two different rails.
 */
export function SpeakingSteps({
  current,
  /**
   * Where step 1 goes. Absent on the catalog itself, where step 1 *is* the
   * page — the design's rail is a filter over one screen; here it has to be a
   * link, and a link to the page you are on is noise.
   */
  catalogHref,
  /** Jump to another step of the flow. Absent on the catalog: no question yet. */
  onGo,
}: {
  current: number;
  catalogHref?: string;
  onGo?: (step: number) => void;
}) {
  const activeRef = useRef<HTMLDivElement>(null);

  // Five tabs do not fit a 390px viewport, so the rail scrolls. Bring the
  // current step into it: a learner on 独立表达 would otherwise land on a row
  // showing only the two steps they have already left.
  useEffect(() => {
    // `block: "nearest"` so pulling the rail sideways never scrolls the page.
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current]);

  return (
    <nav
      aria-label="口语五步流程"
      className="flex items-center overflow-x-auto border-b border-stage-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {SPEAKING_STEPS.map((entry, index) => {
        const active = entry.index === current;
        const done = entry.index < current;
        const content = (
          <>
            <span
              aria-hidden
              className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-stage-pill font-stage-mono text-[10px] ${
                done
                  ? "bg-stage-green-500 text-stage-fg-on-dark"
                  : active
                    ? "bg-stage-primary text-stage-fg-on-dark"
                    : "bg-stage-neutral-100 text-stage-fg-subtle"
              }`}
            >
              {done ? "✓" : entry.index + 1}
            </span>
            {done ? <span className="sr-only">已完成，</span> : null}
            {entry.label}
          </>
        );

        const shape = `inline-flex items-center gap-[7px] whitespace-nowrap border-b-2 px-[clamp(7px,1vw,16px)] pb-[13px] text-stage-xs transition-colors duration-stage-fast ease-stage-standard ${
          active
            ? "border-stage-primary font-semibold text-stage-fg"
            : done
              ? "border-transparent font-medium text-stage-primary"
              : "border-transparent font-medium text-stage-fg-subtle"
        }`;

        return (
          <div
            key={entry.index}
            ref={active ? activeRef : undefined}
            className="-mb-px flex items-center"
          >
            {index > 0 ? (
              <span aria-hidden className="grid flex-none pb-[13px] text-stage-neutral-300">
                <Icon name="chevron-right" size={14} />
              </span>
            ) : null}
            {entry.index === 0 && catalogHref ? (
              <Link href={catalogHref} className={shape}>
                {content}
              </Link>
            ) : onGo && !active ? (
              <button type="button" onClick={() => onGo(entry.index)} className={shape}>
                {content}
              </button>
            ) : (
              <span aria-current={active ? "step" : undefined} className={shape}>
                {content}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
