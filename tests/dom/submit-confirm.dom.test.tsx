/**
 * The 交卷 confirmation, as a candidate meets it.
 *
 * `listening-practice-utils` already pins the two copy decisions as pure
 * functions; what only a document can show is that the gap list is *reachable*
 * — that each number is a real button, that pressing one navigates instead of
 * handing the paper in, and that the label the helper returns is the label on
 * the button.
 *
 * The double-click case is asserted against the composition rather than the
 * component. `SubmitConfirm` is a controlled dialog: it does not own whether it
 * is open, so it cannot swallow a second click on its own, and giving it that
 * responsibility would put a second submit guard beside the reducer's. The
 * harness below is the page's own wiring — confirm closes the dialog — and it
 * is that arrangement, not the button, that has to survive a double click.
 */
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { SubmitConfirm } from "@/components/ielts/listening/SubmitConfirm";

describe("SubmitConfirm", () => {
  test("lists each unanswered question as its own button", async () => {
    const onGoToQuestion = vi.fn();
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <SubmitConfirm
        unanswered={[3, 5, 8]}
        total={8}
        onGoToQuestion={onGoToQuestion}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("还有 3 题未作答（共 8 题）：")).toBeTruthy();

    for (const no of [3, 5, 8]) {
      expect(screen.getByRole("button", { name: `前往第 ${no} 题` })).toBeTruthy();
    }

    await user.click(screen.getByRole("button", { name: "前往第 5 题" }));

    expect(onGoToQuestion).toHaveBeenCalledTimes(1);
    expect(onGoToQuestion).toHaveBeenCalledWith(5);
    // The whole point of the gap list: it is a way *back into* the paper, and
    // touching it must never be a way out of it.
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("renders no gap list when the paper is complete", () => {
    render(
      <SubmitConfirm
        unanswered={[]}
        total={8}
        onGoToQuestion={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("全部 8 题均已作答。")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /前往第/ })).toBeNull();
  });

  test("the confirm word changes with the state of the paper", () => {
    const { unmount } = render(
      <SubmitConfirm
        unanswered={[2]}
        total={8}
        onGoToQuestion={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "仍要交卷" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "确认交卷" })).toBeNull();
    unmount();

    render(
      <SubmitConfirm
        unanswered={[]}
        total={8}
        onGoToQuestion={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "确认交卷" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "仍要交卷" })).toBeNull();
  });

  test("a double click on 确认交卷 hands the paper in once", async () => {
    const submit = vi.fn();
    const user = userEvent.setup();

    /** The page's arrangement: confirming closes the dialog and submits. */
    function Harness() {
      const [open, setOpen] = useState(true);
      if (!open) return <p>已交卷</p>;
      return (
        <SubmitConfirm
          unanswered={[]}
          total={8}
          onGoToQuestion={() => {}}
          onConfirm={() => {
            setOpen(false);
            submit();
          }}
          onCancel={() => setOpen(false)}
        />
      );
    }

    render(<Harness />);
    await user.dblClick(screen.getByRole("button", { name: "确认交卷" }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.getByText("已交卷")).toBeTruthy();
  });
});
