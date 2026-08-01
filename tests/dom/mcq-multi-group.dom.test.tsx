/**
 * The selection limit on a "choose TWO" question.
 *
 * `multiSelectNext` is already tested as a function: it refuses an over-limit
 * add. That guarantee is invisible to a candidate, though — what they meet is a
 * checkbox that either accepts the click or looks unavailable, and the rejected
 * design (drop the oldest selection to make room) would have passed the pure
 * test just as well while silently discarding an answer.
 *
 * So this asserts the thing only a document can show: at the limit the
 * remaining boxes are `disabled`, unticking one puts them back, and the running
 * count on screen agrees with the attempt underneath.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { McqMultiGroup } from "@/components/ielts/listening/McqMultiGroup";
import {
  ListeningAttemptProvider,
  useListeningAttempt,
} from "@/lib/ielts/listening-attempt";
import { MUSEUM_MEMBERSHIP_SET } from "@/lib/ielts/listening-fixture";
import type { McqMultiGroup as McqMultiGroupType } from "@/lib/ielts/listening-types";

const GROUP = MUSEUM_MEMBERSHIP_SET.questionGroups.find(
  (group): group is McqMultiGroupType => group.type === "mcq_multi",
)!;

/** The group under the same attempt layer the practice page gives it. */
function Harness() {
  const value = useListeningAttempt(MUSEUM_MEMBERSHIP_SET, "2026-08-01T09:00:00.000Z");
  return (
    <ListeningAttemptProvider value={value}>
      <McqMultiGroup group={GROUP} />
    </ListeningAttemptProvider>
  );
}

/** The five checkboxes, in the order the options are printed. */
function boxes(): HTMLInputElement[] {
  return GROUP.options.map(
    (option) => screen.getByLabelText(option.text, { exact: false }) as HTMLInputElement,
  );
}

describe("McqMultiGroup", () => {
  test("disables the remaining options once selectCount is reached", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(GROUP.selectCount).toBe(2);
    expect(screen.getByText("选择2项 · 已选0/2")).toBeTruthy();
    expect(boxes().every((box) => !box.disabled)).toBe(true);

    await user.click(boxes()[0]);
    expect(screen.getByText("选择2项 · 已选1/2")).toBeTruthy();
    // One short of the limit: everything is still open.
    expect(boxes().every((box) => !box.disabled)).toBe(true);

    await user.click(boxes()[2]);
    expect(screen.getByText("选择2项 · 已选2/2")).toBeTruthy();

    const [a, b, c, d, e] = boxes();
    // The two chosen stay live — that is how a candidate changes their mind.
    expect(a.checked).toBe(true);
    expect(a.disabled).toBe(false);
    expect(c.checked).toBe(true);
    expect(c.disabled).toBe(false);
    // The three not chosen are out of reach rather than silently swapping.
    for (const box of [b, d, e]) {
      expect(box.checked).toBe(false);
      expect(box.disabled).toBe(true);
    }
  });

  test("deselecting at the limit re-enables the rest", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[0]);
    await user.click(boxes()[2]);
    expect(boxes()[1].disabled).toBe(true);

    await user.click(boxes()[0]);

    expect(screen.getByText("选择2项 · 已选1/2")).toBeTruthy();
    expect(boxes()[0].checked).toBe(false);
    expect(boxes().every((box) => !box.disabled)).toBe(true);
  });

  test("a disabled option cannot be clicked into the answer", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[0]);
    await user.click(boxes()[1]);
    // At the limit, and the click below lands on a disabled control.
    await user.click(boxes()[4]);

    expect(screen.getByText("选择2项 · 已选2/2")).toBeTruthy();
    expect(boxes()[4].checked).toBe(false);
  });
});
