export type Status = "unchecked" | "found" | "not_found" | "discrepancy";

export type Row = Record<string, string>;

export interface SavedSession {
  fileName: string;
  rows: Row[];
  headers: string[];
  accountColumn: string | null;
  statusByRowId: Record<string, Status>;
  hiddenColumns: string[];
}

export interface State {
  fileName: string | null;
  rows: Row[];
  headers: string[];
  accountColumn: string | null;
  statusByRowId: Record<string, Status>;
  parseError: string | null;
  hiddenColumns: string[];
  showResetReminder: boolean;
  previousSession: SavedSession | null;
}

export type Action =
  | { type: "LOAD"; fileName: string; rows: Row[]; headers: string[] }
  | { type: "SET_ACCOUNT_COLUMN"; column: string }
  | { type: "CYCLE_STATUS"; rowId: string }
  | { type: "SET_STATUS"; rowId: string; status: Status }
  | { type: "SET_STATUS_BULK"; rowIds: string[]; status: Status }
  | { type: "HIDE_COLUMN"; column: string }
  | { type: "SHOW_COLUMN"; column: string }
  | { type: "SHOW_ALL_COLUMNS" }
  | { type: "RESET" }
  | { type: "DISMISS_RESET_REMINDER" }
  | { type: "RESTORE_PREVIOUS" }
  | { type: "RESUME_SESSION"; session: SavedSession }
  | { type: "SET_ERROR"; error: string };

export interface Group {
  name: string;
  items: Array<{ row: Row; rowId: string; rowIndex: number }>;
}

export type RenderCol =
  | { kind: "data"; name: string; isAccountColumn: boolean }
  | { kind: "statusDropdown" };

export const initialState: State = {
  fileName: null,
  rows: [],
  headers: [],
  accountColumn: null,
  statusByRowId: {},
  parseError: null,
  hiddenColumns: [],
  showResetReminder: false,
  previousSession: null,
};

// Columns hidden by default when a file is loaded. They are only hidden in the
// UI (the "Hidden columns" bar restores them) and are still in every export.
export const DEFAULT_HIDDEN_COLUMNS = [
  "Modified Merchant",
  "Posted date",
  "Modified Sales date",
  "Tag",
];

// Accounts that don't report through Expensify. Their rows are left out of the
// account sections and the XLSX export (the saved CSVs still keep every row).
export const IGNORED_ACCOUNTS = ["dwayne@ezoic.com", "accounting@ezoic.com"];

export function isIgnoredAccount(account: string): boolean {
  const a = account.trim().toLowerCase();
  return IGNORED_ACCOUNTS.includes(a);
}

export function makeRowId(accountValue: string, rowIndex: number) {
  return `${accountValue}__${rowIndex}`;
}

export function autoPickAccountColumn(headers: string[]): string | null {
  return headers.find((h) => /account|customer|client|company/i.test(h)) ?? null;
}
