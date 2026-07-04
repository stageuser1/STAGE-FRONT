import type { Program } from "../types";

export const juilliardVoiceBm: Program = {
  id: "juilliard-voice-bm",
  school_id: "juilliard",
  school_name: "The Juilliard School",
  country: "US",
  city: "New York",
  name: "Bachelor of Music - Voice",
  degree_level: "bachelor",
  major_area: "Voice",
  duration: "4 years",
  application_url: "https://www.juilliard.edu/admissions",
  deadline: {
    application_deadline: "2025-12-01",
    prescreening_deadline: "2025-12-01",
    audition_date: null,
    notes: "Exact audition scheduling is assigned through the official admissions process.",
  },
  language_requirements: {
    instruction_language: "English",
    english_required: true,
    accepted_tests: [
      {
        test_name: "TOEFL",
        minimum_score: "73 iBT",
        section_minimums: null,
        notes: "Requirement details should be verified against the official admissions page.",
      },
      {
        test_name: "IELTS",
        minimum_score: "6.0",
        section_minimums: null,
        notes: "Requirement details should be verified against the official admissions page.",
      },
    ],
    waiver_policy: "Possible for eligible applicants based on official English proficiency policy.",
    notes: "Official English proficiency requirements are included for sample data coverage.",
  },
  audition_requirements: {
    prescreening_required: true,
    audition_required: true,
    repertoire_requirements:
      "Prescreening and live audition repertoire requirements vary by application cycle.",
    format: "hybrid",
    notes: "Applicants should confirm current repertoire requirements with Juilliard.",
  },
  cost_aid: {
    currency: "USD",
    tuition_amount: 56280,
    tuition_period: "year",
    application_fee: 110,
    scholarships_available: true,
    notes: "Tuition is sample data and should be refreshed from official sources later.",
  },
  sources: [
    {
      title: "Juilliard Admissions",
      url: "https://www.juilliard.edu/admissions",
      source_type: "official_admissions_page",
      accessed_at: "2026-07-04",
      notes: null,
    },
    {
      title: "Juilliard Vocal Arts",
      url: "https://www.juilliard.edu/music/vocal-arts",
      source_type: "official_program_page",
      accessed_at: "2026-07-04",
      notes: null,
    },
  ],
  data_quality: {
    confidence: "high",
    status: "published",
    missing_fields: ["audition_date"],
    review_notes: "Representative official-source sample for Phase 1A.",
  },
};
