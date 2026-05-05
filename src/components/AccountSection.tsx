"use client";

import { useState } from "react";
import type { Group, Status } from "@/lib/types";
import RowStatusToggle from "./RowStatusToggle";

interface Props {
  group: Group;
  headers: string[];
  defaultExpanded: boolean;
  statusByRowId: Record<string, Status>;
  onCycle: (rowId: string) => void;
}

export default function AccountSection({
  group,
  headers,
  defaultExpanded,
  statusByRowId,
  onCycle,
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
                {headers.map((h) => (
                  <th
                    key={h}
                    className="text-left px-2 py-1 border-b border-neutral-700 font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                <th className="text-left px-2 py-1 border-b border-neutral-700 font-medium whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {group.items.map(({ row, rowId }) => (
                <tr key={rowId} className="even:bg-neutral-900/40">
                  {headers.map((h) => (
                    <td
                      key={h}
                      className="px-2 py-1 border-b border-neutral-800/60 align-top whitespace-pre-wrap break-all"
                    >
                      {row[h] ?? ""}
                    </td>
                  ))}
                  <td className="px-2 py-1 border-b border-neutral-800/60 align-top">
                    <RowStatusToggle
                      status={statusByRowId[rowId] ?? "unchecked"}
                      onCycle={() => onCycle(rowId)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
