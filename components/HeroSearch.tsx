import { Icon } from "./ui/Icon";

/**
 * Home discovery search: a 48px white pill with a leading brand dot and
 * an attached solid-blue icon button. Plain GET form to /search so the
 * URL stays the single source of truth.
 */
export function HeroSearch() {
  return (
    <form action="/search" method="get" role="search">
      <label className="sr-only" htmlFor="hero-search">
        搜索学校、专业、学历
      </label>
      <div className="flex h-[52px] items-center gap-2.5 overflow-hidden rounded-[20px] border border-[#e4e5e9] bg-white pl-4 shadow-card transition focus-within:border-brand-500 focus-within:shadow-[0_0_0_3px_rgba(43,70,235,0.12)]">
        <span
          aria-hidden="true"
          className="h-3 w-3 shrink-0 rounded-full bg-brand-600"
        />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-xs text-ink-900 outline-none placeholder:text-ink-400"
          id="hero-search"
          name="keyword"
          placeholder="搜索学校、专业、学历，开启你的音乐之旅"
          type="search"
        />
        <button
          aria-label="搜索"
          className="flex h-full w-[54px] shrink-0 items-center justify-center bg-brand-600 text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          type="submit"
        >
          <Icon name="search" size={25} />
        </button>
      </div>
    </form>
  );
}
