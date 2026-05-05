"use client";

import { useState } from "react";
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
  onHideColumn: (column: string) => void;
}

export default function AccountSection({
  group,
  renderCols,
  defaultExpanded,
  statusByRowId,
  onCycle,
  onSetStatus,
  onHideColumn,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const displayName = group.name || "(blank)";
  const rowLabel = group.items.length === 1 ? "row" : "rows";

  return (
    <section className="border border-neutral-800 rounded overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-left"
        aria-expanded={expanded}
      >
        <span className="font-medium truncate">{displayName}</span>
        <span className="text-xs text-neutral-400 shrink-0 tabular-nums">
          {group.items.length} {rowLabel}
          <span className="ml-2 inline-block w-3 text-center">
            {expanded ? "−" : "+"}
          </span>
        </span>
      </button>
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
