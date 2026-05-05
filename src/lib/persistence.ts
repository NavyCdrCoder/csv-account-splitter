import type { Row, State, Status } from "./types";

const STORAGE_KEY = "csv-account-splitter:session";
const SCHEMA_VERSION = 1;

export interface PersistedSession {
  version: number;
  savedAt: string;
  fileName: string;
  rows: Row[];
  headers: string[];
  accountColumn: string | null;
  statusByRowId: Record<string, Status>;
  hiddenColumns: string[];
}

function isPersistedSession(value: unknown): value is PersistedSession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === "number" &&
    typeof v.savedAt === "string" &&
    typeof v.fileName === "string" &&
    Array.isArray(v.rows) &&
    Array.isArray(v.headers) &&
    (v.accountColumn === null || typeof v.accountColumn === "string") &&
    typeof v.statusByRowId === "object" &&
    v.statusByRowId !== null &&
    Array.isArray(v.hiddenColumns)
  );
}

export function buildPersistedSession(state: State): PersistedSession | null {
  if (!state.fileName || state.rows.length === 0) return null;
  return {
    version: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    fileName: state.fileName,
    rows: state.rows,
    headers: state.headers,
    accountColumn: state.accountColumn,
    statusByRowId: state.statusByRowId,
    hiddenColumns: state.hiddenColumns,
  };
}

export function saveSession(state: State): void {
  const payload = buildPersistedSession(state);
  if (!payload) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage unavailable — fail silently. The user
    // can still export the session manually.
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedSession(parsed)) return null;
    if (parsed.version !== SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function relativeTimeFrom(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export async function exportSessionFile(state: State): Promise<"saved" | "canceled"> {
  const payload = buildPersistedSession(state);
  if (!payload) return "canceled";
  const json = JSON.stringify(payload, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = payload.fileName.replace(/\.csv$/i, "");
  const defaultName = `${baseName}_session_${dateStr}.json`;

  interface SaveFilePickerWindow {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: string) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  }
  const w = window as unknown as SaveFilePickerWindow;
  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: "Session JSON",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return "saved";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "canceled";
    }
  }

  const blob = new Blob([json], { type: "application/json" });
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

export function readSessionFile(file: File): Promise<PersistedSession> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isPersistedSession(parsed)) {
          reject(new Error("Not a valid session file."));
          return;
        }
        if (parsed.version !== SCHEMA_VERSION) {
          reject(
            new Error(
              `Session file version ${parsed.version} is incompatible (expected ${SCHEMA_VERSION}).`,
            ),
          );
          return;
        }
        resolve(parsed);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read failed."));
    reader.readAsText(file);
  });
}
