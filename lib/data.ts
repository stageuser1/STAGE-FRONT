import { programs } from "@/data/programs";
import { schools } from "@/data/schools";
import type { Program, ProgramSearchQuery, School } from "@/data/types";

export function getAllSchools(): School[] {
  return schools;
}

export function getAllPrograms(): Program[] {
  return programs;
}

export function getSchoolById(schoolId: string): School | undefined {
  return schools.find((school) => school.id === schoolId);
}

export function getProgramsBySchoolId(schoolId: string): Program[] {
  return programs.filter((program) => program.school_id === schoolId);
}

export function getProgramById(
  schoolId: string,
  programId: string,
): Program | undefined {
  return programs.find(
    (program) => program.school_id === schoolId && program.id === programId,
  );
}

export function searchPrograms(query: ProgramSearchQuery): Program[] {
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const country = query.country?.trim().toLowerCase() ?? "";
  const majorArea = query.major_area?.trim().toLowerCase() ?? "";

  return programs.filter((program) => {
    const keywordTarget = [
      program.name,
      program.school_name,
      program.country,
      program.city,
      program.degree_level,
      program.major_area,
    ]
      .join(" ")
      .toLowerCase();

    const matchesKeyword = keyword === "" || keywordTarget.includes(keyword);
    const matchesCountry =
      country === "" || program.country.toLowerCase() === country;
    const matchesDegree =
      !query.degree_level || program.degree_level === query.degree_level;
    const matchesMajorArea =
      majorArea === "" || program.major_area.toLowerCase() === majorArea;

    return (
      matchesKeyword && matchesCountry && matchesDegree && matchesMajorArea
    );
  });
}
