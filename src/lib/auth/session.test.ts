/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: vi.fn(),
}));

import { getFirebaseAuth } from "@/lib/firebase";
import { saveSession, clearSession, getStoredToken, getFreshToken } from "./session";

const mockGetFirebaseAuth = vi.mocked(getFirebaseAuth);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    document.cookie = `${name}=; path=/; max-age=0`;
  });
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

describe("session", () => {
  beforeEach(() => {
    clearCookies();
    localStorageMock.clear();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearCookies();
    localStorageMock.clear();
  });

  describe("saveSession", () => {
    it("guarda el token en la cookie", () => {
      saveSession("mi-token", {} as any);
      expect(document.cookie).toContain("llosa_id_token=mi-token");
    });

    it("no falla en entorno SSR (window undefined)", () => {
      const originalWindow = global.window;
      // @ts-expect-error simulating SSR
      delete global.window;
      expect(() => saveSession("tok", {} as any)).not.toThrow();
      global.window = originalWindow;
    });
  });

  describe("clearSession", () => {
    it("elimina el token de la cookie", () => {
      setCookie("llosa_id_token", "tok-123");
      expect(document.cookie).toContain("llosa_id_token=tok-123");
      clearSession();
      const match = document.cookie.match(/llosa_id_token=([^;]+)/);
      expect(match?.[1]).toBeUndefined();
    });

    it("elimina tokens legacy de localStorage", () => {
      localStorage.setItem("llosa_id_token", "old-tok");
      localStorage.setItem("llosa_perfil", '{"id":1}');
      clearSession();
      expect(localStorage.getItem("llosa_id_token")).toBeNull();
      expect(localStorage.getItem("llosa_perfil")).toBeNull();
    });
  });

  describe("getStoredToken", () => {
    it("retorna null si no hay cookie", () => {
      expect(getStoredToken()).toBeNull();
    });

    it("retorna el token almacenado en la cookie", () => {
      setCookie("llosa_id_token", "cookie-tok");
      expect(getStoredToken()).toBe("cookie-tok");
    });
  });

  describe("getFreshToken", () => {
    it("retorna null si no hay currentUser en Firebase", async () => {
      mockGetFirebaseAuth.mockReturnValue({ currentUser: null } as any);
      const token = await getFreshToken();
      expect(token).toBeNull();
    });

    it("retorna el token fresco de Firebase", async () => {
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue("fresh-token-xyz"),
      };
      mockGetFirebaseAuth.mockReturnValue({ currentUser: mockUser } as any);
      const token = await getFreshToken();
      expect(token).toBe("fresh-token-xyz");
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
    });

    it("actualiza la cookie si el token cambió", async () => {
      setCookie("llosa_id_token", "old-token");
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue("new-token"),
      };
      mockGetFirebaseAuth.mockReturnValue({ currentUser: mockUser } as any);
      await getFreshToken();
      expect(document.cookie).toContain("llosa_id_token=new-token");
    });

    it("no actualiza la cookie si el token no cambió", async () => {
      setCookie("llosa_id_token", "same-token");
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue("same-token"),
      };
      mockGetFirebaseAuth.mockReturnValue({ currentUser: mockUser } as any);
      const cookieSpy = vi.spyOn(document, "cookie", "set");
      await getFreshToken();
      expect(cookieSpy).not.toHaveBeenCalled();
      cookieSpy.mockRestore();
    });

    it("retorna null si Firebase lanza error", async () => {
      mockGetFirebaseAuth.mockImplementation(() => {
        throw new Error("Firebase init failed");
      });
      const token = await getFreshToken();
      expect(token).toBeNull();
    });

    it("retorna null en entorno SSR", async () => {
      const originalWindow = global.window;
      // @ts-expect-error simulating SSR
      delete global.window;
      const token = await getFreshToken();
      expect(token).toBeNull();
      global.window = originalWindow;
    });
  });
});
