import type { Program } from "../types";

export const ukMasterProgram: Program = {
  id: "rncm-vocal-performance-mm",
  school_id: "royal-northern-college",
  school_name: "Royal Northern College of Music London",
  country: "GB",
  city: "London",
  name: "Master of Music - Vocal Performance",
  degree_level: "master",
  major_area: "Voice",
  duration: "2 years",
  application_url: null,
  deadline: {
    application_deadline: "2026-01-15",
    prescreening_deadline: null,
    audition_date: null,
    notes: "Audition dates are released after application review.",
  },
  language_requirements: {
    instruction_language: "English",
    english_required: true,
    accepted_tests: [
      {
        test_name: "IELTS",
        minimum_score: "6.5 overall",
        section_minimums: "No section below 6.0",
        notes: null,
      },
    ],
    waiver_policy: null,
    notes: "Fictional sample program used to test missing-data display.",
  },
  audition_requirements: {
    prescreening_required: null,
    audition_required: true,
    repertoire_requirements: "Two contrasting classical songs or arias.",
    format: "in_person",
    notes: null,
  },
  cost_aid: {
    currency: "GBP",
    tuition_amount: null,
    tuition_period: "year",
    application_fee: 75,
    scholarships_available: true,
    notes: "Tuition intentionally null for missing-data handling.",
  },
  sources: [
    {
      title: "Sample Admissions Page",
      url: "https://example.edu/admissions",
      source_type: "official_admissions_page",
      accessed_at: "2026-07-04",
      notes: "Fictional source placeholder for schema testing.",
    },
  ],
  data_quality: {
    confidence: "medium",
    status: "extracted_awaiting_review",
    missing_fields: ["application_url", "prescreening_deadline", "audition_date", "tuition_amount"],
    review_notes: "Fictional UK sample awaiting human review.",
  },
};
