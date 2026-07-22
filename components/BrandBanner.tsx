/**
 * Decorative brand banner — pure CSS/SVG, no external assets and no
 * factual claims. Left: the "find your future" script lockup + the
 * 发现 · 成就 · 未来 tagline. Right: a flat people-at-work illustration.
 */
export function BrandBanner() {
  return (
    <div className="relative h-[72px] overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-brand-600 px-4 py-2.5 shadow-card md:px-7 md:py-5">
      <div className="relative z-10 flex h-full items-center gap-7 pr-24 sm:pr-40">
        <p
          aria-hidden="true"
          className="w-[76px] shrink-0 font-serif text-lg font-semibold leading-5 text-white md:text-xl"
        >
          Find your
          <br />
          future
        </p>
        <p className="whitespace-nowrap text-sm font-bold tracking-[0.04em] text-white md:text-xl">
          发现 · 成就 · 未来
        </p>
      </div>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1 -right-3 h-[72px] w-[116px] bg-white/95 md:right-5 md:h-[104px] md:w-[168px]"
        fill="none"
        viewBox="0 0 168 104"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* floating data cards */}
        <g opacity="0.95">
          <rect x="16" y="6" width="42" height="30" rx="4" fill="#FFFFFF" />
          <rect x="21" y="12" width="22" height="3" rx="1.5" fill="#93C5FD" />
          <rect x="21" y="19" width="32" height="2.5" rx="1.25" fill="#DBEAFE" />
          <rect x="21" y="25" width="26" height="2.5" rx="1.25" fill="#DBEAFE" />
          <rect x="112" y="2" width="40" height="28" rx="4" fill="#FFFFFF" />
          <rect x="117" y="20" width="5" height="6" rx="1" fill="#2563EB" />
          <rect x="125" y="15" width="5" height="11" rx="1" fill="#60A5FA" />
          <rect x="133" y="10" width="5" height="16" rx="1" fill="#2563EB" />
          <rect x="141" y="17" width="5" height="9" rx="1" fill="#60A5FA" />
        </g>

        {/* desk */}
        <rect x="14" y="82" width="140" height="7" rx="3.5" fill="#0B1220" opacity="0.35" />
        <rect x="20" y="72" width="128" height="12" rx="3" fill="#111827" />

        {/* left figure */}
        <g fill="#0F172A">
          <circle cx="58" cy="46" r="9" />
          <path d="M44 74c0-9 6.5-16 14-16s14 7 14 16v2H44v-2Z" />
        </g>
        <rect x="49" y="66" width="20" height="10" rx="1.5" fill="#E2E8F0" />
        <rect x="49" y="65" width="20" height="2.5" rx="1.25" fill="#94A3B8" />

        {/* right figure */}
        <g fill="#1E293B">
          <circle cx="104" cy="42" r="10" />
          <path d="M88 72c0-10 7-17 16-17s16 7 16 17v2H88v-2Z" />
        </g>
        <rect x="95" y="63" width="22" height="11" rx="1.5" fill="#CBD5E1" />
        <rect x="95" y="62" width="22" height="2.5" rx="1.25" fill="#64748B" />
      </svg>
    </div>
  );
}
