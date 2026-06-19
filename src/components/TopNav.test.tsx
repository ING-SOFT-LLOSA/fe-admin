/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TopNav from "./TopNav";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("TopNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el breadcrumb correcto para /proyectos", () => {
    vi.mocked(usePathname).mockReturnValue("/proyectos");
    render(<TopNav />);
    expect(screen.getByText("Proyectos e Inventario")).toBeDefined();
  });

  it("muestra el breadcrumb correcto para /clientes", () => {
    vi.mocked(usePathname).mockReturnValue("/clientes");
    render(<TopNav />);
    expect(screen.getByText("Clientes y Asignaciones")).toBeDefined();
  });

  it("muestra el breadcrumb correcto para /obra", () => {
    vi.mocked(usePathname).mockReturnValue("/obra");
    render(<TopNav />);
    expect(screen.getByText("Avance de Obra")).toBeDefined();
  });

  it("muestra el breadcrumb correcto para /finanzas", () => {
    vi.mocked(usePathname).mockReturnValue("/finanzas");
    render(<TopNav />);
    expect(screen.getByText("Pagos y Cronogramas")).toBeDefined();
  });

  it("muestra el breadcrumb correcto para /legal", () => {
    vi.mocked(usePathname).mockReturnValue("/legal");
    render(<TopNav />);
    expect(screen.getByText("Gestión Legal")).toBeDefined();
  });

  it("muestra el breadcrumb correcto para /agenda", () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    render(<TopNav />);
    expect(screen.getByText("Agenda y Citas")).toBeDefined();
  });

  it("muestra el breadcrumb correcto para /configuracion", () => {
    vi.mocked(usePathname).mockReturnValue("/configuracion");
    render(<TopNav />);
    expect(screen.getByText("Gestión de Empleados")).toBeDefined();
  });

  it("muestra el segmento crudo si no está en el mapeo de crumbs", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<TopNav />);
    expect(screen.getByText("dashboard")).toBeDefined();
  });

  it("muestra el breadcrumb correcto para ruta anidada /proyectos/123", () => {
    vi.mocked(usePathname).mockReturnValue("/proyectos/123/unidades");
    render(<TopNav />);
    expect(screen.getByText("Proyectos e Inventario")).toBeDefined();
  });

  it("muestra Backoffice como título", () => {
    vi.mocked(usePathname).mockReturnValue("/proyectos");
    render(<TopNav />);
    expect(screen.getByText("Backoffice")).toBeDefined();
  });
});
