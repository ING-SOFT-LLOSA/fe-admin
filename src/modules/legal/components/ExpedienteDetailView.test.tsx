/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExpedienteDetailView from "./ExpedienteDetailView";

vi.mock("./hooks", () => ({
  useExpediente: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchCommercialStepper: vi.fn(),
  updateCommercialHitoEstado: vi.fn(),
  asignarAsesorAContrato: vi.fn(),
  desasignarAsesorDelContrato: vi.fn(),
}));

vi.mock("@/lib/api/requisitos", () => ({
  fetchStageDocuments: vi.fn(),
  uploadRequisitoArchivo: vi.fn(),
  deleteRequisitoArchivo: vi.fn(),
  updateRequisito: vi.fn(),
}));

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen, title, message, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <p>{title}</p>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirmar</button>
      </div>
    ) : null,
}));

import { useExpediente } from "./hooks";
import { fetchCommercialStepper, asignarAsesorAContrato, desasignarAsesorDelContrato } from "@/lib/api/expedientes";
import { fetchStageDocuments, uploadRequisitoArchivo, deleteRequisitoArchivo, updateRequisito } from "@/lib/api/requisitos";
import { fetchUsuarios } from "@/lib/api/users";

const mockFetchStepper = vi.mocked(fetchCommercialStepper);
const mockFetchStageDocs = vi.mocked(fetchStageDocuments);
const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockAsignarAsesor = vi.mocked(asignarAsesorAContrato);
const mockDesasignarAsesor = vi.mocked(desasignarAsesorDelContrato);

const mockUseExpediente = vi.mocked(useExpediente);

function makeStepper(): any {
  return {
    uuidUsuarioActivo: "ua-1",
    etapas: [
      { etapa: "SEPARACION", porcentajeAvance: 100, hitos: [{ uuidHitoComercial: "h-1", uuidEtapaExpediente: "ee-1", etapaProceso: "SEPARACION", nombreHito: "Proforma", descripcion: "", orden: 1, estado: "COMPLETADO", fechaCompletado: "2026-03-01", createdAt: "2026-01-01" }] },
      { etapa: "CONTRATO", porcentajeAvance: 0, hitos: [{ uuidHitoComercial: "h-2", uuidEtapaExpediente: "ee-2", etapaProceso: "CONTRATO", nombreHito: "Firma", descripcion: "", orden: 1, estado: "PENDIENTE", fechaCompletado: null, createdAt: "2026-01-01" }] },
      { etapa: "PAGO", porcentajeAvance: 0, hitos: [] },
      { etapa: "ENTREGA", porcentajeAvance: 0, hitos: [] },
      { etapa: "SANEAMIENTO", porcentajeAvance: 0, hitos: [] },
    ],
  };
}

