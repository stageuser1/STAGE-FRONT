interface SearchBarProps {
  initialValue?: string;
}

export function SearchBar({ initialValue = "" }: SearchBarProps) {
  return (
    <form action="/search" className="flex items-center gap-2" method="get">
      <label className="sr-only" htmlFor="program-search">
        搜索学校、专业、学历
      </label>
      <input
        aria-label="搜索学校、专业、学历"
        className="h-12 min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        defaultValue={initialValue}
        id="program-search"
        name="keyword"
        placeholder="搜索学校、专业、学历..."
        type="search"
      />
      <button
        className="h-12 shrink-0 rounded-full bg-blue-700 px-3.5 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
        type="submit"
      >
        搜索
      </button>
    </form>
  );
}
