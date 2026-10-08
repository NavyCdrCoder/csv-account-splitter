"use client";

import { useState } from "react";
import {
  DEFAULT_IGNORED_ACCOUNTS,
  normalizeAccount,
  setIgnoredAccounts,
} from "@/lib/settings";

interface Props {
  ignoredAccounts: readonly string[];
  // Account values found in the loaded file, offered as suggestions.
  suggestions: string[];
  onClose: () => void;
}

export default function SettingsDialog({
  ignoredAccounts,
  suggestions,
  onClose,
}: Props) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = normalizeAccount(draft);
    if (!value) return;
    setIgnoredAccounts([...ignoredAccounts, value]);
    setDraft("");
  };

  const remove = (account: string) =>
    setIgnoredAccounts(ignoredAccounts.filter((a) => a !== account));

  const listed = new Set(ignoredAccounts);
  const available = suggestions.filter(
    (s) => s.trim() !== "" && !listed.has(normalizeAccount(s)),
  );

  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center bg-black/60 px-4 pt-24"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-md rounded border border-neutral-700 bg-neutral-900 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="text-base font-semibold">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-1 leading-none text-neutral-400 hover:text-neutral-100"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <h3 className="mt-4 text-sm font-medium">Ignored accounts</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Accounts that don&apos;t report through Expensify. Their rows are left
          out of the account sections and the XLSX export. Saved CSVs still keep
          every row.
        </p>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            list="ignored-account-suggestions"
            placeholder="e.g. someone@ezoic.com"
            autoFocus
            className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500"
          />
          <datalist id="ignored-account-suggestions">
            {available.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="submit"
            disabled={normalizeAccount(draft) === ""}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>

        <ul className="mt-3 flex flex-col gap-1">
          {ignoredAccounts.length === 0 && (
            <li className="text-xs text-neutral-500">No ignored accounts.</li>
          )}
          {ignoredAccounts.map((account) => (
            <li
              key={account}
              className="flex items-center justify-between rounded bg-neutral-800/60 px-2 py-1 text-sm"
            >
              <span className="truncate">{account}</span>
              <button
                type="button"
                onClick={() => remove(account)}
                className="ml-2 px-1 leading-none text-neutral-400 hover:text-rose-400"
                aria-label={`Stop ignoring ${account}`}
                title="Stop ignoring"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIgnoredAccounts(DEFAULT_IGNORED_ACCOUNTS)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
