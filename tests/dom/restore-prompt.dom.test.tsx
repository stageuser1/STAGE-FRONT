/**
 * "You left a paper open."
 *
 * Two things are worth a document. The summary is the whole reason the dialog
 * is not a bare 继续/重新开始 — a candidate cannot weigh a destructive choice
 * without seeing what it destroys — so the counts have to be on screen and
 * correct. And the two buttons are not interchangeable: 重新开始 deletes the
 * draft, so a wiring slip that crossed the callbacks would silently throw away
 * the work the dialog exists to protect.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { RestorePrompt } from "@/components/ielts/listening/RestorePrompt";
import { MUSEUM_MEMBERSHIP_SET } from "@/lib/ielts/listening-fixture";
import type { Attempt } from "@/lib/ielts/listening-types";

/** Three of the fixture's eight answered, one of them blank on purpose. */
const DRAFT: Attempt = {
  setId: MUSEUM_MEMBERSHIP_SET.id,
  answers: {
    1: { questionNo: 1, value: "Marchetti" },
    3: { questionNo: 3, value: "07700 900142" },
    // Whitespace is not an answer — the summary must not count this one.
    4: { questionNo: 4, value: "   " },
    6: { questionNo: 6, value: ["A", "C"] },
  },
  startedAt: "2026-08-01T09:00:00.000Z",
  elapsedSec: 754,
  status: "in_progress",
};

function renderPrompt(overrides: Partial<Parameters<typeof RestorePrompt>[0]> = {}) {
  const onContinue = vi.fn();
  const onRestart = vi.fn();
  render(
    <RestorePrompt
      set={MUSEUM_MEMBERSHIP_SET}
      attempt={DRAFT}
      onContinue={onContinue}
      onRestart={onRestart}
      {...overrides}
    />,
  );
  return { onContinue, onRestart };
}

describe("RestorePrompt", () => {
  test("summarises what the stored draft actually holds", () => {
    renderPrompt();

    expect(screen.getByRole("dialog", { name: "继续上次练习？" })).toBeTruthy();
    // Three of eight: the whitespace-only answer to Q4 is not work.
    expect(screen.getByText("3 / 8 题")).toBeTruthy();
    expect(screen.getByText("00:12:34")).toBeTruthy();
    expect(
      screen.getByText("重新开始会删除这份记录，且无法恢复。"),
    ).toBeTruthy();
  });

  test("继续上次练习 restores and does not restart", async () => {
    const user = userEvent.setup();
    const { onContinue, onRestart } = renderPrompt();

    await user.click(screen.getByRole("button", { name: "继续上次练习" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onRestart).not.toHaveBeenCalled();
  });

  test("重新开始 restarts and does not restore", async () => {
    const user = userEvent.setup();
    const { onContinue, onRestart } = renderPrompt();

    await user.click(screen.getByRole("button", { name: "重新开始" }));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  test("Escape resolves to the non-destructive choice", async () => {
    const user = userEvent.setup();
    const { onContinue, onRestart } = renderPrompt();

    await user.keyboard("{Escape}");

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onRestart).not.toHaveBeenCalled();
  });
});
