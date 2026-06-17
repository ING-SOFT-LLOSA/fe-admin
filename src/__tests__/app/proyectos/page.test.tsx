import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProjectsOverview from "@/modules/proyectos/components/ProjectsOverview";
import { apiFetch } from "@/lib/api/http";

vi.mock("@/lib/api/http", () => ({
  apiFetch: vi.fn(),
}));

const projects = [
  { id: "p1", nombre: "Residencial Norte", estado: "ACTIVO" },
  { id: "p2", nombre: "Torre Sur", estado: "ENTREGADO" },
];

describe("ProjectsOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockImplementation((path: string) => {
      if (path === "/api/proyectos") return Promise.resolve(projects as never);
      if (path === "/api/expedientes?unpaginated=true") return Promise.resolve([] as never);
      if (path === "/api/activos/proyecto/p1?size=9999") return Promise.resolve({ content: [{ tipo: "DEPARTAMENTO" }] } as never);
      if (path === "/api/activos/proyecto/p2?size=9999") return Promise.resolve({ content: [] } as never);
      if (path === "/api/proyectos/p1/avance-general") return Promise.resolve({ porcentajeAvance: 72 } as never);
      if (path === "/api/proyectos/p2/avance-general") return Promise.resolve({ porcentajeAvance: 18 } as never);
      return Promise.resolve({} as never);
    });
  });

  it("renders without crashing", async () => {
    render(<ProjectsOverview />);
    expect(screen.getByText("Proyectos")).toBeDefined();
  });

  it("shows loading skeleton while fetching", () => {
    vi.mocked(apiFetch).mockImplementation(() => new Promise(() => {}));
    const { container } = render(<ProjectsOverview />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows error message when API fails", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("No se pudieron cargar los proyectos."));
    render(<ProjectsOverview />);
    expect(await screen.findByText("No se pudieron cargar los proyectos.")).toBeDefined();
  });

  it("shows correct data when API resolves successfully", async () => {
    render(<ProjectsOverview />);
    expect(await screen.findByText("Residencial Norte")).toBeDefined();
    expect(screen.getByText("Torre Sur")).toBeDefined();
  });

  it("filters projects by search input", async () => {
    render(<ProjectsOverview />);

    expect(await screen.findByText("Residencial Norte")).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText("Buscar proyecto…"), {
      target: { value: "Torre" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Residencial Norte")).toBeNull();
      expect(screen.getByText("Torre Sur")).toBeDefined();
    });
  });
});
