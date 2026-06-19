/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectSectionNav from "./ProjectSectionNav";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe("ProjectSectionNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza las secciones Resumen e Inventario", () => {
    vi.mocked(usePathname).mockReturnValue("/proyectos/123");
    render(<ProjectSectionNav projectId="123" />);

    expect(screen.getByText("Resumen")).toBeDefined();
    expect(screen.getByText("Inventario")).toBeDefined();
  });

  it("resalta Resumen cuando está en la ruta base del proyecto", () => {
    vi.mocked(usePathname).mockReturnValue("/proyectos/123");
    render(<ProjectSectionNav projectId="123" />);

    const resumen = screen.getByText("Resumen").closest("a");
    expect(resumen?.className).toContain("bg-build-main");
  });

  it("resalta Inventario cuando está en la ruta de unidades", () => {
    vi.mocked(usePathname).mockReturnValue("/proyectos/123/unidades");
    render(<ProjectSectionNav projectId="123" />);

    const inventario = screen.getByText("Inventario").closest("a");
    expect(inventario?.className).toContain("bg-build-main");
  });

  it("los links apuntan al proyecto correcto", () => {
    vi.mocked(usePathname).mockReturnValue("/proyectos/456");
    render(<ProjectSectionNav projectId="456" />);

    const resumen = screen.getByText("Resumen").closest("a");
    const inventario = screen.getByText("Inventario").closest("a");
    expect(resumen?.getAttribute("href")).toBe("/proyectos/456");
    expect(inventario?.getAttribute("href")).toBe("/proyectos/456/unidades");
  });
});
