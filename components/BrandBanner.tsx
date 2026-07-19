/**
 * Decorative brand banner — pure CSS/SVG, no external assets and no
 * factual claims. Purely a brand-confidence element on the homepage.
 */
export function BrandBanner() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-5 py-5 shadow-card md:px-8 md:py-6"
    >
      <svg
        className="pointer-events-none absolute -right-4 -top-6 h-36 w-36 text-white/10 md:h-44 md:w-44"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M9 18V6l10-2.5V15" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="15" r="2.5" />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-8 right-16 h-28 w-28 rotate-12 text-white/10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M9 18V6l10-2.5V15" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="15" r="2.5" />
      </svg>
      <p className="font-serif text-sm italic tracking-wide text-white/80">
        find your future
      </p>
      <p className="mt-1 text-lg font-bold tracking-[0.2em] text-white md:text-xl">
        发现 · 成就 · 未来
      </p>
    </div>
  );
}
