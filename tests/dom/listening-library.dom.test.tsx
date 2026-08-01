/**
 * The bank list: filters that compose, and a URL that carries them.
 *
 * `tests/ielts_listening_library_utils.test.mjs` already proves the filter
 * algebra and the parse/serialize round trip as functions. What only a document
 * shows is that the component is wired to them — that a pill actually narrows
 * the list, that landing on a filtered URL renders the filtered list rather
 * than the whole bank, that the query string the component writes is the one
 * those helpers produce, and that a Back navigation is adopted instead of being
 * overwritten by the component's own last write.
 *
 * The rows here are synthetic. The real bank holds one set, and one row cannot
 * demonstrate that a filter excludes anything. Nothing in this file is claimed
 * to be practice material, and the app never renders it.
 */
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { ListeningLibrary } from "@/components/ielts/listening/ListeningLibrary";
import { storageKey } from "@/lib/ielts/listening-persist";
import { serializeAttempt } from "@/lib/ielts/listening-runner";
import type {
  Attempt,
  ListeningPart,
  ScoringRule,
} from "@/lib/ielts/listening-types";
import type { LibraryRow } from "@/lib/ielts/listening-library-utils";

import { __navigations, __query, __reset, __setUrl } from "./stubs/next-navigation";

const ROWS: LibraryRow[] = [
  {
    id: "museum",
    title: "Museum Membership Enquiry",
    titleZh: "博物馆会员咨询",
    part: 1 as ListeningPart,
    frequency: "high",
    questionCount: 8,
    types: ["form_completion", "mcq_multi", "matching"],
  },
  {
    id: "campus",
    title: "Campus Tour Briefing",
    titleZh: "校园导览说明",
    part: 2 as ListeningPart,
    frequency: "mid",
    questionCount: 10,
    types: ["mcq_single", "map_labelling"],
  },
  {
    id: "seminar",
    title: "Research Methods Seminar",
    titleZh: "研究方法研讨",
    part: 3 as ListeningPart,
    frequency: "high",
    questionCount: 6,
    types: ["matching"],
  },
];

/** Four questions, of which a candidate below gets two right. */
const MUSEUM_RULES: ScoringRule[] = [1, 2, 3, 4].map((questionNo) => ({
  questionNo,
  mode: "text" as const,
  accepted: [`answer-${questionNo}`],
  normalize: ["trim", "lowercase"],
}));

const RULES: Record<string, ScoringRule[]> = { museum: MUSEUM_RULES };

/** A handed-in paper: two of four right. */
function submittedMuseumAttempt(): Attempt {
  return {
    setId: "museum",
    answers: {
      1: { questionNo: 1, value: "answer-1" },
      2: { questionNo: 2, value: "answer-2" },
      3: { questionNo: 3, value: "wrong" },
    },
    startedAt: "2026-08-01T09:00:00.000Z",
    elapsedSec: 420,
    status: "submitted",
  };
}

function store(setId: string, attempt: Attempt): void {
  window.localStorage.setItem(storageKey(setId), serializeAttempt(attempt));
}

function renderLibrary() {
  return render(<ListeningLibrary rows={ROWS} rulesById={RULES} />);
}

/**
 * The visible rows, by their English title, in source order.
 *
 * Read back out of the document rather than out of the component's props, so
 * an assertion here is about what a candidate can see.
 */
function titles(): string[] {
  return ROWS.filter((row) => screen.queryByText(row.title) !== null).map(
    (row) => row.title,
  );
}

beforeEach(() => {
  __reset();
});

