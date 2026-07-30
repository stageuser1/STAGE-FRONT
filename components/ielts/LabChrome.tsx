import type { ReactNode } from "react";

/**
 * Base chrome for the whole IELTS Lab surface: background, type family and
 * text colour only.
 *
 * The lab is its own application shell (master spec §应用壳): the browsable
 * sections carry the left sidebar via the shell group's layout, and the
 * practice runner keeps the marketing top bar via its own layout. Neither
 * piece belongs here, where it would apply to both route groups at once.
 */
export function LabChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stage-bg font-stage-sans text-stage-fg-body antialiased">
      {children}
    </div>
  );
}
