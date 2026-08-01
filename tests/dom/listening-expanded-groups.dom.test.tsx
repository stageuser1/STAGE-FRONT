import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";

import { FormCompletionGroup } from "@/components/ielts/listening/FormCompletionGroup";
import { MapLabellingGroup } from "@/components/ielts/listening/MapLabellingGroup";
import { MatchingGroup } from "@/components/ielts/listening/MatchingGroup";
import { McqMultiGroup } from "@/components/ielts/listening/McqMultiGroup";
import { ListeningAttemptProvider, useListeningAttempt } from "@/lib/ielts/listening-attempt";
import type {
  FormCompletionGroup as FormCompletionGroupType,
  ListeningSet,
  MapLabellingGroup as MapLabellingGroupType,
  MatchingGroup as MatchingGroupType,
  McqMultiGroup as McqMultiGroupType,
} from "@/lib/ielts/listening-types";

const SET: ListeningSet = {
  id: "expanded-rendering",
  title: "Expanded rendering",
  titleZh: null,
  part: 2,
  frequency: "mid",
  audioUrl: "/audio/test.mp3",
  durationSec: 120,
  questionGroups: [
    {
      type: "mcq_multi",
      instruction: "Questions 17–18. Choose TWO letters.",
      questions: [
        {
          questionNo: 17,
          prompt: "First reason",
          options: [
            { label: "A", text: "First option" },
            { label: "B", text: "Second option" },
          ],
          selectCount: 1,
        },
        {
          questionNo: 18,
          prompt: "Second reason",
          options: [
            { label: "A", text: "First option" },
            { label: "B", text: "Second option" },
          ],
          selectCount: 1,
        },
      ],
      questionNo: 17,
      question: "First reason",
      options: [{ label: "A", text: "First option" }],
      selectCount: 2,
    },
    {
      type: "matching",
      questions: [
        {
          questionNo: 19,
          prompt: "Choose the hotel",
          options: [
            { id: "hotel-a", text: "Royal Hotel" },
            { id: "hotel-b", text: "Star Hotel" },
          ],
        },
      ],
      questionNo: 19,
      question: "Choose the hotel",
      options: ["hotel-a", "hotel-b"],
      optionItems: [
        { id: "hotel-a", text: "Royal Hotel" },
        { id: "hotel-b", text: "Star Hotel" },
      ],
    },
    {
      type: "map_labelling",
      questions: [
        { questionNo: 20, prompt: "North entrance", labels: ["A", "B"] },
        { questionNo: 21, prompt: "South entrance", labels: ["A", "B"] },
      ],
      questionNo: 20,
      question: "North entrance",
      labels: ["A", "B"],
      imageUrl: "/ielts/listening/images/test-map.png",
    },
    {
      type: "form_completion",
      layout: "notes",
      instruction: "Complete the notes.",
      formTitle: "Visitor notes",
      rows: [
        { label: "Name", segments: [{ kind: "blank", questionNo: 22 }] },
      ],
    },
  ],
};

const multi = SET.questionGroups[0] as McqMultiGroupType;
const matching = SET.questionGroups[1] as MatchingGroupType;
const map = SET.questionGroups[2] as MapLabellingGroupType;
const form = SET.questionGroups[3] as FormCompletionGroupType;

function Harness({ children }: { children: ReactNode }) {
  const value = useListeningAttempt(SET, "2026-08-01T09:00:00.000Z");
  return <ListeningAttemptProvider value={value}>{children}</ListeningAttemptProvider>;
}

describe("expanded Listening question groups", () => {
  test("renders every numbered multiple-choice question and records separately", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <McqMultiGroup group={multi} />
      </Harness>,
    );

    expect(screen.getByText("Questions 17–18. Choose TWO letters.")).toBeTruthy();
    expect(screen.getByText("First reason")).toBeTruthy();
    expect(screen.getByText("Second reason")).toBeTruthy();

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(4);
    await user.click(radios[0]);
    await user.click(radios[3]);
    expect(radios[0].checked).toBe(true);
    expect(radios[3].checked).toBe(true);
  });

  test("renders matching optionItems and stores the option id", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <MatchingGroup group={matching} />
      </Harness>,
    );

    const starHotel = screen.getByRole("radio", { name: "Star Hotel" }) as HTMLInputElement;
    expect(screen.getByText("Royal Hotel")).toBeTruthy();
    await user.click(starHotel);
    expect(starHotel.checked).toBe(true);
    expect(starHotel.value).toBe("hotel-b");
  });

  test("renders one map image and every numbered map question", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <MapLabellingGroup group={map} />
      </Harness>,
    );

    expect(screen.getByRole("img")).toBeTruthy();
    expect(screen.getByText("North entrance")).toBeTruthy();
    expect(screen.getByText("South entrance")).toBeTruthy();

    const labels = screen.getAllByRole("button", { name: "A" });
    expect(labels).toHaveLength(2);
    await user.click(labels[1]);
    expect(labels[1].getAttribute("aria-pressed")).toBe("true");
  });

  test("keeps FormSegment rendering across layout variants", () => {
    render(
      <Harness>
        <FormCompletionGroup group={form} />
      </Harness>,
    );

    expect(document.querySelector('[data-form-layout="notes"]')).toBeTruthy();
    expect(screen.getByLabelText("Question 22, Name")).toBeTruthy();
  });
});
