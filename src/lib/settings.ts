// User settings kept in localStorage (per browser). Exposed as a tiny external
// store so React can read it with useSyncExternalStore.

const STORAGE_KEY = "csv-account-splitter:settings";

// Accounts that don't report through Expensify; used until the user edits the list.
export const DEFAULT_IGNORED_ACCOUNTS: readonly string[] = [
  "dwayne@ezoic.com",
  "accounting@ezoic.com",
];

const listeners = new Set<() => void>();
let cachedIgnored: readonly string[] | null = null;

export function normalizeAccount(value: string): string {
  return value.trim().toLowerCase();
}

function readIgnored(): readonly string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_IGNORED_ACCOUNTS;
    const parsed: unknown = JSON.parse(raw);
    const list =
      parsed && typeof parsed === "object"
        ? (parsed as { ignoredAccounts?: unknown }).ignoredAccounts
        : undefined;
    if (!Array.isArray(list)) return DEFAULT_IGNORED_ACCOUNTS;
    return list.filter((v): v is string => typeof v === "string");
  } catch {
    return DEFAULT_IGNORED_ACCOUNTS;
  }
}

export function getIgnoredAccounts(): readonly string[] {
  if (cachedIgnored === null) cachedIgnored = readIgnored();
  return cachedIgnored;
}

export function getServerIgnoredAccounts(): readonly string[] {
  return DEFAULT_IGNORED_ACCOUNTS;
}

export function setIgnoredAccounts(accounts: readonly string[]): void {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const a of accounts) {
    const n = normalizeAccount(a);
    if (n && !seen.has(n)) {
      seen.add(n);
      next.push(n);
    }
  }
  cachedIgnored = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ignoredAccounts: next }));
  } catch {
    // Storage unavailable — the change still applies for this page load.
  }
  listeners.forEach((l) => l());
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedIgnored = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function isIgnoredAccount(
  account: string,
  ignored: readonly string[],
): boolean {
  return ignored.includes(normalizeAccount(account));
}
