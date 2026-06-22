import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@/components/ThemeToggle", () => ({
  default: () => <button data-testid="theme-toggle">Toggle</button>,
}));

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";

const mockUsePathname = vi.mocked(usePathname);

describe("TopNav", () => {
  it("renders Backoffice breadcrumb", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<TopNav />);
    expect(screen.getByText("Backoffice")).toBeDefined();
    expect(screen.getByText("/")).toBeDefined();
  });

  it("shows label for known segment proyectos", () => {
    mockUsePathname.mockReturnValue("/proyectos/123");
    render(<TopNav />);
    expect(screen.getByText("Proyectos e Inventario")).toBeDefined();
  });

  it("shows label for known segment clientes", () => {
    mockUsePathname.mockReturnValue("/clientes");
    render(<TopNav />);
    expect(screen.getByText("Clientes y Asignaciones")).toBeDefined();
  });

  it("shows label for known segment obra", () => {
    mockUsePathname.mockReturnValue("/obra");
    render(<TopNav />);
    expect(screen.getByText("Avance de Obra")).toBeDefined();
  });

  it("shows label for known segment finanzas", () => {
    mockUsePathname.mockReturnValue("/finanzas");
    render(<TopNav />);
    expect(screen.getByText("Pagos y Cronogramas")).toBeDefined();
  });

  it("shows label for known segment legal", () => {
    mockUsePathname.mockReturnValue("/legal");
    render(<TopNav />);
    expect(screen.getByText("Gestión Legal")).toBeDefined();
  });

  it("shows label for known segment agenda", () => {
    mockUsePathname.mockReturnValue("/agenda");
    render(<TopNav />);
    expect(screen.getByText("Agenda y Citas")).toBeDefined();
  });

  it("shows label for known segment configuracion", () => {
    mockUsePathname.mockReturnValue("/configuracion");
    render(<TopNav />);
    expect(screen.getByText("Gestión de Empleados")).toBeDefined();
  });

  it("handles unknown segment gracefully", () => {
    mockUsePathname.mockReturnValue("/unknown");
    render(<TopNav />);
    expect(screen.getByText("unknown")).toBeDefined();
  });

  it("renders user avatar", () => {
    mockUsePathname.mockReturnValue("/proyectos");
    render(<TopNav />);
    expect(screen.getByText("Admin")).toBeDefined();
    expect(screen.getByText("Admin Global")).toBeDefined();
  });
});
