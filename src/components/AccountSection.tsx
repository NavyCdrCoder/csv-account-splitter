"use client";

import { memo, useState } from "react";
import type { Group, RenderCol, Status } from "@/lib/types";
import RowStatusToggle from "./RowStatusToggle";
import RowStatusDropdown from "./RowStatusDropdown";

interface Props {
  group: Group;
  renderCols: RenderCol[];
  defaultExpanded: boolean;
  statusByRowId: Record<string, Status>;
  onCycle: (rowId: string) => void;
  onSetStatus: (rowId: string, status: Status) => void;
  onSetGroupStatus: (rowIds: string[], status: Status) => void;
  onHideColumn: (column: string) => void;
}

function AccountSection({
  group,
  renderCols,
  defaultExpanded,
  statusByRowId,
  onCycle,
  onSetStatus,
  onSetGroupStatus,
  onHideColumn,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const displayName = group.name || "(blank)";
  const rowLabel = group.items.length === 1 ? "row" : "rows";
  const allFound =
    group.items.length > 0 &&
    group.items.every(
      ({ rowId }) => (statusByRowId[rowId] ?? "unchecked") === "found",
    );

  return (
    <section
      className={`border rounded overflow-hidden ${
        allFound ? "border-emerald-600" : "border-neutral-800"
      }`}
    >
      <div
        className={`flex items-center transition-colors ${
          allFound
            ? "bg-emerald-700 hover:bg-emerald-600 text-emerald-50"
            : "bg-neutral-900 hover:bg-neutral-800"
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 min-w-0 flex items-center justify-between gap-3 px-3 py-2 text-left"
          aria-expanded={expanded}
        >
          <span className="font-medium truncate">{displayName}</span>
          <span
            className={`text-xs shrink-0 tabular-nums ${
              allFound ? "text-emerald-100" : "text-neutral-400"
            }`}
          >
            {group.items.length} {rowLabel}
            <span className="ml-2 inline-block w-3 text-center">
              {expanded ? "−" : "+"}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() =>
            onSetGroupStatus(
              group.items.map(({ rowId }) => rowId),
              "found",
            )
          }
          disabled={allFound}
          className="mr-2 px-2 py-0.5 rounded text-xs border border-emerald-600 text-emerald-200 hover:bg-emerald-800/60 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
          title={`Mark all ${group.items.length} rows for ${displayName} as Found`}
        >
          Mark all Found
        </button>
      </div>
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-neutral-800/60 text-neutral-300">
                {renderCols.map((col, idx) =>
                  col.kind === "data" ? (
                    <th
                      key={`h-${idx}`}
                      className="text-left px-2 py-1 border-b border-neutral-700 font-medium whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        <span className="truncate">{col.name}</span>
                        {col.isAccountColumn ? (
                          <span
                            className="text-[10px] px-1 rounded bg-blue-900/60 text-blue-200 border border-blue-700/60"
                            title="Account column (cannot be hidden)"
                          >
                            account
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onHideColumn(col.name);
                            }}
                            className="text-neutral-500 hover:text-rose-400 px-1 rounded leading-none"
                            aria-label={`Hide column ${col.name}`}
                            title={`Hide column ${col.name}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    </th>
                  ) : (
                    <th
                      key={`h-${idx}`}
                      className="text-left px-2 py-1 border-b border-neutral-700 font-medium whitespace-nowrap"
                    >
                      Set status
                    </th>
                  ),
                )}
                <th className="text-left px-2 py-1 border-b border-neutral-700 font-medium whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {group.items.map(({ row, rowId }) => {
                const currentStatus = statusByRowId[rowId] ?? "unchecked";
                return (
                  <tr key={rowId} className="even:bg-neutral-900/40">
                    {renderCols.map((col, idx) =>
                      col.kind === "data" ? (
                        <td
                          key={`d-${idx}`}
                          className="px-2 py-1 border-b border-neutral-800/60 align-top whitespace-pre-wrap break-all"
                        >
                          {row[col.name] ?? ""}
                        </td>
                      ) : (
                        <td
                          key={`d-${idx}`}
                          className="px-2 py-1 border-b border-neutral-800/60 align-top"
                        >
                          <RowStatusDropdown
                            status={currentStatus}
                            onSetStatus={(s) => onSetStatus(rowId, s)}
                          />
                        </td>
                      ),
                    )}
                    <td className="px-2 py-1 border-b border-neutral-800/60 align-top">
                      <RowStatusToggle
                        status={currentStatus}
                        onCycle={() => onCycle(rowId)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Skip re-rendering a section unless its own rows' statuses changed, so
// editing one account doesn't re-render every row in every other account.
export default memo(AccountSection, (prev, next) => {
  if (
    prev.group !== next.group ||
    prev.renderCols !== next.renderCols ||
    prev.defaultExpanded !== next.defaultExpanded ||
    prev.onCycle !== next.onCycle ||
    prev.onSetStatus !== next.onSetStatus ||
    prev.onSetGroupStatus !== next.onSetGroupStatus ||
    prev.onHideColumn !== next.onHideColumn
  ) {
    return false;
  }
  if (prev.statusByRowId === next.statusByRowId) return true;
  return prev.group.items.every(
    ({ rowId }) =>
      (prev.statusByRowId[rowId] ?? "unchecked") ===
      (next.statusByRowId[rowId] ?? "unchecked"),
  );
});
