"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import Uploader from "@/components/Uploader";
import AccountColumnPicker from "@/components/AccountColumnPicker";
import AccountSection from "@/components/AccountSection";
import ExportButton from "@/components/ExportButton";
import {
  type Action,
  type Group,
  type RenderCol,
  type State,
  autoPickAccountColumn,
  initialState,
  makeRowId,
} from "@/lib/types";
import { STATUS_CYCLE } from "@/lib/status";
import { exportToXlsx } from "@/lib/exportXlsx";
import { saveReviewCsv } from "@/lib/exportCsv";
import {
  type PersistedSession,
  clearSession,
  exportSessionFile,
  loadSession,
  readSessionFile,
  relativeTimeFrom,
  saveSession,
} from "@/lib/persistence";

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
        hiddenColumns: [],
        showResetReminder: false,
        previousSession: null,
      };
    }
    case "SET_ACCOUNT_COLUMN":
      return {
        ...state,
        accountColumn: action.column,
        statusByRowId: {},
        hiddenColumns: state.hiddenColumns.filter((c) => c !== action.column),
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
    case "SET_STATUS":
      return {
        ...state,
        statusByRowId: {
          ...state.statusByRowId,
          [action.rowId]: action.status,
        },
      };
    case "HIDE_COLUMN":
      if (action.column === state.accountColumn) return state;
      return state.hiddenColumns.includes(action.column)
        ? state
        : { ...state, hiddenColumns: [...state.hiddenColumns, action.column] };
    case "SHOW_COLUMN":
      return {
        ...state,
        hiddenColumns: state.hiddenColumns.filter((c) => c !== action.column),
      };
    case "SHOW_ALL_COLUMNS":
      return { ...state, hiddenColumns: [] };
    case "RESET": {
      const hadFile = state.fileName !== null && state.rows.length > 0;
      return {
        ...initialState,
        showResetReminder: true,
        previousSession: hadFile
          ? {
              fileName: state.fileName!,
              rows: state.rows,
              headers: state.headers,
              accountColumn: state.accountColumn,
              statusByRowId: state.statusByRowId,
              hiddenColumns: state.hiddenColumns,
            }
          : null,
      };
    }
    case "DISMISS_RESET_REMINDER":
      return { ...state, showResetReminder: false, previousSession: null };
    case "RESTORE_PREVIOUS": {
      const p = state.previousSession;
      if (!p) return state;
      return {
        fileName: p.fileName,
        rows: p.rows,
        headers: p.headers,
        accountColumn: p.accountColumn,
        statusByRowId: p.statusByRowId,
        hiddenColumns: p.hiddenColumns,
        parseError: null,
        showResetReminder: false,
        previousSession: null,
      };
    }
    case "RESUME_SESSION": {
      const s = action.session;
      return {
        fileName: s.fileName,
        rows: s.rows,
        headers: s.headers,
        accountColumn: s.accountColumn,
        statusByRowId: s.statusByRowId,
        hiddenColumns: s.hiddenColumns,
        parseError: null,
        showResetReminder: false,
        previousSession: null,
      };
    }
    case "SET_ERROR":
      return { ...initialState, parseError: action.error };
  }
}

