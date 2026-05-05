"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import type { Row } from "@/lib/types";

interface Props {
  onParsed: (fileName: string, rows: Row[], headers: string[]) => void;
  onError: (error: string) => void;
}

export default function Uploader({ onParsed, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!/\.csv$/i.test(file.name)) {
        onError(`"${file.name}" is not a .csv file.`);
        return;
      }
      setBusy(true);
      Papa.parse<Row>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setBusy(false);
          const fatal = (results.errors ?? []).filter(
            (e) => e.type !== "FieldMismatch",
          );
          if (fatal.length > 0) {
            onError(`Parse error: ${fatal[0].message}`);
            return;
          }
          const headers = results.meta.fields ?? [];
          if (headers.length === 0) {
            onError("CSV is empty or missing a header row.");
            return;
          }
          onParsed(file.name, results.data as Row[], headers);
        },
        error: (err) => {
          setBusy(false);
          onError(err.message);
        },
      });
    },
    [onParsed, onError],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-10 transition-colors ${
        dragging
          ? "border-blue-400 bg-blue-950/30"
          : "border-neutral-700 bg-neutral-900/50"
      }`}
    >
      <p className="text-neutral-300 text-sm">
        Drag a CSV here, or
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white rounded text-sm font-medium"
      >
        {busy ? "Parsing..." : "Choose file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onInputChange}
        className="hidden"
      />
      <p className="text-xs text-neutral-500">
        All processing happens in your browser. Nothing is uploaded.
      </p>
    </div>
  );
}
