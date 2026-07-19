import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type IconName =
  | "search"
  | "calendar"
  | "location"
  | "globe"
  | "tuition"
  | "school"
  | "arrow-right"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "check"
  | "close"
  | "external"
  | "document"
  | "music"
  | "mic"
  | "alert"
  | "clock"
  | "link"
  | "user"
  | "home"
  | "filter";

const paths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  calendar: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s-7-5.4-7-11a7 7 0 1 1 14 0c0 5.6-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.7 2.6 4 5.7 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.7-4-9s1.3-6.4 4-9Z" />
    </>
  ),
  tuition: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15.5c.6.9 1.8 1.5 3 1.5 1.9 0 3.2-1 3.2-2.5S13.9 12 12 12s-3-.9-3-2.4S10.3 7 12 7c1.2 0 2.4.6 3 1.5M12 5.5V7m0 10v1.5" />
    </>
  ),
  school: (
    <>
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M6 11.5V17c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5.5" />
    </>
  ),
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M19 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M13.5 3.5V9H19M8.5 13h7M8.5 17h5" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2.5V15" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="15" r="2.5" />
    </>
  ),
  mic: (
    <>
      <rect height="11" rx="3" width="6" x="9" y="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V13m0 3.4v.1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.6l-1.3 1.3" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.6l1.3-1.3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  home: (
    <>
      <path d="m3 10.5 9-7.5 9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
};

interface IconProps extends ComponentPropsWithoutRef<"svg"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
