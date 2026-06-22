import { describe, it, expect, vi } from "vitest";
import { NextResponse, NextRequest } from "next/server";

vi.mock("next/server", () => {
  const headers = {
    set: vi.fn(),
  };
  return {
    NextResponse: {
      next: vi.fn(() => ({ type: "next", headers })),
      redirect: vi.fn((url: URL) => ({ type: "redirect", url, headers })),
    },
  };
});

import { proxy } from "./proxy";

function makeRequest(cookie?: string): NextRequest {
  const url = "https://backoffice.llosaedificaciones.com/proyectos";
  return {
    cookies: {
      get: vi.fn().mockReturnValue(cookie ? { value: cookie } : undefined),
    },
    url,
    nextUrl: {
      pathname: "/proyectos",
    },
    headers: new Map(),
  } as unknown as NextRequest;
}

describe("proxy", () => {
  it("permite continuar si la cookie llosa_id_token está presente", () => {
    const req = makeRequest("token-123");
    const res = proxy(req);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(res).toMatchObject({ type: "next" });
    expect(res.headers.set).toHaveBeenCalledWith(
      "Content-Security-Policy",
      expect.stringContaining("script-src")
    );
  });

  it("redirige a /login si no hay cookie llosa_id_token", () => {
    const req = makeRequest();
    const res = proxy(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res).toMatchObject({ type: "redirect" });
    expect(res.headers.set).toHaveBeenCalledWith(
      "Content-Security-Policy",
      expect.stringContaining("script-src")
    );
  });
});

describe("config matcher", () => {
  it("exporta un matcher configurado", async () => {
    const mod = await import("./proxy");
    expect(mod.config).toBeDefined();
    expect(mod.config.matcher).toBeDefined();
    expect(Array.isArray(mod.config.matcher)).toBe(true);
    expect(mod.config.matcher[0]).toContain("(?!api|_next");
  });
});
