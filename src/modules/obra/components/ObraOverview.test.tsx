/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ObraOverview from "./ObraOverview";

vi.mock("@/modules/proyectos/services", () => ({
  fetchProyectos: vi.fn(),
}));

vi.mock("@/lib/api/obra", () => ({
  getAvanceGeneral: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

import { fetchProyectos } from "@/modules/proyectos/services";
import { getAvanceGeneral } from "@/lib/api/obra";

const mockFetchProyectos = vi.mocked(fetchProyectos);
const mockGetAvance = vi.mocked(getAvanceGeneral);

describe("ObraOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProyectos.mockResolvedValue([]);
    mockGetAvance.mockResolvedValue({ porcentajeAvance: 0 });
  });

  it("muestra el título Avance de Obra", () => {
    render(<ObraOverview />);
    expect(screen.getByText("Avance de Obra")).toBeDefined();
  });

  it("muestra input de búsqueda", () => {
    render(<ObraOverview />);
    expect(screen.getByPlaceholderText("Buscar por nombre o dirección...")).toBeDefined();
  });

  it("muestra mensaje de carga mientras se cargan proyectos", () => {
    mockFetchProyectos.mockReturnValue(new Promise(() => {}));
    render(<ObraOverview />);
    expect(screen.getByText("Cargando avances...")).toBeDefined();
  });

  it("muestra mensaje cuando no hay proyectos", async () => {
    mockFetchProyectos.mockResolvedValue([]);
    render(<ObraOverview />);
    expect(await screen.findByText("No hay proyectos registrados.")).toBeDefined();
  });

  it("muestra mensaje de error si la carga falla", async () => {
    mockFetchProyectos.mockRejectedValue(new Error("Error de red"));
    render(<ObraOverview />);
    expect(await screen.findByText("Error de red")).toBeDefined();
  });
});