function makeBaseExpediente(overrides: Record<string, any> = {}) {
  return {
    uuidUsuarioActivo: "ua-1",
    clientes: [{ id: 1, nombre: "Juan", apellidos: "Pérez", email: "juan@test.com", telefono: "999999", documentoIdentidad: "12345678" }],
    activos: [{ id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPARTAMENTO", nro: "301" }],
    tipoFinanciamiento: "CREDITO_DIRECTO",
    vigente: true,
    asesor: null,
    fechaAdquisicion: "2026-01-15T00:00:00",
    ...overrides,
  };
}

function mockLoaded(overrides: Record<string, any> = {}) {
  const expediente = makeBaseExpediente(overrides.asesor ? { asesor: overrides.asesor } : {});
  mockUseExpediente.mockReturnValue({
    expediente,
    stages: [
      { etapaProceso: "SEPARACION", estado: "COMPLETADO", totalHitos: 1, hitosCompletados: 1 },
      { etapaProceso: "CONTRATO", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
      { etapaProceso: "PAGO", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
      { etapaProceso: "ENTREGA", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
      { etapaProceso: "SANEAMIENTO", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
    ],
    loading: false,
    error: "",
    setExpediente: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockFetchStepper.mockResolvedValue(makeStepper());
  mockFetchUsuarios.mockResolvedValue([
    { id: 1, nombre: "Carlos", apellidos: "García", email: "carlos@test.com", rol: "ASESOR" },
  ] as any);
  mockFetchStageDocs.mockResolvedValue({ title: "Test", totalCount: 0, documents: [] });
});

describe("ExpedienteDetailView", () => {
  it("muestra loading spinner mientras carga", () => {
    mockLoaded({ loading: true });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(screen.getByText("Cargando expediente...")).toBeDefined();
  });

  it("muestra mensaje de error si falla la carga", () => {
    mockLoaded({ loading: false, error: "Expediente no encontrado", expediente: null });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(screen.getByText("Expediente no encontrado")).toBeDefined();
  });

  it("muestra tabs de navegación cuando carga exitosamente", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Resumen")).toBeDefined();
    expect(screen.getByText("Proceso legal")).toBeDefined();
    expect(screen.getByText("Documentos")).toBeDefined();
  });

  it("muestra breadcrumb con link de vuelta", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Volver a Gestión Legal")).toBeDefined();
  });

  it("muestra badge de Vigente", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Vigente")).toBeDefined();
  });

  it("muestra badge de Desvinculado cuando vigente es false", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ vigente: false }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Desvinculado")).toBeDefined();
  });

  it("muestra badge de financiamiento Crédito Directo", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Crédito Directo")).toBeDefined();
  });

  it("formatea financiamiento CREDITO_HIPOTECARIO", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ tipoFinanciamiento: "CREDITO_HIPOTECARIO" }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Crédito Hipotecario")).toBeDefined();
  });

  it("context band: muestra sección Titulares", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Titulares")).toBeDefined();
  });

  it("context band: muestra titulares vinculados", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Juan Pérez")).toBeDefined();
  });

  it("context band: muestra 'No hay titulares vinculados' cuando no hay clientes", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ clientes: [] }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("No hay titulares vinculados.")).toBeDefined();
  });

  it("context band: muestra sección Unidades Vinculadas", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Unidades Vinculadas")).toBeDefined();
  });

  it("context band: muestra 'No hay unidades vinculadas' cuando no hay activos", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ activos: [] }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("No hay unidades vinculadas.")).toBeDefined();
  });

  it("context band: muestra asesor y botón desvincular", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ asesor: { id: 1, nombre: "Carlos", apellidos: "García", email: "carlos@test.com" } }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Carlos García")).toBeDefined();
    expect(screen.getByText("Desvincular")).toBeDefined();
  });

  it("context band: muestra botón asignar asesor cuando no hay asesor", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Asignar asesor")).toBeDefined();
  });

  it("context band: abre modal de asignar asesor y muestra opciones", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const assignButtons = await screen.findAllByText("Asignar asesor");
    fireEvent.click(assignButtons[0]);
    expect(await screen.findByText("Carlos García")).toBeDefined();
  });

  it("context band: desvincula asesor", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ asesor: { id: 1, nombre: "Carlos", apellidos: "García", email: "carlos@test.com" } }) });
    mockDesasignarAsesor.mockResolvedValue({} as any);
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Desvincular"));
    await waitFor(() => {
      expect(mockDesasignarAsesor).toHaveBeenCalledWith("ua-1", 1);
    });
  });

  it("context band: muestra 'No hay asesores disponibles' si no hay asesores", async () => {
    mockFetchUsuarios.mockResolvedValue([]);
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Asignar asesor"));
    expect(await screen.findByText("No hay asesores disponibles.")).toBeDefined();
  });

  it("context band: cierra modal al hacer clic en Cancelar", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const assignButtons = await screen.findAllByText("Asignar asesor");
    fireEvent.click(assignButtons[0]);
    await screen.findByText("Carlos García");
    const cancelBtn = screen.getAllByText("Cancelar")[0];
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByText("Carlos García")).toBeNull();
    });
  });

  it("cambia al tab Proceso legal y muestra contenido", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);

    fireEvent.click(await screen.findByText("Proceso legal"));

    const stepperData = makeStepper();
    mockFetchStepper.mockResolvedValue(stepperData);

    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
  });

  it("cambia al tab Documentos", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    expect(await screen.findByText("Todos")).toBeDefined();
  });

  it("etapas resumen: muestra hitos completados y totales", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Hitos completados")).toBeDefined();
    expect(screen.getByText("Hitos totales")).toBeDefined();
  });

  it("proceso legal: muestra accordion con etapas cuando stepper carga", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));

    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    expect(screen.getByText("Contrato")).toBeDefined();
  });

  it("documentos tab: muestra filtros de etapa", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));

    expect(await screen.findByText("Todos")).toBeDefined();
    expect(screen.getByText("Separación")).toBeDefined();
    expect(screen.getByText("Contrato")).toBeDefined();
  });

  it("expediente con ESTACIONAMIENTO muestra Cochera", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ activos: [{ id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "ESTACIONAMIENTO", nro: "5" }] }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/Cochera/)).toBeDefined();
  });

  it("expediente con DEPOSITO muestra Depósito", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ activos: [{ id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPOSITO", nro: "1" }] }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/Depósito/)).toBeDefined();
  });

  it("muestra EMP- en el header", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/EXP-/)).toBeDefined();
  });

  it("etapas resumen: muestra Avance de Etapas del Expediente", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Avance de Etapas del Expediente")).toBeDefined();
  });
});
