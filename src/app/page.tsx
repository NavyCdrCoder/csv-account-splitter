"use client";

import { useMemo, useReducer } from "react";
import Uploader from "@/components/Uploader";
import AccountColumnPicker from "@/components/AccountColumnPicker";
import AccountSection from "@/components/AccountSection";
import ExportButton from "@/components/ExportButton";
import {
  type Action,
  type Group,
  type State,
  autoPickAccountColumn,
  initialState,
  makeRowId,
} from "@/lib/types";
import { STATUS_CYCLE } from "@/lib/status";
import { exportToXlsx } from "@/lib/exportXlsx";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD": {
      const accountColumn = autoPickAccountColumn(action.headers);
      return {
        fileName: action.fileName,
        rows: action.rows,
        headers: action.headers,
        accountColumn,
        statusByRowId: {},
        parseError: null,
      };
    }
    case "SET_ACCOUNT_COLUMN":
      return {
        ...state,
        accountColumn: action.column,
        statusByRowId: {},
      };
    case "CYCLE_STATUS": {
      const current = state.statusByRowId[action.rowId] ?? "unchecked";
      return {
        ...state,
        statusByRowId: {
          ...state.statusByRowId,
          [action.rowId]: STATUS_CYCLE[current],
        },
      };
    }
    case "RESET":
      return initialState;
    case "SET_ERROR":
      return { ...initialState, parseError: action.error };
  }
}

export default function Page() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { fileName, rows, headers, accountColumn, statusByRowId, parseError } =
    state;

  const groups: Group[] = useMemo(() => {
    if (!accountColumn) return [];
    const groupMap = new Map<string, Group["items"]>();
    rows.forEach((row, rowIndex) => {
      const account = row[accountColumn] ?? "";
      const rowId = makeRowId(account, rowIndex);
      if (!groupMap.has(account)) groupMap.set(account, []);
      groupMap.get(account)!.push({ row, rowId, rowIndex });
    });
    return Array.from(groupMap.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, accountColumn]);

  const fileLoaded = fileName !== null && rows.length > 0;
  const exportReady = fileLoaded && accountColumn !== null && groups.length > 0;
  const defaultExpanded = groups.length <= 5;

  const handleExport = () => {
    if (!fileName || !accountColumn) return;
    exportToXlsx({ fileName, headers, groups, statusByRowId });
  };

  return (
    <main className="flex-1 flex flex-col">
      <header className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold tracking-tight">
            CSV Account Splitter
          </h1>
          {fileLoaded && (
            <>
              <span className="text-xs text-neutral-400 tabular-nums">
                <span className="text-neutral-200">{fileName}</span>
                <span className="mx-2 text-neutral-600">·</span>
                {rows.length} {rows.length === 1 ? "row" : "rows"}
                {accountColumn && (
                  <>
                    <span className="mx-2 text-neutral-600">·</span>
                    {groups.length}{" "}
                    {groups.length === 1 ? "account" : "accounts"}
                  </>
                )}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "RESET" })}
                  className="px-3 py-1.5 rounded text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                >
                  Reset
                </button>
                <ExportButton
                  disabled={!exportReady}
                  onClick={handleExport}
                />
              </div>
            </>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col gap-6">
        {parseError && (
          <div className="rounded border border-rose-700 bg-rose-950/50 px-3 py-2 text-sm text-rose-200">
            {parseError}
          </div>
        )}

        {!fileLoaded && (
          <Uploader
            onParsed={(fileName, rows, headers) =>
              dispatch({ type: "LOAD", fileName, rows, headers })
            }
            onError={(error) => dispatch({ type: "SET_ERROR", error })}
          />
        )}

        {fileLoaded && (
          <div className="flex flex-wrap items-center gap-4">
            <AccountColumnPicker
              headers={headers}
              value={accountColumn}
              onChange={(column) =>
                dispatch({ type: "SET_ACCOUNT_COLUMN", column })
              }
            />
            {!accountColumn && (
              <span className="text-xs text-neutral-400">
                Pick the column that identifies the account to start grouping.
              </span>
            )}
          </div>
        )}

        {fileLoaded && accountColumn && groups.length > 0 && (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <AccountSection
                key={`${accountColumn}__${group.name}`}
                group={group}
                headers={headers}
                defaultExpanded={defaultExpanded}
                statusByRowId={statusByRowId}
                onCycle={(rowId) =>
                  dispatch({ type: "CYCLE_STATUS", rowId })
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
