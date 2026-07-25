import type { ReactNode } from "react";
import { LabChrome } from "@/components/ielts/LabChrome";

/** Browsable IELTS Lab sections: overview, browse, suite, history. */
export default function IeltsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <LabChrome>{children}</LabChrome>;
}
