import { Icon } from "./ui/Icon";

interface SearchInputProps {
  defaultValue?: string;
  /** Active filter params carried through keyword submits. */
  hiddenParams?: Record<string, string>;
  placeholder?: string;
}

/**
 * Compact search pill for the /search page. A plain GET form — hidden
 * inputs carry the active filters so typing a keyword never drops them.
 */
export function SearchInput({
  defaultValue = "",
  hiddenParams = {},
  placeholder = "搜索学校、专业、学历…",
}: SearchInputProps) {
  return (
    <form action="/search" method="get" role="search">
      {Object.entries(hiddenParams).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <label className="sr-only" htmlFor="search-keyword">
        搜索学校、专业、学历
      </label>
      <div className="flex h-11 items-center gap-2 rounded-full border border-line bg-white pl-4 pr-1 shadow-card transition focus-within:border-brand-500 focus-within:shadow-[0_0_0_3px_rgba(43,70,235,0.12)]">
        <Icon className="shrink-0 text-ink-400" name="search" size={17} />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
          defaultValue={defaultValue}
          id="search-keyword"
          name="keyword"
          placeholder={placeholder}
          type="search"
        />
        <button
          aria-label="搜索"
          className="flex h-9 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          type="submit"
        >
          <Icon name="search" size={16} />
        </button>
      </div>
    </form>
  );
}
