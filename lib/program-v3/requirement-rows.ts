import type { ProgramV3 } from "@/data/v3/types";
import { fiveStateZh, formatDateZh } from "./format";

export interface RequirementRow {
  term: string;
  value: string | number;
}

/**
 * The 完整要求表's `<dt>/<dd>` pairs, as data.
 *
 * Lifted verbatim out of `RequirementsTable` (T3, §2.2 module 2) when T7
 * needed the same rows in a different shell — the browse page's 大卡 renders
 * them as its 「详细要求」 block with T7's own tokens, and the two surfaces
 * must not be able to disagree about which requirements exist or how they
 * read. **No rule changed in the move**: same terms, same order, same
 * null-drop semantics (§3.1), same 申请费 currency guard (ruling T3-R3.2),
 * same `Unknown` → absent handling for the two audition booleans. T3's 98
 * tests still cover it through `RequirementsTable`, which now calls this.
 *
 * What deliberately stays with the caller: 年总费用 (a `CostBlockLine`, not
 * a string — the caller renders its three disclaimer lines) and the
 * conditional notes (each needs its own source link). Both are presentation
 * decisions the two surfaces make differently; the rows above are not.
 */
export function buildRequirementRows(program: ProgramV3): RequirementRow[] {
  const { application, audition } = program;
  const rows: RequirementRow[] = [];
  const push = (term: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return;
    rows.push({ term, value });
  };

  push("申请季", application.admission_cycle);
  push("申请截止日期", formatDateZh(application.application_deadline));
  // §3.1: a bare "150" with no currency is not a fact anyone can act on, so
  // a missing currency drops the whole row rather than rendering a number
  // the reader would have to guess at (ruling T3-R3.2).
  push(
    "申请费",
    application.application_fee !== null &&
      application.application_fee_currency !== null
      ? `${application.application_fee_currency} ${application.application_fee}`
      : null,
  );
  push(
    "推荐信",
    application.recommendation_letters !== null
      ? `×${application.recommendation_letters}`
      : null,
  );
  push("简历", fiveStateZh(application.resume_required));
  push("个人文书", fiveStateZh(application.essay_required));
  push("作品集", fiveStateZh(application.portfolio_required));
  push(
    "申请材料清单",
    application.required_materials.length > 0
      ? application.required_materials.join("、")
      : null,
  );
  push("成绩单要求", application.transcript_requirements);
  push("英语要求", fiveStateZh(application.english_requirement_status));
  push("TOEFL 最低分", application.toefl_minimum);
  push("IELTS 最低分", application.ielts_minimum);
  push("多邻国最低分", application.duolingo_minimum);
  push("语言豁免政策", application.english_waiver_policy);
  push("国际生特别说明", application.international_applicant_notes);
  push(
    "预筛是否要求",
    audition.prescreening_required !== "Unknown"
      ? audition.prescreening_required
      : null,
  );
  push("预筛截止日期", formatDateZh(audition.prescreening_deadline));
  push(
    "是否需要试音",
    audition.audition_required !== "Unknown" ? audition.audition_required : null,
  );
  push("视频要求", audition.video_requirements);
  push("文件格式要求", audition.file_format_requirements);
  push("伴奏要求", audition.accompaniment_requirements);
  push("面试/回访要求", audition.special_notes);

  return rows;
}
