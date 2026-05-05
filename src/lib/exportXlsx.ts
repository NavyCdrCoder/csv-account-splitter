import * as XLSX from "xlsx";
import type { Group, Status } from "./types";
import { STATUS_LABEL } from "./status";

export function sanitizeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\\/?*[\]:]/g, "_");
  if (base.length === 0) base = "Sheet";
  if (base.length > 31) base = base.slice(0, 31);

  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n})`;
    const truncated = base.slice(0, 31 - suffix.length);
    candidate = truncated + suffix;
    n++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function exportToXlsx({
  fileName,
  headers,
  groups,
  statusByRowId,
}: {
  fileName: string;
  headers: string[];
  groups: Group[];
  statusByRowId: Record<string, Status>;
}) {
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  const fullHeaders = [...headers, "Status"];

  for (const group of groups) {
    const rowsForSheet = group.items.map(({ row, rowId }) => {
      const status = statusByRowId[rowId] ?? "unchecked";
      return { ...row, Status: STATUS_LABEL[status] };
    });
    const ws = XLSX.utils.json_to_sheet(rowsForSheet, { header: fullHeaders });
    const sheetName = sanitizeSheetName(group.name || "(blank)", used);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = fileName.replace(/\.csv$/i, "");
  const outFile = `${baseName}_split_${dateStr}.xlsx`;
  XLSX.writeFile(wb, outFile);
}
