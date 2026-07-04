import type { Program } from "../types";

export const europeanProgram: Program = {
  id: "vienna-vocal-studies-ba",
  school_id: "vienna-music-academy",
  school_name: "Vienna Academy of Music and Performing Arts",
  country: "AT",
  city: "Vienna",
  name: "Bachelor of Arts - Vocal Studies",
  degree_level: "bachelor",
  major_area: "Voice",
  duration: "3 years",
  application_url: null,
  deadline: {
    application_deadline: "2026-03-31",
    prescreening_deadline: null,
    audition_date: null,
    notes: "Entrance examination period is published annually.",
  },
  language_requirements: {
    instruction_language: "German",
    english_required: false,
    accepted_tests: [
      {
        test_name: "Other",
        minimum_score: null,
        section_minimums: null,
        notes: "German proficiency is expected, but exact accepted certificates are incomplete.",
      },
    ],
    waiver_policy: null,
    notes: null,
  },
  audition_requirements: {
    prescreening_required: false,
    audition_required: true,
    repertoire_requirements: null,
    format: "in_person",
    notes: "Detailed repertoire requirements are incomplete in this sample.",
  },
  cost_aid: {
    currency: "EUR",
    tuition_amount: 1450,
    tuition_period: "semester",
    application_fee: null,
    scholarships_available: null,
    notes: null,
  },
  sources: [
    {
      title: "Sample Program Page",
      url: "https://example.at/vocal-studies",
      source_type: "official_program_page",
      accessed_at: "2026-07-04",
      notes: "Fictional source placeholder for schema testing.",
    },
  ],
  data_quality: {
    confidence: "low",
    status: "extracted_awaiting_review",
    missing_fields: [
      "application_url",
      "prescreening_deadline",
      "audition_date",
      "waiver_policy",
      "repertoire_requirements",
      "application_fee",
      "scholarships_available",
    ],
    review_notes: "Fictional European sample for incomplete non-English instruction data.",
  },
};
