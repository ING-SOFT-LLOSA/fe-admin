import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AssignPropertyWizard from '@/modules/asignaciones/components/AssignPropertyWizard';

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
  mapUsuarioToClienteRow: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  crearContrato: vi.fn(),
  asignarActivo: vi.fn(),
}));

vi.mock("@/modules/inventario/services", () => ({
  fetchActivosPorProyecto: vi.fn(),
}));

vi.mock("@/modules/proyectos/services", () => ({
  fetchProyectos: vi.fn(),
}));

import { fetchUsuarios, mapUsuarioToClienteRow } from "@/lib/api/users";
import { crearContrato, asignarActivo } from "@/lib/api/expedientes";
import { fetchActivosPorProyecto } from "@/modules/inventario/services";
import { fetchProyectos } from "@/modules/proyectos/services";

const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockMapUsuarioToClienteRow = vi.mocked(mapUsuarioToClienteRow);
const mockCrearContrato = vi.mocked(crearContrato);
const mockAsignarActivo = vi.mocked(asignarActivo);
const mockFetchActivosPorProyecto = vi.mocked(fetchActivosPorProyecto);
const mockFetchProyectos = vi.mocked(fetchProyectos);

const sampleProject = { id: "proj-1", nombre: "Torre A" };
const sampleUnit = { id: "unit-1", nro: "101", tipo: "DEPARTAMENTO" };
const sampleClient = { id: 1, nombre: "Ana", apellidos: "García", email: "ana@test.com", tipoUsuario: "CLIENTE" as const, activo: true };
const sampleClienteRow = { id: 1, name: "Ana García", email: "ana@test.com", tipoUsuario: "CLIENTE" };

function renderWizard(props = {}) {
  return render(
    <AssignPropertyWizard onClose={vi.fn()} onSuccess={vi.fn()} {...props} />,
  );
}