describe("ListeningLibrary", () => {
  test("renders one row per set, with no invented average", () => {
    renderLibrary();

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Museum Membership Enquiry")).toBeTruthy();
    expect(screen.getByText("博物馆会员咨询 · 8 题")).toBeTruthy();

    // One per row, and every one of them an em dash: Phase 1 has no population
    // of attempts, so there is no average to print.
    expect(screen.getAllByText("平均 —")).toHaveLength(3);
    // Nothing has been practised, so no row claims a score either.
    expect(screen.getAllByText("我的 —")).toHaveLength(3);
  });

  test("套题匹配 is inert rather than a button that does nothing", () => {
    renderLibrary();

    const control = screen.getByText("套题匹配");
    expect(control.tagName).toBe("SPAN");
    expect(control.getAttribute("aria-disabled")).toBe("true");
    expect(control.getAttribute("title")).toBe("即将上线");
  });

  test("a chip and a search compose with AND", async () => {
    const user = userEvent.setup();
    renderLibrary();

    // 高频 alone: the museum set and the seminar.
    await user.click(screen.getByRole("button", { name: "高频" }));
    expect(titles()).toEqual([
      "Museum Membership Enquiry",
      "Research Methods Seminar",
    ]);

    // 匹配 alone would give the same two; the search is what separates them.
    await user.click(screen.getByRole("button", { name: "匹配" }));
    expect(titles()).toEqual([
      "Museum Membership Enquiry",
      "Research Methods Seminar",
    ]);

    await user.type(screen.getByRole("searchbox", { name: "搜索题目" }), "seminar");
    expect(titles()).toEqual(["Research Methods Seminar"]);

    // And an AND that excludes everything is an empty list, not the union.
    await user.click(screen.getByRole("button", { name: "P2" }));
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(
      screen.getByText("没有符合条件的题目，试试调整筛选条件。"),
    ).toBeTruthy();
  });

  test("题型 chips offer only the types the bank holds", () => {
    renderLibrary();

    const row = screen.getByRole("group", { name: "题型" });
    expect(
      within(row)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["全部", "填空", "单选", "多选", "地图标注", "匹配"]);
  });

  test("filters are written to the query string", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "次高频" }));
    await user.click(screen.getByRole("button", { name: "P2" }));

    expect(__query()).toBe("freq=mid&part=2");
    // Replace, not push: a filter row is not a place, and eleven pill clicks
    // must not become eleven things to press Back through.
    expect(__navigations.every((entry) => entry.method === "replace")).toBe(true);

    // Clicking a selected pill clears its facet, and the URL follows it back.
    await user.click(screen.getByRole("button", { name: "次高频" }));
    expect(__query()).toBe("part=2");
  });

  test("landing on a filtered URL renders the filtered list", () => {
    __setUrl("/ielts-lab/listening?q=campus&freq=mid&part=2&type=mcq_single");
    renderLibrary();

    expect(titles()).toEqual(["Campus Tour Briefing"]);
    expect(
      screen.getByRole("button", { name: "次高频", pressed: true }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "P2", pressed: true })).toBeTruthy();
    expect(
      (screen.getByRole("searchbox", { name: "搜索题目" }) as HTMLInputElement)
        .value,
    ).toBe("campus");
  });

  test("a Back navigation is adopted, not overwritten", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "高频" }));
    expect(__query()).toBe("freq=high");

    // The browser moves the URL underneath the component, which is what Back
    // does. The component must follow it rather than push its own state back.
    act(() => {
      __setUrl("/ielts-lab/listening?part=2");
    });

    expect(__query()).toBe("part=2");
    expect(titles()).toEqual(["Campus Tour Briefing"]);
    expect(
      screen.getByRole("button", { name: "高频", pressed: false }),
    ).toBeTruthy();
  });

  test("a stored submitted attempt drives the status, the score and the button", () => {
    store("museum", submittedMuseumAttempt());
    renderLibrary();

    const row = screen.getAllByRole("listitem")[0];
    expect(within(row).getByText("已练习")).toBeTruthy();
    // Two of four, marked from the stored answers — not a remembered number.
    expect(within(row).getByText("我的 50%")).toBeTruthy();
    expect(within(row).getByRole("link", { name: "再次练习" })).toBeTruthy();

    // The other two are untouched and say so.
    const untouched = screen.getAllByRole("listitem")[1];
    expect(within(untouched).getByText("未练习")).toBeTruthy();
    expect(within(untouched).getByText("我的 —")).toBeTruthy();
    expect(within(untouched).getByRole("link", { name: "开始练习" })).toBeTruthy();
  });

  test("an open draft reads 进行中 and offers 继续练习", () => {
    store("museum", {
      ...submittedMuseumAttempt(),
      status: "in_progress",
    });
    renderLibrary();

    const row = screen.getAllByRole("listitem")[0];
    expect(within(row).getByText("进行中")).toBeTruthy();
    expect(within(row).getByRole("link", { name: "继续练习" })).toBeTruthy();
    // A paper still open has no score, and 0% would be a lie about it.
    expect(within(row).getByText("我的 —")).toBeTruthy();
  });

  test("the row links to the practice route", () => {
    renderLibrary();

    const row = screen.getAllByRole("listitem")[0];
    for (const link of within(row).getAllByRole("link")) {
      expect(link.getAttribute("href")).toBe(
        "/ielts-lab/practice/listening/museum",
      );
    }
  });

  test("待重测 renders the empty state rather than guessing at one", async () => {
    const user = userEvent.setup();
    store("museum", submittedMuseumAttempt());
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "待重测" }));

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(
      screen.getByText("没有符合条件的题目，试试调整筛选条件。"),
    ).toBeTruthy();
    expect(__query()).toBe("status=retest");
  });
});