export default function Page() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    fileName,
    rows,
    headers,
    accountColumn,
    statusByRowId,
    parseError,
    hiddenColumns,
    showResetReminder,
    previousSession,
  } = state;

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

  const renderCols: RenderCol[] = useMemo(() => {
    if (!accountColumn) return [];
    const hidden = new Set(hiddenColumns);
    // Account column is always visible — it's the grouping key.
    const visible = headers.filter(
      (h) => h === accountColumn || !hidden.has(h),
    );
    const cols: RenderCol[] = [];
    for (const h of visible) {
      cols.push({
        kind: "data",
        name: h,
        isAccountColumn: h === accountColumn,
      });
      if (h === accountColumn) cols.push({ kind: "statusDropdown" });
    }
    return cols;
  }, [headers, hiddenColumns, accountColumn]);

  const fileLoaded = fileName !== null && rows.length > 0;
  const exportReady = fileLoaded && accountColumn !== null && groups.length > 0;
  const defaultExpanded = groups.length <= 5;

  const handleExport = () => {
    if (!fileName || !accountColumn) return;
    exportToXlsx({ fileName, headers, groups, statusByRowId });
  };

  const handleReviewComplete = async () => {
    if (!fileName || !accountColumn) return;
    await saveReviewCsv({
      fileName,
      headers,
      rows,
      accountColumn,
      statusByRowId,
    });
  };

  const [pendingResume, setPendingResume] = useState<PersistedSession | null>(
    null,
  );
  const [sessionImportError, setSessionImportError] = useState<string | null>(
    null,
  );
  const sessionFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fileLoaded) {
      setPendingResume(loadSession());
    } else {
      setPendingResume(null);
    }
  }, [fileLoaded]);

  useEffect(() => {
    if (!fileLoaded) return;
    const t = window.setTimeout(() => saveSession(state), 400);
    return () => window.clearTimeout(t);
  }, [state, fileLoaded]);

  const handleStartNewReview = () => {
    clearSession();
    dispatch({ type: "RESET" });
  };

  const handleResume = (session: PersistedSession) => {
    dispatch({ type: "RESUME_SESSION", session });
  };

  const handleDiscardResume = () => {
    clearSession();
    setPendingResume(null);
  };

  const handleExportSession = async () => {
    await exportSessionFile(state);
  };

  const handleSessionFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSessionImportError(null);
    try {
      const session = await readSessionFile(file);
      dispatch({ type: "RESUME_SESSION", session });
    } catch (err) {
      setSessionImportError(
        err instanceof Error ? err.message : "Could not read session file.",
      );
    }
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
              <span
                className="text-lg font-semibold text-blue-100 bg-blue-900/50 border border-blue-700/60 px-2 py-0.5 rounded truncate max-w-[24rem]"
                title={fileName ?? undefined}
              >
                {fileName}
              </span>
              <span className="text-xs text-neutral-400 tabular-nums">
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
                  onClick={handleExportSession}
                  className="px-3 py-1.5 rounded text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                  title="Download a JSON file you can re-upload to resume on another device"
                >
                  Save Session
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

        {!fileLoaded && showResetReminder && (
          <div className="rounded border border-amber-700 bg-amber-950/40 px-3 py-3 text-sm text-amber-100 flex items-start gap-3">
            <div className="flex-1">
              <p className="font-medium">Save your previous review first.</p>
              <p className="text-xs text-amber-200/80 mt-1">
                If you haven&apos;t already, go back and click{" "}
                <span className="font-medium">Review Complete</span> to save the
                reviewed CSV before uploading a new file.
              </p>
              {previousSession && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-amber-200/70">
                    Didn&apos;t save yet?
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "RESTORE_PREVIOUS" })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-700/40 hover:bg-amber-700/70 text-amber-50 border border-amber-600"
                    title={`Return to ${previousSession.fileName}`}
                  >
                    <span aria-hidden>←</span> Return to previous file
                    <span className="text-amber-200/70 hidden sm:inline">
                      ({previousSession.fileName})
                    </span>
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "DISMISS_RESET_REMINDER" })}
              className="text-amber-300 hover:text-amber-100 px-1 leading-none"
              aria-label="Dismiss reminder"
            >
              ×
            </button>
          </div>
        )}

        {!fileLoaded && pendingResume && (
          <div className="rounded border border-blue-700 bg-blue-950/40 px-3 py-3 text-sm text-blue-100 flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium">Resume your saved session?</p>
              <p className="text-xs text-blue-200/80 mt-1 truncate">
                <span className="text-blue-100">{pendingResume.fileName}</span>
                <span className="mx-2 text-blue-300/60">·</span>
                {pendingResume.rows.length} rows
                <span className="mx-2 text-blue-300/60">·</span>
                saved {relativeTimeFrom(pendingResume.savedAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleResume(pendingResume)}
                className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={handleDiscardResume}
                className="px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {sessionImportError && (
          <div className="rounded border border-rose-700 bg-rose-950/50 px-3 py-2 text-sm text-rose-200">
            {sessionImportError}
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

        {!fileLoaded && (
          <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-2">
            <span>Have a saved session file?</span>
            <button
              type="button"
              onClick={() => sessionFileInputRef.current?.click()}
              className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200"
            >
              Load session (.json)
            </button>
            <input
              ref={sessionFileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleSessionFileChange}
              className="hidden"
            />
          </div>
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

        {fileLoaded && accountColumn && hiddenColumns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-400">
              Hidden columns ({hiddenColumns.length} of {headers.length}, applied across all
              accounts):
            </span>
            {hiddenColumns.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => dispatch({ type: "SHOW_COLUMN", column: c })}
                className="px-2 py-0.5 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 inline-flex items-center gap-1"
                title={`Show column ${c}`}
              >
                <span className="truncate max-w-[14rem]">{c}</span>
                <span className="text-neutral-500">+</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => dispatch({ type: "SHOW_ALL_COLUMNS" })}
              className="ml-1 text-blue-400 hover:text-blue-300"
            >
              Show all
            </button>
          </div>
        )}

        {fileLoaded && accountColumn && groups.length > 0 && (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <AccountSection
                key={`${accountColumn}__${group.name}`}
                group={group}
                renderCols={renderCols}
                defaultExpanded={defaultExpanded}
                statusByRowId={statusByRowId}
                onCycle={(rowId) =>
                  dispatch({ type: "CYCLE_STATUS", rowId })
                }
                onSetStatus={(rowId, status) =>
                  dispatch({ type: "SET_STATUS", rowId, status })
                }
                onHideColumn={(column) =>
                  dispatch({ type: "HIDE_COLUMN", column })
                }
              />
            ))}
          </div>
        )}

        {fileLoaded && accountColumn && groups.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-2 border-t border-neutral-800">
            <p className="text-xs text-neutral-400 max-w-md">
              When you&apos;re done, click{" "}
              <span className="text-neutral-200">Review Complete</span> to save
              the reviewed CSV. Then start a new review to clear the dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReviewComplete}
                className="px-4 py-2 rounded text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Review Complete — Save CSV
              </button>
              <button
                type="button"
                onClick={handleStartNewReview}
                className="px-4 py-2 rounded text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              >
                Start New Review
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
