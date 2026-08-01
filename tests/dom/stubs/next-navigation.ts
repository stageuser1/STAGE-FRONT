/**
 * `next/navigation`, reduced to a query string and a history of calls.
 *
 * The two hooks the Listening library uses are `useSearchParams` (its filter
 * state) and `useRouter().replace` (how that state is written back). The real
 * implementations need an App Router context; what a test needs is far smaller:
 * somewhere to put a starting URL, and somewhere to read what the component
 * asked for.
 *
 * The store is reactive — `useSyncExternalStore`, not a module-level read — so
 * a test can move the URL *underneath* a mounted component and watch it adopt
 * the change. That is the only honest way to assert the Back-button half of a
 * URL round trip without a browser.
 *
 * Every export prefixed `__` is a test control and has no counterpart in the
 * real module.
 */
import { useCallback, useSyncExternalStore } from "react";

type Nav = { method: "push" | "replace"; url: string };

const DEFAULT_PATHNAME = "/ielts-lab/listening";

let pathname = DEFAULT_PATHNAME;
let query = "";
let params = new URLSearchParams();
const listeners = new Set<() => void>();

/** Every navigation the component asked for, in order. */
export const __navigations: Nav[] = [];

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Point the stub at a URL, as if the browser had just landed on one. */
export function __setUrl(url: string): void {
  const [path, search = ""] = url.split("?");
  if (path) pathname = path;
  query = new URLSearchParams(search).toString();
  params = new URLSearchParams(query);
  emit();
}

/** Back to a bare route with no filters, and no recorded navigations. */
export function __reset(): void {
  pathname = DEFAULT_PATHNAME;
  query = "";
  params = new URLSearchParams();
  __navigations.length = 0;
  emit();
}

/** The current query string, as the stub holds it. */
export function __query(): string {
  return query;
}

function snapshot(): string {
  return query;
}

export function useSearchParams(): URLSearchParams {
  // Subscribing to the *string* rather than the object keeps the snapshot
  // stable between renders; `params` is rebuilt only when the string changes.
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return params;
}

export function usePathname(): string {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return pathname;
}

export interface StubRouter {
  push: (url: string) => void;
  replace: (url: string) => void;
}

export function useRouter(): StubRouter {
  const navigate = useCallback((method: "push" | "replace", url: string) => {
    __navigations.push({ method, url });
    __setUrl(url.startsWith("?") ? `${pathname}${url}` : url);
  }, []);

  return {
    push: useCallback((url: string) => navigate("push", url), [navigate]),
    replace: useCallback((url: string) => navigate("replace", url), [navigate]),
  };
}
