import { notFound } from "next/navigation";

import { PilotProgramView } from "@/components/pilot/PilotProgramView";
import { getPilotProgramByRef } from "@/lib/pilot-data";

export const dynamic = "force-dynamic";

export default async function PilotProgramPage({
  params,
}: {
  params: Promise<{ program_offering_ref: string }>;
}) {
  const { program_offering_ref } = await params;
  const data = await getPilotProgramByRef(program_offering_ref);
  if (!data) notFound();
  return <PilotProgramView data={data} />;
}
