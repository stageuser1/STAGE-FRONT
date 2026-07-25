import type { ReactNode } from "react";

/**
 * The one shared layout wrapper (doc 02 §4): max-width 1200px, 24px mobile /
 * 32px ≥ md horizontal padding. Sections never set their own max-width.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-stage px-6 md:px-8 ${className}`}>
      {children}
    </div>
  );
}
