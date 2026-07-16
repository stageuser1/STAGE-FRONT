"use client";

import { useState } from "react";

export interface SearchFilterOption {
  label: string;
  value: string;
}

interface SearchBarProps {
  countryOptions: SearchFilterOption[];
  degreeOptions: SearchFilterOption[];
  initialCountry?: string;
  initialDegreeLevel?: string;
  initialMajorArea?: string;
  initialValue?: string;
  majorOptions: SearchFilterOption[];
}

export function SearchBar({
  countryOptions,
  degreeOptions,
  initialCountry = "",
  initialDegreeLevel = "",
  initialMajorArea = "",
  initialValue = "",
  majorOptions,
}: SearchBarProps) {
  const [country, setCountry] = useState(initialCountry);
  const [degreeLevel, setDegreeLevel] = useState(initialDegreeLevel);
  const [majorArea, setMajorArea] = useState(initialMajorArea);
  const hasSelectedFilter = Boolean(country || degreeLevel || majorArea);

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
          className="h-12 shrink-0 rounded-full bg-blue-700 px-3.5 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!hasSelectedFilter}
          type="submit"
        >
          搜索
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <FilterSelect
          label="乐器"
          name="major_area"
          onChange={setMajorArea}
          options={majorOptions}
          value={majorArea}
        />
        <FilterSelect
          label="学位"
          name="degree_level"
          onChange={setDegreeLevel}
          options={degreeOptions}
          value={degreeLevel}
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
        className={`text-xs ${hasSelectedFilter ? "text-gray-500" : "font-medium text-amber-700"}`}
      >
        {hasSelectedFilter
          ? "可组合多个筛选条件"
          : "请至少选择一项：乐器、学位或国家"}
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
    <label className="min-w-0 text-xs font-medium text-gray-600">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
