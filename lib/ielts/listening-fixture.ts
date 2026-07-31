/**
 * An in-memory `ListeningSetSource` over one original practice set.
 *
 * The material here is written for this repository. Nothing in it is taken
 * from, adapted from, or paraphrased out of Cambridge or any other official
 * IELTS publication, and the audio is a generated silent placeholder rather
 * than a recording — see `scripts/make-silence-mp3.mjs`. The set exists to
 * exercise all five group types and the four inline form patterns end to end
 * before any real bank is wired up.
 *
 * This module is the only place the fixture data may be imported from outside
 * the tests; feature code depends on `ListeningSetSource`, never on this file.
 */
import type { ListeningSetSource } from "./listening-source.ts";
import type {
  ListeningSet,
  ListeningSetSummary,
  ScoringRule,
} from "./listening-types.ts";
import { questionNumbers } from "./listening-runner.ts";

export const SILENCE_PLACEHOLDER_AUDIO = "/fixtures/audio/silence-placeholder.mp3";

export const MUSEUM_MEMBERSHIP_SET: ListeningSet = {
  id: "museum-membership-enquiry",
  title: "Museum Membership Enquiry",
  titleZh: "博物馆会员咨询",
  part: 1,
  frequency: "high",
  audioUrl: SILENCE_PLACEHOLDER_AUDIO,
  durationSec: 330,
  questionGroups: [
    {
      type: "form_completion",
      instruction:
        "Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
      formTitle: "Membership application",
      rows: [
        // text + blank — the given first name, the surname to be caught.
        {
          label: "Name",
          segments: [
            { kind: "text", value: "Helena" },
            { kind: "blank", questionNo: 1 },
          ],
        },
        // text + blank — the postcode's outward letters are printed.
        {
          label: "Postcode",
          segments: [
            { kind: "text", value: "BS" },
            { kind: "blank", questionNo: 2 },
          ],
        },
        {
          label: "Phone",
          segments: [{ kind: "blank", questionNo: 3 }],
        },
        // blank + text — the tier name lands before the printed noun.
        {
          label: "Type",
          segments: [
            { kind: "blank", questionNo: 4 },
            { kind: "text", value: "membership" },
          ],
        },
        // text + blank — the currency mark is printed, so the answer is bare.
        {
          label: "Annual fee",
          segments: [
            { kind: "text", value: "£" },
            { kind: "blank", questionNo: 5 },
          ],
        },
      ],
    },
    {
      type: "mcq_multi",
      questionNo: 6,
      question: "Which TWO benefits are included at this membership level?",
      selectCount: 2,
      options: [
        { label: "A", text: "free entry to temporary exhibitions" },
        { label: "B", text: "a monthly printed magazine" },
        { label: "C", text: "discounted tickets for guests" },
        { label: "D", text: "priority booking for evening talks" },
        { label: "E", text: "free parking on weekdays" },
      ],
    },
    {
      type: "map_labelling",
      questionNo: 7,
      question: "Where is the members' desk?",
      labels: ["A", "B", "C", "D", "E"],
      imageUrl: undefined,
    },
    {
      type: "matching",
      questionNo: 8,
      question: "Which floor holds the textile collection?",
      options: ["ground floor", "first floor", "second floor"],
    },
  ],
};

/**
 * Answers for the set above. Two questions accept more than one form: the
 * postcode may be written with or without its internal space, and the fee may
 * be written in digits or in words.
 */
export const MUSEUM_MEMBERSHIP_RULES: ScoringRule[] = [
  {
    questionNo: 1,
    accepted: ["Marchetti"],
    normalize: ["trim", "lowercase"],
  },
  {
    questionNo: 2,
    accepted: ["1 5TR", "15TR"],
    normalize: ["trim", "lowercase", "collapseSpaces"],
  },
  {
    questionNo: 3,
    accepted: ["07700 900142", "07700900142"],
    normalize: ["trim", "collapseSpaces"],
  },
  {
    questionNo: 4,
    accepted: ["silver"],
    normalize: ["trim", "lowercase"],
  },
  {
    // trim first, so a pasted " £25 " still has a *leading* £ to strip.
    questionNo: 5,
    accepted: ["25", "twenty-five", "twenty five"],
    normalize: ["trim", "lowercase", "stripCurrency", "collapseSpaces"],
  },
  {
    questionNo: 6,
    accepted: ["A", "C"],
    normalize: ["trim", "lowercase"],
  },
  {
    questionNo: 7,
    accepted: ["C"],
    normalize: ["trim", "lowercase"],
  },
  {
    questionNo: 8,
    accepted: ["first floor"],
    normalize: ["trim", "lowercase", "collapseSpaces"],
  },
];

const SETS: ListeningSet[] = [MUSEUM_MEMBERSHIP_SET];

const RULES: Record<string, ScoringRule[]> = {
  [MUSEUM_MEMBERSHIP_SET.id]: MUSEUM_MEMBERSHIP_RULES,
};

function summarize(set: ListeningSet): ListeningSetSummary {
  return {
    id: set.id,
    title: set.title,
    titleZh: set.titleZh,
    part: set.part,
    frequency: set.frequency,
    questionCount: questionNumbers(set).length,
  };
}

export class FixtureSetSource implements ListeningSetSource {
  async listSets(): Promise<ListeningSetSummary[]> {
    return SETS.map(summarize);
  }

  async getSet(id: string): Promise<ListeningSet> {
    const set = SETS.find((candidate) => candidate.id === id);
    if (!set) throw new Error(`Unknown listening set: ${id}`);
    return set;
  }

  async getScoringRules(id: string): Promise<ScoringRule[]> {
    const rules = RULES[id];
    if (!rules) throw new Error(`Unknown listening set: ${id}`);
    return rules;
  }
}
