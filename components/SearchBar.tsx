"use client";

import { useState } from "react";
import { Icon } from "./ui/Icon";

export interface SearchFilterOption {
  label: string;
  value: string;
}

interface SearchBarProps {
  countryOptions: SearchFilterOption[];
  /** Degree options keyed by Directus degree slug (bm/mm/gd/ad/dma…). */
  degreeOptions: SearchFilterOption[];
  initialCountry?: string;
  initialDegree?: string;
  initialMajorArea?: string;
  initialValue?: string;
  majorOptions: SearchFilterOption[];
}

export function SearchBar({
  countryOptions,
  degreeOptions,
  initialCountry = "",
  initialDegree = "",
  initialMajorArea = "",
  initialValue = "",
  majorOptions,
}: SearchBarProps) {
  const [country, setCountry] = useState(initialCountry);
  const [degree, setDegree] = useState(initialDegree);
  const [majorArea, setMajorArea] = useState(initialMajorArea);
  const [keyword, setKeyword] = useState(initialValue);
  const hasSelectedFilter = Boolean(
    country || degree || majorArea || keyword.trim(),
  );

  return (
    <form
      action="/search"
      className="space-y-3"
      method="get"
      onSubmit={(event) => {
        if (!hasSelectedFilter) event.preventDefault();
      }}
    >
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="program-search">
          搜索学校、专业、学历
        </label>
        <div className="relative min-w-0 flex-1">
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
            name="search"
            size={18}
          />
          <input
            aria-label="搜索学校、专业、学历"
            className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.10)]"
            id="program-search"
            name="keyword"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索学校、专业、学历..."
            type="search"
            value={keyword}
          />
        </div>
        <button
          className="flex h-11 shrink-0 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-ink-300"
          disabled={!hasSelectedFilter}
          type="submit"
        >
          搜索
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <FilterSelect
          label="专业方向"
          name="major_area"
          onChange={setMajorArea}
          options={majorOptions}
          value={majorArea}
        />
        <FilterSelect
          label="学位"
          name="degree"
          onChange={setDegree}
          options={degreeOptions}
          value={degree}
        />
        <FilterSelect
          label="国家"
          name="country"
          onChange={setCountry}
          options={countryOptions}
          value={country}
        />
      </div>
      <p
        className={`text-xs ${hasSelectedFilter ? "text-ink-400" : "font-medium text-amber-700"}`}
      >
        {hasSelectedFilter
          ? "可组合关键词与多个筛选条件"
          : "输入关键词，或选择专业方向、学位、国家"}
      </p>
    </form>
  );
}

function FilterSelect({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: SearchFilterOption[];
  value: string;
}) {
  return (
    <label className="min-w-0 text-xs font-medium text-ink-500">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-10 w-full min-w-0 rounded-xl border border-line bg-white px-2 text-sm text-ink-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
