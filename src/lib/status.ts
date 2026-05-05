import type { Status } from "./types";

export const STATUS_CYCLE: Record<Status, Status> = {
  unchecked: "found",
  found: "not_found",
  not_found: "discrepancy",
  discrepancy: "unchecked",
};

export const STATUS_LABEL: Record<Status, string> = {
  unchecked: "Not checked",
  found: "Found",
  not_found: "Not found",
  discrepancy: "Discrepancy",
};

export const STATUS_CLASSES: Record<Status, string> = {
  unchecked:
    "bg-neutral-700 text-neutral-200 hover:bg-neutral-600 border-neutral-600",
  found:
    "bg-emerald-700 text-emerald-50 hover:bg-emerald-600 border-emerald-500",
  not_found:
    "bg-rose-800 text-rose-50 hover:bg-rose-700 border-rose-600",
  discrepancy:
    "bg-amber-600 text-amber-50 hover:bg-amber-500 border-amber-400",
};
