import { realProgramsV3 } from "@/data/v3/real-programs";
import {
  browseLede,
  buildBrowseModel,
  resolveBrowseSelection,
} from "@/lib/schools-browse/model";
import { SchoolsBrowse } from "./SchoolsBrowse";

/**
 * The server half of T7 — shared verbatim by `/schools` and
 * `/schools/{school-slug}/{program-slug}`, which are the same page differing
 * only in which pair of slugs it opens on.
 *
 * Both URLs render the identical full DOM (every school's chip row, every
 * program's card); the params only pick which one starts visible. That is
 * what makes the anti-cloaking guarantee independent of entry point — a
 * crawler landing on any of the routes reads all of them.
 */
export function SchoolsBrowsePage({
  schoolSlug,
  programSlug,
}: {
  schoolSlug?: string;
  programSlug?: string;
}) {
  const schools = buildBrowseModel(realProgramsV3);
  const selection = resolveBrowseSelection(schools, schoolSlug, programSlug);

  return (
    <SchoolsBrowse
      initialSelection={selection}
      lede={browseLede(schools, new Date())}
      schools={schools}
    />
  );
}
