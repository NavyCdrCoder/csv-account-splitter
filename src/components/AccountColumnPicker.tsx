"use client";

interface Props {
  headers: string[];
  value: string | null;
  onChange: (column: string) => void;
}

export default function AccountColumnPicker({ headers, value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-neutral-300">Account column:</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {value === null && (
          <option value="" disabled>
            Select column...
          </option>
        )}
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  );
}
