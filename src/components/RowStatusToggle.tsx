"use client";

import type { Status } from "@/lib/types";
import { STATUS_CLASSES, STATUS_LABEL } from "@/lib/status";

interface Props {
  status: Status;
  onCycle: () => void;
}

export default function RowStatusToggle({ status, onCycle }: Props) {
  return (
    <button
      type="button"
      onClick={onCycle}
      className={`font-sans text-xs px-2 py-1 rounded border min-w-[6.5rem] text-center transition-colors ${STATUS_CLASSES[status]}`}
      aria-label={`Status: ${STATUS_LABEL[status]} (click to cycle)`}
    >
      {STATUS_LABEL[status]}
    </button>
  );
}
