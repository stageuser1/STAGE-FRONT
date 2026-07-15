"use client";

interface BaseFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function EditableTextField({
  id,
  label,
  onChange,
  value,
  type = "text",
  inputMode,
}: BaseFieldProps & {
  type?: "text" | "url" | "date";
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label className="block text-sm font-medium text-gray-700" htmlFor={id}>
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        id={id}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

export function EditableTextarea({
  id,
  label,
  onChange,
  value,
}: BaseFieldProps) {
  return (
    <label className="block text-sm font-medium text-gray-700" htmlFor={id}>
      {label}
      <textarea
        className="mt-1 min-h-28 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

export function EditableSelect({
  id,
  label,
  onChange,
  options,
  value,
}: BaseFieldProps & {
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700" htmlFor={id}>
      {label}
      <select
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Not set</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
