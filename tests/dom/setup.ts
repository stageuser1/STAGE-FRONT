/**
 * What jsdom does not implement, and what every DOM test must undo.
 *
 * Three stubs, each for a browser API jsdom leaves unimplemented rather than
 * one it implements differently. None of them fakes behaviour the tests then
 * assert: `scrollIntoView` and `scrollTo` are recorded no-ops because a test
 * cannot see a scroll anyway, and `matchMedia` answers "no preference", which
 * is the branch the components take in a default browser.
 *
 * Testing Library's cleanup is wired explicitly because this project runs with
 * `globals: false` — without a global `afterEach` the automatic teardown never
 * registers, and the second test in a file would render into the first one's
 * document.
 */
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {};
}

window.scrollTo = (() => {}) as typeof window.scrollTo;

window.matchMedia =
  window.matchMedia ??
  ((query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList);

beforeEach(() => {
  // Attempt drafts are keyed per set in localStorage, and jsdom keeps one
  // store for the whole file. A test that leaves a draft behind would hand the
  // next one a restore dialog it never asked for.
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
