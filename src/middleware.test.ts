import { describe, it, expect, vi } from "vitest";
import { NextResponse, NextRequest } from "next/server";

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: "next" })),
    redirect: vi.fn((url: URL) => ({ type: "redirect", url })),
  },
}));

import { middleware } from "./middleware";

function makeRequest(cookie?: string): NextRequest {
  return {
    cookies: {
      get: vi.fn().mockReturnValue(cookie ? { value: cookie } : undefined),
    },
    url: "https://backoffice.llosaedificaciones.com/proyectos",
  } as unknown as NextRequest;
}

describe("middleware", () => {
  it("permite continuar si la cookie llosa_id_token está presente", () => {
    const req = makeRequest("token-123");
    const res = middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(res).toEqual({ type: "next" });
  });

  it("redirige a /login si no hay cookie llosa_id_token", () => {
    const req = makeRequest();
    const res = middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res).toMatchObject({ type: "redirect" });
  });
});

describe("config matcher", () => {
  it("exporta un matcher configurado", async () => {
    const mod = await import("./middleware");
    expect(mod.config).toBeDefined();
    expect(mod.config.matcher).toBeDefined();
    expect(Array.isArray(mod.config.matcher)).toBe(true);
    expect(mod.config.matcher[0]).toContain("(?!api|_next");
  });
});
