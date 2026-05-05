export type Status = "unchecked" | "found" | "not_found" | "discrepancy";

export type Row = Record<string, string>;

export interface State {
  fileName: string | null;
  rows: Row[];
  headers: string[];
  accountColumn: string | null;
  statusByRowId: Record<string, Status>;
  parseError: string | null;
  hiddenColumns: string[];
  showResetReminder: boolean;
}

export type Action =
  | { type: "LOAD"; fileName: string; rows: Row[]; headers: string[] }
  | { type: "SET_ACCOUNT_COLUMN"; column: string }
  | { type: "CYCLE_STATUS"; rowId: string }
  | { type: "SET_STATUS"; rowId: string; status: Status }
  | { type: "HIDE_COLUMN"; column: string }
  | { type: "SHOW_COLUMN"; column: string }
  | { type: "SHOW_ALL_COLUMNS" }
  | { type: "RESET" }
  | { type: "DISMISS_RESET_REMINDER" }
  | { type: "SET_ERROR"; error: string };

export interface Group {
  name: string;
  items: Array<{ row: Row; rowId: string; rowIndex: number }>;
}

export type RenderCol =
  | { kind: "data"; name: string }
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
};

export function makeRowId(accountValue: string, rowIndex: number) {
  return `${accountValue}__${rowIndex}`;
}

export function autoPickAccountColumn(headers: string[]): string | null {
  return headers.find((h) => /account|customer|client|company/i.test(h)) ?? null;
}
