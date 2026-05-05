"use client";

import type { Status } from "@/lib/types";
import { STATUS_CLASSES } from "@/lib/status";

interface Props {
  status: Status;
  onSetStatus: (status: Status) => void;
}

export default function RowStatusDropdown({ status, onSetStatus }: Props) {
  return (
    <select
      value={status}
      onChange={(e) => onSetStatus(e.target.value as Status)}
      className={`font-sans text-xs px-1.5 py-1 rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${STATUS_CLASSES[status]}`}
      aria-label="Set row status"
    >
      <option value="unchecked">— Not checked</option>
      <option value="found">Found</option>
      <option value="not_found">Not found</option>
      <option value="discrepancy">Discrepancy</option>
    </select>
  );
}
