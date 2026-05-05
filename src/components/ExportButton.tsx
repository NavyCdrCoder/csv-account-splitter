"use client";

interface Props {
  disabled: boolean;
  onClick: () => void;
}

export default function ExportButton({ disabled, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
    >
      Export XLSX
    </button>
  );
}
