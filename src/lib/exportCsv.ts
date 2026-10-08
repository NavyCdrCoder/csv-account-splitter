import Papa from "papaparse";
import type { Row, Status } from "./types";
import { makeRowId } from "./types";
import { STATUS_LABEL } from "./status";

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<{
    createWritable: () => Promise<{
      write: (data: string) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

interface ReviewCsvInput {
  fileName: string;
  headers: string[];
  rows: Row[];
  accountColumn: string;
  statusByRowId: Record<string, Status>;
}

export function saveReviewCsv(input: ReviewCsvInput): Promise<"saved" | "canceled"> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = input.fileName.replace(/\.csv$/i, "");
  return writeStatusCsv(input, `${baseName}_reviewed_${dateStr}.csv`);
}

// Mid-review snapshot: same CSV as Review complete, with a local-time,
// minute-resolution filename so multiple saves in a day don't collide.
export function saveSessionCsv(input: ReviewCsvInput): Promise<"saved" | "canceled"> {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  const baseName = input.fileName.replace(/\.csv$/i, "");
  return writeStatusCsv(input, `${baseName}_session_${stamp}.csv`);
}

async function writeStatusCsv(
  { headers, rows, accountColumn, statusByRowId }: ReviewCsvInput,
  defaultName: string,
): Promise<"saved" | "canceled"> {
  const csvRows = rows.map((row, i) => {
    const account = row[accountColumn] ?? "";
    const rowId = makeRowId(account, i);
    const status = statusByRowId[rowId] ?? "unchecked";
    return { ...row, Status: STATUS_LABEL[status] };
  });

  const csv = Papa.unparse(csvRows, { columns: [...headers, "Status"] });

  const w = window as unknown as SaveFilePickerWindow;
  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          { description: "CSV file", accept: { "text/csv": [".csv"] } },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(csv);
      await writable.close();
      return "saved";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return "canceled";
      }
      // Fall through to download fallback for other errors.
    }
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "saved";
}
