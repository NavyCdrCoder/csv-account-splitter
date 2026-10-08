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
    // can still save a session CSV manually.
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
