/**
 * 回顾模式, over a real paper.
 *
 * The toggle is the one thing in B5 that has no pure function behind it: the
 * marking is `scoreAttempt`'s and already proved, and what review mode adds is
 * *where* that marking appears. So the whole guarantee lives in the document —
 * inert before submit, live after it, verdicts under each card while it is on
 * and gone when it is off, and the paper still frozen throughout.
 *
 * The fixture set is used rather than a synthetic one, because the strips are
 * drawn per group and the fixture is the only set that carries a form-
 * completion card holding five questions beside three single-question cards.
 * A synthetic paper would have quietly tested one card shape.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { ListeningPractice } from "@/components/ielts/listening/ListeningPractice";
import {
  MUSEUM_MEMBERSHIP_RULES,
  MUSEUM_MEMBERSHIP_SET,
} from "@/lib/ielts/listening-fixture";

/** The strips, one per card, only present while review mode is on. */
function strips(): HTMLElement[] {
  return screen.queryAllByLabelText("本题回顾");
}

function toggle(): HTMLElement {
  return screen.getByText("回顾模式");
}

/**
 * Answer three of the fixture's eight — two right, one wrong — and hand it in.
 *
 * Deliberately not a full paper: the strips have to be right about a blank
 * question as well as a marked one, and 未作答 is a state only an unanswered
 * question produces.
 */
async function submitPartialPaper(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: "Question 1, Name" }),
    "Marchetti",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Question 4, Type" }),
    "gold",
  );
  await user.click(
    screen.getByLabelText("free entry to temporary exhibitions", { exact: false }),
  );
  await user.click(
    screen.getByLabelText("discounted tickets for guests", { exact: false }),
  );

  await user.click(screen.getByRole("button", { name: "交卷" }));
  await user.click(screen.getByRole("button", { name: "仍要交卷" }));
}

function renderPractice() {
  return render(
    <ListeningPractice
      set={MUSEUM_MEMBERSHIP_SET}
      rules={MUSEUM_MEMBERSHIP_RULES}
    />,
  );
}

describe("回顾模式", () => {
  test("is inert until there is a result to review", () => {
    renderPractice();

    const control = toggle();
    expect(control.tagName).toBe("SPAN");
    expect(control.getAttribute("aria-disabled")).toBe("true");
    // Nothing to review, and nothing rendered as though there were.
    expect(strips()).toHaveLength(0);
  });

  test("becomes a real control once the paper is in", async () => {
    const user = userEvent.setup();
    renderPractice();
    await submitPartialPaper(user);

    const control = screen.getByRole("button", { name: "回顾模式" });
    expect(control.getAttribute("aria-pressed")).toBe("false");
    // Submitting alone does not open review mode; the result card is the
    // default and the strips are opt-in.
    expect(strips()).toHaveLength(0);
    expect(screen.getByRole("region", { name: "本卷结果" })).toBeTruthy();
  });

  test("puts a verdict under every card, and takes them away again", async () => {
    const user = userEvent.setup();
    renderPractice();
    await submitPartialPaper(user);

    await user.click(screen.getByRole("button", { name: "回顾模式" }));

    // One strip per question group — four cards in this set.
    expect(strips()).toHaveLength(MUSEUM_MEMBERSHIP_SET.questionGroups.length);
    expect(
      screen.getByRole("button", { name: "回顾模式" }).getAttribute("aria-pressed"),
    ).toBe("true");

    await user.click(screen.getByRole("button", { name: "回顾模式" }));

    expect(strips()).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "回顾模式" }).getAttribute("aria-pressed"),
    ).toBe("false");
    // The result card is untouched by the toggle: it is the report, and review
    // mode is a second way of reading it rather than a replacement.
    expect(screen.getByRole("region", { name: "本卷结果" })).toBeTruthy();
  });

  test("each strip marks its own card's questions, in context", async () => {
    const user = userEvent.setup();
    renderPractice();
    await submitPartialPaper(user);
    await user.click(screen.getByRole("button", { name: "回顾模式" }));

    const [form, multi, map, matching] = strips();

    // The form card holds Q1–Q5, and only those.
    const formRows = within(form).getAllByRole("listitem");
    expect(formRows).toHaveLength(5);
    expect(within(formRows[0]).getByText("你的答案：Marchetti")).toBeTruthy();
    expect(within(formRows[0]).getByText("正确")).toBeTruthy();

    // Q4 was answered "gold" against an accepted "silver".
    expect(within(formRows[3]).getByText("你的答案：gold")).toBeTruthy();
    expect(within(formRows[3]).getByText("正确答案：silver")).toBeTruthy();
    expect(within(formRows[3]).getByText("错误")).toBeTruthy();

    // Q2 was never answered. A gap is a gap, not a wrong answer of "".
    expect(within(formRows[1]).getByText("未作答")).toBeTruthy();
    // And a blank question still prints the key — that is the point of review.
    expect(within(formRows[1]).getByText("正确答案：1 5TR / 15TR")).toBeTruthy();

    // The three single-question cards carry exactly one row each.
    expect(within(multi).getAllByRole("listitem")).toHaveLength(1);
    expect(within(multi).getByText("你的答案：A, C")).toBeTruthy();
    expect(within(multi).getByText("正确")).toBeTruthy();

    expect(within(map).getAllByRole("listitem")).toHaveLength(1);
    expect(within(map).getByText("未作答")).toBeTruthy();

    expect(within(matching).getAllByRole("listitem")).toHaveLength(1);
    expect(within(matching).getByText("正确答案：first floor")).toBeTruthy();
  });

  test("the paper stays frozen and the audio stays usable in review mode", async () => {
    const user = userEvent.setup();
    renderPractice();
    await submitPartialPaper(user);
    await user.click(screen.getByRole("button", { name: "回顾模式" }));

    // Read-only: every answer control is disabled, in review mode as out of it.
    const name = screen.getByRole("textbox", { name: "Question 1, Name" });
    expect((name as HTMLInputElement).disabled).toBe(true);
    expect(
      screen
        .getAllByRole("checkbox")
        .every((box) => (box as HTMLInputElement).disabled),
    ).toBe(true);

    // The transport is not gated on the attempt: replaying the recording is
    // most of what reviewing a listening paper is.
    expect(
      (screen.getByRole("button", { name: "播放" }) as HTMLButtonElement).disabled,
    ).toBe(false);

    // And the bar carries no markers, because the set carries no timestamps —
    // the player's `anchors` prop is absent rather than filled with invented
    // ones. The name matched here is the one the player gives a real marker.
    expect(
      screen.queryAllByRole("button", { name: /^跳转到第 \d+ 题/ }),
    ).toHaveLength(0);
  });
});
