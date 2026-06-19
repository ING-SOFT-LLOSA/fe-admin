/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn().mockReturnValue({ name: "test-app" }),
  getApps: vi.fn().mockReturnValue([]),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ currentUser: null }),
}));

import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const mockGetApps = vi.mocked(getApps);
const mockInitializeApp = vi.mocked(initializeApp);
const mockGetAuth = vi.mocked(getAuth);

describe("firebase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({ name: "test-app" } as any);
    mockGetAuth.mockReturnValue({ currentUser: null } as any);
  });

  it("llama a initializeApp cuando no hay apps inicializadas", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA = "fake-api-key";
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA = "fake.firebaseapp.com";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA = "fake-project";

    const { getFirebaseAuth } = await import("./firebase");
    getFirebaseAuth();
    expect(mockInitializeApp).toHaveBeenCalledOnce();
    expect(mockGetAuth).toHaveBeenCalledOnce();
  });

  it("reutiliza la app existente cuando ya hay una inicializada", async () => {
    const existingApp = { name: "existing-app" } as any;
    mockGetApps.mockReturnValue([existingApp]);

    const { getFirebaseAuth } = await import("./firebase");
    getFirebaseAuth();
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetAuth).toHaveBeenCalledWith(existingApp);
  });

  it("lanza error si faltan variables de entorno", async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA;
    mockGetApps.mockReturnValue([]);

    const { getFirebaseAuth } = await import("./firebase");
    expect(() => getFirebaseAuth()).toThrow(
      "Faltan variables NEXT_PUBLIC_FIREBASE_*_LLOSA"
    );
  });
});
