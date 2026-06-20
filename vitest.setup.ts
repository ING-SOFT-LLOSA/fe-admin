// Vitest global setup: suppress act() warnings and polyfill missing browser APIs
import { vi } from "vitest";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT is a testing flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.spyOn(console, "warn").mockImplementation(() => {});

// jsdom polyfills
Element.prototype.scrollIntoView = vi.fn();

// Polyfill matchMedia for next-themes (used by ThemeProvider)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
