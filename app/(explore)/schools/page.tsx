import type { Metadata } from "next";
import { BrandBanner } from "@/components/BrandBanner";
import { ExploreCatalog } from "@/components/explore/ExploreCatalog";
import { HeroSearch } from "@/components/HeroSearch";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { ProfileNudge } from "@/components/explore/ProfileNudge";
import type { Program } from "@/data/types";
import { getAllPrograms, getAllSchools } from "@/lib/data";
import { toExploreProgram, toExploreSchool } from "@/lib/explore/types";
import { latestSchoolUpdate } from "@/lib/format";

// Former homepage metadata — preserved verbatim through the / → /schools move.
export const metadata: Metadata = {
  title: "STAGE · 海外音乐院校招生数据库",
  description:
    "STAGE 收录海外音乐院校的招生项目、申请要求、语言要求与试音曲目，并标注每条信息的核验状态。",
};

export const revalidate = 900;

export default async function HomePage() {
  const [schools, programs] = await Promise.all([
    getAllSchools(),
    getAllPrograms(),
  ]);

  // Roll programs up under their school (school is the primary entity here).
  const programsBySchool = new Map<string, Program[]>();
  for (const program of programs) {
    const list = programsBySchool.get(program.school_id) ?? [];
    list.push(program);
    programsBySchool.set(program.school_id, list);
  }

  // Map to the slim catalog shape at the server boundary: the full Program
  // carries reviewer records and source blobs the catalog never reads, and
  // shipping those to a client component would be megabytes of dead payload.
  const exploreProgams = programs.map(toExploreProgram);
  const exploreSchools = schools.map((school) => {
    const own = programsBySchool.get(school.id) ?? [];
    return toExploreSchool(
      school,
      own.map(toExploreProgram),
      latestSchoolUpdate(school, own),
    );
  });

  const idsBySchool: Record<string, string[]> = {};
  for (const program of exploreProgams) {
    (idsBySchool[program.schoolId] ??= []).push(program.id);
  }

  return (
    <>
      <MobileHeader showNotifications subtitle="海外音乐院校招生数据库" />
      <PageShell>
        <section className="space-y-[14px] md:mx-auto md:max-w-2xl">
          <h1 className="px-2 text-[25px] font-bold leading-8 tracking-[0.01em] text-ink-900 md:text-center md:text-[34px] md:leading-[44px]">
            探索全球音乐教育机会
          </h1>
          <HeroSearch />
        </section>

        <section className="mt-5">
          <BrandBanner />
        </section>

        <ProfileNudge />

        {/* The catalog is populated on first paint — no chip has to be clicked
            to see what the database contains. */}
        <ExploreCatalog
          programs={exploreProgams}
          programsBySchool={idsBySchool}
          schools={exploreSchools}
        />
      </PageShell>
    </>
  );
}