describe("AssignPropertyWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProyectos.mockResolvedValue([sampleProject] as any);
    mockFetchUsuarios.mockResolvedValue([sampleClient] as any);
    mockMapUsuarioToClienteRow.mockImplementation((u: any) => ({
      id: u.id,
      name: `${u.nombre} ${u.apellidos}`,
      email: u.email,
      tipoUsuario: "CLIENTE",
      dni: u.documentoIdentidad || "—",
    }) as any);
    mockFetchActivosPorProyecto.mockResolvedValue({
      content: [sampleUnit],
      totalElements: 1,
    } as any);
    mockCrearContrato.mockResolvedValue({ uuidUsuarioActivo: "uuid-1" } as any);
    mockAsignarActivo.mockResolvedValue({} as any);
  });

  it("renders modal title and step indicator", async () => {
    renderWizard();
    expect(await screen.findByText("Asignar unidad")).toBeDefined();
    expect(screen.getByText(/Paso 1 de 3/)).toBeDefined();
  });

  it("renders close button and calls onClose", async () => {
    const onClose = vi.fn();
    renderWizard({ onClose });
    const closeBtn = await screen.findByText("close");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders Step 1: client search", async () => {
    renderWizard();
    expect(await screen.findByText("Seleccionar personas")).toBeDefined();
    expect(screen.getByPlaceholderText("Buscar por nombre, correo o documento...")).toBeDefined();
  });

  it("shows error if proceeding without selecting clients (step 1)", async () => {
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(screen.getByText("Siguiente"));
    expect(screen.getByText("Debes seleccionar al menos una persona para continuar.")).toBeDefined();
  });

  it("filters clients by search query", async () => {
    mockFetchUsuarios.mockResolvedValue([
      { ...sampleClient, id: 1, nombre: "Ana", apellidos: "García" },
      { ...sampleClient, id: 2, nombre: "Luis", apellidos: "Pérez" },
    ] as any);
    renderWizard();
    await screen.findByText("Ana García");
    expect(screen.getByText("Luis Pérez")).toBeDefined();
    const searchInput = screen.getByPlaceholderText("Buscar por nombre, correo o documento...");
    fireEvent.change(searchInput, { target: { value: "Luis" } });
    await waitFor(() => {
      expect(screen.queryByText("Ana García")).toBeNull();
    });
  });

  it("shows loading state while fetching clients", () => {
    mockFetchUsuarios.mockReturnValue(new Promise(() => {}));
    renderWizard();
    expect(screen.getByText("Cargando clientes...")).toBeDefined();
  });

  it("shows empty state when no clients found", async () => {
    mockFetchUsuarios.mockResolvedValue([]);
    renderWizard();
    expect(await screen.findByText("No se encontraron clientes activos.")).toBeDefined();
  });

  it("navigates to step 2 after selecting a client", async () => {
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    expect(screen.getByText("Proyecto")).toBeDefined();
  });

  it("step 2: loads units when project is selected", async () => {
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    await waitFor(() => {
      expect(mockFetchActivosPorProyecto).toHaveBeenCalled();
    });
    await screen.findByText("101");
  });

  it("step 2: shows loading while fetching units", async () => {
    mockFetchActivosPorProyecto.mockReturnValue(new Promise(() => {}));
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    expect(await screen.findByText("Cargando inventario...")).toBeDefined();
  });

  it("step 2: shows empty units state", async () => {
    mockFetchActivosPorProyecto.mockResolvedValue({ content: [], totalElements: 0 } as any);
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    expect(await screen.findByText("No hay unidades disponibles en este proyecto.")).toBeDefined();
  });

  it("reaches step 3 confirm with financing options", async () => {
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    await screen.findByText("101");
    fireEvent.click(screen.getByText("101"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Resumen de asignación");
    expect(screen.getByText("Crédito Hipotecario")).toBeDefined();
    expect(screen.getByText("Crédito Directo")).toBeDefined();
  });

  it("switches financing type between options", async () => {
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    await screen.findByText("101");
    fireEvent.click(screen.getByText("101"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Resumen de asignación");
    fireEvent.click(screen.getByText("Crédito Directo"));
    expect(screen.getByText("Crédito Directo")).toBeDefined();
  });

  it("creates contract and assigns on confirm", async () => {
    const onSuccess = vi.fn();
    renderWizard({ onSuccess });
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    await screen.findByText("101");
    fireEvent.click(screen.getByText("101"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Resumen de asignación");
    fireEvent.click(screen.getByText("Confirmar asignación"));
    await waitFor(() => {
      expect(mockCrearContrato).toHaveBeenCalled();
      expect(mockAsignarActivo).toHaveBeenCalled();
    });
  });

  it("shows error when create contract fails", async () => {
    mockCrearContrato.mockRejectedValue(new Error("Error en el contrato"));
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    await screen.findByText("101");
    fireEvent.click(screen.getByText("101"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Resumen de asignación");
    fireEvent.click(screen.getByText("Confirmar asignación"));
    expect(await screen.findByText("Error en el contrato")).toBeDefined();
  });

  it("shows success message after assignment", async () => {
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    const projectInput = screen.getByPlaceholderText("Buscar proyecto por nombre...");
    fireEvent.change(projectInput, { target: { value: "Torre" } });
    fireEvent.click(await screen.findByText("Torre A"));
    await screen.findByText("101");
    fireEvent.click(screen.getByText("101"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Resumen de asignación");
    fireEvent.click(screen.getByText("Confirmar asignación"));
    await waitFor(() => {
      expect(screen.getByText("Asignado")).toBeDefined();
    });
  });

  it("works with 2-step flow when client is pre-selected", async () => {
    renderWizard({ client: sampleClienteRow });
    await screen.findByText("Asignar unidad");
    expect(screen.getByText(/Paso 1 de 2/)).toBeDefined();
    expect(screen.getByText("Seleccionar proyecto y unidades")).toBeDefined();
  });

  it("Cancelar on step 1 calls onClose", async () => {
    const onClose = vi.fn();
    renderWizard({ onClose, client: sampleClienteRow });
    await screen.findByText("Seleccionar proyecto y unidades");
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("Volver from step 2 goes back to step 1", async () => {
    renderWizard();
    await screen.findByText("Seleccionar personas");
    fireEvent.click(await screen.findByText("Ana García"));
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByText("Seleccionar proyecto y unidades");
    fireEvent.click(screen.getByText("Volver"));
    expect(await screen.findByText("Seleccionar personas")).toBeDefined();
  });
});
