// Vitest global setup: suppress act() warnings and polyfill missing browser APIs
import { vi } from "vitest";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT is a testing flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.spyOn(console, "warn").mockImplementation(() => {});

// jsdom polyfills
Element.prototype.scrollIntoView = vi.fn();
