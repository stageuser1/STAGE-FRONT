import type { Metadata } from "next";
import type { ProgramV3 } from "@/data/v3/types";

/**
 * 院校页与专业页的 title/description 映射(2026-08-09 抽出)。
 *
 * 抽成单一来源是因为**预览面必须显示与上线后完全相同的标题** —— 阶段三的
 * 人工复核是拿 `?preview=` 逐页核对的,标题也在核对范围内。此前预览路由只
 * 导出了 `robots`,复核者看到的是根布局的默认 title,等于这一项没法核。
 *
 * 预览面额外叠加 `robots: noindex, nofollow`(决策 8),这是两者唯一的差别。
 */

const NOINDEX = { index: false, follow: false } as const;

export function schoolMetadata(
  program: ProgramV3 | undefined,
  options: { preview?: boolean } = {},
): Metadata {
  const robots = options.preview ? { robots: NOINDEX } : {};
  if (!program) return robots;
  const school = program.school;
  const name = school.school_name_zh ?? school.school_name;
  return {
    ...robots,
    title: `${name} 招生信息 · STAGE`,
    description: `${name}(${school.school_name})的招生项目、申请要求、语言要求与试音曲目,标注每条信息的官网核验状态。`,
  };
}

export function programMetadata(
  program: ProgramV3 | undefined,
  options: { preview?: boolean } = {},
): Metadata {
  const robots = options.preview ? { robots: NOINDEX } : {};
  if (!program) return robots;
  const schoolName = program.school.school_name_zh ?? program.school.school_name;
  const programName =
    program.offering.program_name_zh ?? program.offering.official_program_name;
  const degree = program.offering.degree_abbreviation;
  return {
    ...robots,
    title: `${schoolName} ${programName}${degree ? ` (${degree})` : ""} 申请要求 · STAGE`,
    description:
      program.publishing.answer_sentence_zh ??
      `${schoolName} ${programName} 项目的申请截止日期、语言要求与试音要求,来自官网并标注核验状态。`,
  };
}
