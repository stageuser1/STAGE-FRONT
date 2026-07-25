import Link from "next/link";
import { notFound } from "next/navigation";

import { getPilotProgramsBySchool } from "@/lib/pilot-data";

export const dynamic = "force-dynamic";

export default async function PilotSchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const programs = await getPilotProgramsBySchool(slug);
  if (programs.length === 0) notFound();
  const school = programs[0].school_id;

  return (
    <main className="min-h-screen bg-[#f4f2ed] pb-24 text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">STAGE reduced-data pilot</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl" data-testid="school-title">{school.school_name}</h1>
          <p className="mt-4 text-lg text-slate-600">{school.city}, {school.country} · {programs.length} source-checked pilot programs</p>
        </header>

        <section aria-label="Pilot programs" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="pilot-program-index">
          {programs.map((program) => (
            <Link
              className="group flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              href={`/pilot/program/${program.program_offering_ref}`}
              key={program.program_offering_ref}
            >
              <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-violet-700">
                <span>{program.degree_level_id.abbreviation ?? program.degree_level_id.degree_level_name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 font-medium normal-case tracking-normal text-slate-600">{program.review_status}</span>
              </div>
              <h2 className="mt-5 text-xl font-semibold leading-7 text-slate-950 group-hover:text-violet-800">{program.official_program_name}</h2>
              <p className="mt-2 text-sm text-slate-500">{program.field_id.field_name}{program.track_or_concentration ? ` · ${program.track_or_concentration}` : ""}</p>
              <span className="mt-auto pt-5 text-sm font-semibold text-violet-800">View decision page →</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
