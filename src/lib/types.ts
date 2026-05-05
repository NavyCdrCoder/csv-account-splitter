export type Status = "unchecked" | "found" | "not_found" | "discrepancy";

export type Row = Record<string, string>;

export interface State {
  fileName: string | null;
  rows: Row[];
  headers: string[];
  accountColumn: string | null;
  statusByRowId: Record<string, Status>;
  parseError: string | null;
}

export type Action =
  | { type: "LOAD"; fileName: string; rows: Row[]; headers: string[] }
  | { type: "SET_ACCOUNT_COLUMN"; column: string }
  | { type: "CYCLE_STATUS"; rowId: string }
  | { type: "RESET" }
  | { type: "SET_ERROR"; error: string };

export interface Group {
  name: string;
  items: Array<{ row: Row; rowId: string; rowIndex: number }>;
}

export const initialState: State = {
  fileName: null,
  rows: [],
  headers: [],
  accountColumn: null,
  statusByRowId: {},
  parseError: null,
};

export function makeRowId(accountValue: string, rowIndex: number) {
  return `${accountValue}__${rowIndex}`;
}

export function autoPickAccountColumn(headers: string[]): string | null {
  return headers.find((h) => /account|customer|client|company/i.test(h)) ?? null;
}
