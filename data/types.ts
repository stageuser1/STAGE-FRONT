export type WorkflowStatus =
  | "draft"
  | "extracted_awaiting_review"
  | "human_reviewed"
  | "published";

export type ConfidenceLevel = "high" | "medium" | "low";

export type ReviewStatus =
  | "ai_generated"
  | "human_checked"
  | "human_edited"
  | "needs_update"
  | string;

export interface DirectusReviewRecord {
  id: string;
  review_status: ReviewStatus | null;
  values: Record<string, string | number | boolean | null>;
}

export type DegreeLevel =
  | "bachelor"
  | "master"
  | "doctorate"
  | "diploma"
  | "certificate";

/**
 * Full degree identity. `slug` keeps GD and AD distinct even though both
 * collapse into the legacy `DegreeLevel` "diploma" search bucket.
 */
export interface DegreeInfo {
  slug: string | null;
  name: string;
  name_zh: string | null;
  abbreviation: string | null;
  category: string | null;
}

export type CurrencyCode = "USD" | "GBP" | "EUR";

export type SourceType =
  | "official_program_page"
  | "official_admissions_page"
  | "official_tuition_page"
  | "official_language_page"
  | "official_audition_page";

export interface School {
  id: string;
  name: string;
  country: string;
  city: string;
  website_url: string | null;
  status: WorkflowStatus;
  data_quality: DataQuality;
  review_record?: DirectusReviewRecord;
  /** School-level source records (admissions policies, deadlines, fees…). */
  sources?: SourceRecord[];
}

export interface Deadline {
  application_deadline: string | null;
  prescreening_deadline: string | null;
  audition_date: string | null;
  notes: string | null;
}

export interface LanguageTest {
  test_name: "TOEFL" | "IELTS" | "Cambridge" | "Duolingo" | "Other";
  minimum_score: string | null;
  section_minimums: string | null;
  notes: string | null;
}

export interface LanguageRequirements {
  instruction_language: string | null;
  english_required: boolean | null;
  accepted_tests: LanguageTest[];
  waiver_policy: string | null;
  notes: string | null;
}

export interface SourceRecord {
  title: string;
  url: string;
  source_type: SourceType;
  accessed_at: string;
  notes: string | null;
}

export interface DataQuality {
  confidence: ConfidenceLevel;
  status: WorkflowStatus;
  missing_fields: string[];
  review_notes: string | null;
}

export interface AuditionRequirements {
  prescreening_required: boolean | null;
  audition_required: boolean | null;
  repertoire_requirements: string | null;
  format: string | null;
  notes: string | null;
}

/** Prescreening round, kept strictly separate from the live audition. */
export interface PrescreenSection {
  required: boolean | null;
  /** Raw text of the required flag (e.g. "Yes", "Not required"). */
  required_text: string | null;
  deadline: string | null;
  video_requirements: string | null;
  file_format_requirements: string | null;
  repertoire: string | null;
}

/** Live audition round, including interview/callback content. */
export interface AuditionSection {
  required: boolean | null;
  required_text: string | null;
  format: string | null;
  accompaniment_requirements: string | null;
  interview_or_callback_requirements: string | null;
  repertoire: string | null;
  special_notes: string | null;
  conditional_notes: string | null;
  notes: string | null;
  /** Legacy combined repertoire text that has not been split yet. */
  legacy_repertoire_summary: string | null;
}

/** Application-material details rendered in the 申请材料 section. */
export interface ApplicationSection {
  resume_required: string | null;
  essay_required: string | null;
  recommendation_letters: string | null;
  transcript_requirements: string | null;
  portfolio_required: string | null;
  required_materials: string[];
  international_applicant_notes: string | null;
  conditional_notes: string | null;
  notes: string | null;
  admission_cycle: string | null;
}

export interface CostAid {
  currency: CurrencyCode;
  tuition_amount: number | null;
  tuition_period: "year" | "semester" | "program" | null;
  application_fee: number | null;
  scholarships_available: boolean | null;
  notes: string | null;
}

export interface Program {
  id: string;
  school_id: string;
  school_name: string;
  country: string;
  city: string;
  name: string;
  name_zh?: string | null;
  degree_level: DegreeLevel;
  /** Full degree identity — GD and AD stay distinct here. */
  degree?: DegreeInfo;
  major_area: string;
  major_area_zh?: string | null;
  /** Specialization / instrument / track within the major area. */
  specialization?: string | null;
  department?: string | null;
  card_summary?: string | null;
  application?: ApplicationSection | null;
  prescreen?: PrescreenSection | null;
  audition?: AuditionSection | null;
  duration: string | null;
  program_url?: string | null;
  application_url: string | null;
  audition_url?: string | null;
  international_url?: string | null;
  deadline: Deadline;
  language_requirements: LanguageRequirements;
  audition_requirements: AuditionRequirements;
  cost_aid: CostAid;
  sources: SourceRecord[];
  data_quality: DataQuality;
  review_records?: {
    offering: DirectusReviewRecord;
    application: DirectusReviewRecord | null;
    audition: DirectusReviewRecord | null;
    degree_level_options: Array<{ label: string; value: string }>;
  };
}

export interface ProgramSearchQuery {
  keyword?: string | null;
  country?: string | null;
  degree_level?: DegreeLevel | null;
  /** Directus degree slug (bm/mm/dma/gd/ad) — keeps GD and AD separate. */
  degree_slug?: string | null;
  major_area?: string | null;
}
