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
  format: "in_person" | "recorded" | "online" | "hybrid" | null;
  notes: string | null;
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
  degree_level: DegreeLevel;
  major_area: string;
  duration: string | null;
  application_url: string | null;
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
  };
}

export interface ProgramSearchQuery {
  keyword?: string | null;
  country?: string | null;
  degree_level?: DegreeLevel | null;
  major_area?: string | null;
}
