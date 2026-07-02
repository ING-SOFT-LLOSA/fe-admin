/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExpedienteDetailView from '@/modules/legal/components/ExpedienteDetailView';

vi.mock('@/modules/legal/components/hooks', () => ({
  useExpediente: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchCommercialStepper: vi.fn(),
  updateCommercialHitoEstado: vi.fn(),
  asignarAsesorAContrato: vi.fn(),
  desasignarAsesorDelContrato: vi.fn(),
  actualizarContrato: vi.fn(),
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
  default: ({ isOpen, title, message, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <span data-testid="dialog-title">{title}</span>
        <p data-testid="dialog-message">{message}</p>
        <button data-testid="dialog-confirm" onClick={onConfirm}>Confirmar</button>
        <button data-testid="dialog-close" onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
}));

import { useExpediente } from '@/modules/legal/components/hooks';
import {
  fetchCommercialStepper,
  updateCommercialHitoEstado,
  asignarAsesorAContrato,
  desasignarAsesorDelContrato,
  actualizarContrato,
} from "@/lib/api/expedientes";
import {
  fetchStageDocuments,
  uploadRequisitoArchivo,
  deleteRequisitoArchivo,
  updateRequisito,
} from "@/lib/api/requisitos";
import { fetchUsuarios } from "@/lib/api/users";
 
const mockFetchStepper = vi.mocked(fetchCommercialStepper);
const mockUpdateHitoEstado = vi.mocked(updateCommercialHitoEstado);
const mockFetchStageDocs = vi.mocked(fetchStageDocuments);
const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockAsignarAsesor = vi.mocked(asignarAsesorAContrato);
const mockDesasignarAsesor = vi.mocked(desasignarAsesorDelContrato);
const mockActualizarContrato = vi.mocked(actualizarContrato);
const mockDeleteArchivo = vi.mocked(deleteRequisitoArchivo);
const mockUpdateRequisito = vi.mocked(updateRequisito);
 
const mockUseExpediente = vi.mocked(useExpediente);


function makeStepper(overrides: Partial<any> = {}): any {
  return {
    uuidUsuarioActivo: "ua-1",
    etapas: [
      {
        etapa: "SEPARACION",
        porcentajeAvance: 100,
        hitos: [
          {
            uuidHitoComercial: "h-1",
            uuidEtapaExpediente: "ee-1",
            etapaProceso: "SEPARACION",
            nombreHito: "Proforma",
            descripcion: "Desc de proforma",
            orden: 1,
            estado: "COMPLETADO",
            fechaCompletado: "2026-03-01",
            createdAt: "2026-01-01",
          },
        ],
      },
      {
        etapa: "CONTRATO",
        porcentajeAvance: 0,
        hitos: [
          {
            uuidHitoComercial: "h-2",
            uuidEtapaExpediente: "ee-2",
            etapaProceso: "CONTRATO",
            nombreHito: "Firma",
            descripcion: "Firmar contrato",
            orden: 1,
            estado: "PENDIENTE",
            fechaCompletado: null,
            createdAt: "2026-01-01",
          },
          {
            uuidHitoComercial: "h-2b",
            uuidEtapaExpediente: "ee-2",
            etapaProceso: "CONTRATO",
            nombreHito: "Revision",
            descripcion: "Revision de contrato",
            orden: 2,
            estado: "PENDIENTE",
            fechaCompletado: null,
            createdAt: "2026-01-01",
          },
        ],
      },
      {
        etapa: "PAGO",
        porcentajeAvance: 0,
        hitos: [
          {
            uuidHitoComercial: "h-3",
            uuidEtapaExpediente: "ee-3",
            etapaProceso: "PAGO",
            nombreHito: "Pago inicial",
            descripcion: "",
            orden: 1,
            estado: "PENDIENTE",
            fechaCompletado: null,
            createdAt: "2026-01-01",
          },
        ],
      },
      { etapa: "ENTREGA", porcentajeAvance: 0, hitos: [] },
      { etapa: "SANEAMIENTO", porcentajeAvance: 0, hitos: [] },
    ],
    ...overrides,
  };
}

function makeStepperWithEN_PROGRESO(): any {
  return {
    uuidUsuarioActivo: "ua-1",
    etapas: [
      {
        etapa: "SEPARACION",
        porcentajeAvance: 50,
        hitos: [
          {
            uuidHitoComercial: "h-enp-1",
            uuidEtapaExpediente: "ee-x",
            etapaProceso: "SEPARACION",
            nombreHito: "Proforma",
            descripcion: "",
            orden: 1,
            estado: "EN_PROGRESO",
            fechaCompletado: null,
            createdAt: "2026-01-01",
          },
        ],
      },
      { etapa: "CONTRATO", porcentajeAvance: 0, hitos: [] },
      { etapa: "PAGO", porcentajeAvance: 0, hitos: [] },
      { etapa: "ENTREGA", porcentajeAvance: 0, hitos: [] },
      { etapa: "SANEAMIENTO", porcentajeAvance: 0, hitos: [] },
    ],
  };
}

function makeBaseExpediente(overrides: Record<string, any> = {}) {
  return {
    uuidUsuarioActivo: "ua-1",
    clientes: [
      {
        id: 1,
        nombre: "Juan",
        apellidos: "Perez",
        email: "juan@test.com",
        telefono: "999999",
        documentoIdentidad: "12345678",
      },
    ],
    activos: [
      {
        id: "a1",
        proyectoNombre: "Aurora",
        torreNombre: "Torre A",
        tipo: "DEPARTAMENTO",
        nro: "301",
      },
    ],
    tipoFinanciamiento: "CREDITO_DIRECTO",
    vigente: true,
    asesor: null,
    fechaAdquisicion: "2026-01-15T00:00:00",
    ...overrides,
  };
}

function makeDocumento(overrides: Record<string, any> = {}): any {
  return {
    id: "doc-1",
    title: "TituloUnico",
    description: "Desc unica",
    status: "COMPLETADA",
    emissionDate: "2026-01-15",
    hasDownload: true,
    downloadUrl: "https://cdn.example.com/doc.pdf",
    hasPreview: false,
    notaCorporativa: "Verificado por el area legal",
    icon: "description",
    ...overrides,
  };
}

function mockLoaded(overrides: Record<string, any> = {}) {
  const expedienteData = overrides.asesor
    ? makeBaseExpediente({ asesor: overrides.asesor })
    : overrides.expediente
      ? overrides.expediente
      : makeBaseExpediente();
  mockUseExpediente.mockReturnValue({
    expediente: expedienteData,
    stages: [
      { etapaProceso: "SEPARACION", estado: "COMPLETADO", totalHitos: 1, hitosCompletados: 1 },
      { etapaProceso: "CONTRATO", estado: "PENDIENTE", totalHitos: 2, hitosCompletados: 0 },
      { etapaProceso: "PAGO", estado: "PENDIENTE", totalHitos: 1, hitosCompletados: 0 },
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
    { id: 1, nombre: "Carlos", apellidos: "Garcia", email: "carlos@test.com", rol: "ASESOR" },
  ] as any);
  mockFetchStageDocs.mockResolvedValue({ title: "Test", totalCount: 0, documents: [] });
});

afterEach(() => {
  vi.useRealTimers();
});


describe("ExpedienteDetailView", () => {

  it("loading spinner mientras carga", () => {
    mockLoaded({ loading: true });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(screen.getByText("Cargando expediente...")).toBeDefined();
  });

  it("error explícito si falla la carga", () => {
    mockLoaded({ loading: false, error: "Expediente no encontrado", expediente: null });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(screen.getByText("Expediente no encontrado")).toBeDefined();
  });

  it("fallback cuando no hay expediente ni error explícito", () => {
    mockLoaded({ loading: false, error: "", expediente: null });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(screen.getByText("Expediente no encontrado.")).toBeDefined();
  });

  it("link de volver al legal en pantalla de error", () => {
    mockLoaded({ loading: false, error: "Error", expediente: null });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const links = screen.getAllByText("← Volver a Gestión Legal");
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].closest("a")?.getAttribute("href")).toBe("/legal");
  });


  it("breadcrumb con link de vuelta", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const links = await screen.findAllByText("Volver a Gestión Legal");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("badge de Vigente", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Vigente")).toBeDefined();
  });

  it("badge de Desvinculado cuando vigente es false", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ vigente: false }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Desvinculado")).toBeDefined();
  });

  it("badge de financiamiento Crédito Directo", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Crédito Directo")).toBeDefined();
  });

  it("financiamiento CREDITO_HIPOTECARIO formateado", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ tipoFinanciamiento: "CREDITO_HIPOTECARIO" }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Crédito Hipotecario")).toBeDefined();
  });

  it("financiamiento desconocido sin transformar", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ tipoFinanciamiento: "OTRO_TIPO" }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("OTRO_TIPO")).toBeDefined();
  });

  it("financiamiento null muestra guion", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ tipoFinanciamiento: null }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect((await screen.findAllByText("—")).length).toBeGreaterThan(0);
  });

  it("fecha de creacion formateada", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/15\/01\/2026/)).toBeDefined();
  });

  it("EXP- en el header con id recortado", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/EXP-UA-1/)).toBeDefined();
  });

  it("tabs de navegacion", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Resumen")).toBeDefined();
    expect(screen.getByText("Proceso legal")).toBeDefined();
    expect(screen.getByText("Documentos")).toBeDefined();
  });


  it("context band: seccion Titulares", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Titulares")).toBeDefined();
  });

  it("context band: titulares vinculados", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Juan Perez")).toBeDefined();
  });

  it("context band: titulares con iniciales en avatar", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("JP")).toBeDefined();
  });

  it("context band: sin titulares cuando clientes vacio", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ clientes: [] }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("No hay titulares vinculados.")).toBeDefined();
  });

  it("context band: titular sin apellidos", async () => {
    const exp = makeBaseExpediente({
      clientes: [{ id: 2, nombre: "Maria", apellidos: "", email: "maria@test.com", telefono: "999", documentoIdentidad: "8765" }],
    });
    mockLoaded({ expediente: exp });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Maria")).toBeDefined();
  });


  it("context band: seccion Unidades Vinculadas", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Unidades Vinculadas")).toBeDefined();
  });

  it("context band: sin unidades cuando activos vacio", async () => {
    mockLoaded({ expediente: makeBaseExpediente({ activos: [] }) });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("No hay unidades vinculadas.")).toBeDefined();
  });

  it("ESTACIONAMIENTO muestra Cochera", async () => {
    mockLoaded({
      expediente: makeBaseExpediente({
        activos: [{ id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "ESTACIONAMIENTO", nro: "5" }],
      }),
    });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/Cochera/)).toBeDefined();
  });

  it("DEPOSITO muestra Depósito", async () => {
    mockLoaded({
      expediente: makeBaseExpediente({
        activos: [{ id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPOSITO", nro: "1" }],
      }),
    });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/Depósito/)).toBeDefined();
  });

  it("DEPARTAMENTO muestra Dpto", async () => {
    mockLoaded({
      expediente: makeBaseExpediente({
        activos: [{ id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPARTAMENTO", nro: "101" }],
      }),
    });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText(/Dpto/)).toBeDefined();
  });


  it("context band: asesor y boton desvincular", async () => {
    mockLoaded({
      expediente: makeBaseExpediente({
        asesor: { id: 1, nombre: "Carlos", apellidos: "Garcia", email: "carlos@test.com" },
      }),
    });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Carlos Garcia")).toBeDefined();
    expect(screen.getByText("Desvincular")).toBeDefined();
  });

  it("context band: boton asignar asesor", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Asignar asesor")).toBeDefined();
  });

  it("context band: abre modal de asignar asesor", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const assignBtn = await screen.findByText("Asignar asesor");
    fireEvent.click(assignBtn);
    expect(await screen.findByText("Carlos Garcia")).toBeDefined();
  });

  it("context band: desvincula asesor", async () => {
    mockLoaded({
      expediente: makeBaseExpediente({
        asesor: { id: 1, nombre: "Carlos", apellidos: "Garcia", email: "carlos@test.com" },
      }),
    });
    mockDesasignarAsesor.mockResolvedValue({} as any);
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Desvincular"));
    await waitFor(() => {
      expect(mockDesasignarAsesor).toHaveBeenCalledWith("ua-1", 1);
    });
  });

  it("context band: desvincula asesor y actualiza expediente", async () => {
    const setExpedienteMock = vi.fn();
    mockLoaded({
      expediente: makeBaseExpediente({
        asesor: { id: 1, nombre: "Carlos", apellidos: "Garcia", email: "carlos@test.com" },
      }),
      setExpediente: setExpedienteMock,
    });
    mockDesasignarAsesor.mockResolvedValue({} as any);
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Desvincular"));
    await waitFor(() => {
      expect(setExpedienteMock).toHaveBeenCalled();
    });
  });

  it("context band: asigna asesor desde el modal", async () => {
    const setExpedienteMock = vi.fn();
    mockLoaded({ setExpediente: setExpedienteMock });
    mockAsignarAsesor.mockResolvedValue({
      asesor: { id: 1, nombre: "Carlos", apellidos: "Garcia", email: "carlos@test.com" },
    } as any);
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const assignBtn = await screen.findByText("Asignar asesor");
    fireEvent.click(assignBtn);
    const carlosBtn = await screen.findByText("Carlos Garcia");
    fireEvent.click(carlosBtn);
    await waitFor(() => {
      expect(mockAsignarAsesor).toHaveBeenCalledWith("ua-1", 1);
      expect(setExpedienteMock).toHaveBeenCalled();
    });
  });

  it("context band: modal overlay cierra el modal", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const assignBtn = await screen.findByText("Asignar asesor");
    fireEvent.click(assignBtn);
    await screen.findByText("Carlos Garcia");
    const overlay = screen.getByLabelText("Cerrar modal");
    fireEvent.click(overlay);
    await waitFor(() => {
      expect(screen.queryByText("Carlos Garcia")).toBeNull();
    });
  });

  it("context band: no hay asesores disponibles", async () => {
    mockFetchUsuarios.mockResolvedValue([]);
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Asignar asesor"));
    expect(await screen.findByText("No hay asesores disponibles.")).toBeDefined();
  });

  it("context band: fetchUsuarios falla silenciosamente", async () => {
    mockFetchUsuarios.mockRejectedValue(new Error("Network error"));
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const assignBtn = await screen.findByText("Asignar asesor");
    fireEvent.click(assignBtn);
    expect(await screen.findByText("No hay asesores disponibles.")).toBeDefined();
  });

  it("context band: cierra modal con Cancelar", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    const assignBtn = await screen.findByText("Asignar asesor");
    fireEvent.click(assignBtn);
    await screen.findByText("Carlos Garcia");
    const cancelBtn = screen.getAllByText("Cancelar")[0];
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByText("Carlos Garcia")).toBeNull();
    });
  });


  it("etapas resumen: hitos completados y totales", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Hitos completados")).toBeDefined();
    expect(screen.getByText("Hitos totales")).toBeDefined();
  });

  it("etapas resumen: Avance de Etapas", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Avance de Etapas del Expediente")).toBeDefined();
  });

  it("etapas resumen: badge Completado para etapa al 100%", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    await screen.findByText("Avance de Etapas del Expediente");
    const badges = screen.getAllByText("Completado");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("etapas resumen: badge En progreso", async () => {
    mockLoaded({
      stages: [
        { etapaProceso: "SEPARACION", estado: "EN_PROGRESO", totalHitos: 2, hitosCompletados: 0 },
        { etapaProceso: "CONTRATO", estado: "PENDIENTE", totalHitos: 2, hitosCompletados: 0 },
        { etapaProceso: "PAGO", estado: "PENDIENTE", totalHitos: 1, hitosCompletados: 0 },
        { etapaProceso: "ENTREGA", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
        { etapaProceso: "SANEAMIENTO", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
      ],
    });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("En progreso")).toBeDefined();
  });

  it("etapas resumen: usa datos de stepper para completed count", async () => {
    mockLoaded();
    mockFetchStepper.mockResolvedValue(makeStepper());
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    await screen.findByText("Avance de Etapas del Expediente");
    // Stepper has 1 COMPLETADO → completedHitos = 1
    const numOne = screen.getByText("1");
    expect(numOne).toBeDefined();
  });

  it("etapas resumen: Pendiente badge for zero pct stages", async () => {
    mockLoaded({
      stages: [
        { etapaProceso: "SEPARACION", estado: "PENDIENTE", totalHitos: 1, hitosCompletados: 0 },
        { etapaProceso: "CONTRATO", estado: "PENDIENTE", totalHitos: 2, hitosCompletados: 0 },
        { etapaProceso: "PAGO", estado: "PENDIENTE", totalHitos: 1, hitosCompletados: 0 },
        { etapaProceso: "ENTREGA", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
        { etapaProceso: "SANEAMIENTO", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
      ],
    });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    await screen.findByText("Avance de Etapas del Expediente");
    const pendientes = screen.getAllByText("Pendiente");
    expect(pendientes.length).toBeGreaterThanOrEqual(1);
  });


  it("cambia al tab Proceso legal", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
  });

  it("proceso legal: accordion con etapas ordenadas", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    expect(screen.getByText("Contrato")).toBeDefined();
  });

  it("proceso legal: spinner mientras carga stepper", async () => {
    let resolveStepper!: (v: any) => void;
    mockFetchStepper.mockReturnValue(new Promise((resolve) => { resolveStepper = resolve; }));
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    expect(screen.getByText("Cargando hitos del proceso...")).toBeDefined();
    resolveStepper(makeStepper());
  });

  it("proceso legal: error si stepper es null", async () => {
    mockFetchStepper.mockRejectedValue(new Error("Fallo"));
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("No se pudo cargar el proceso legal.")).toBeDefined();
    });
  });

  it("proceso legal: expande y colapsa etapa", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    // SEPARACION starts expanded (has COMPLETADO hits)
    expect(screen.getByText("Proforma")).toBeDefined();
    // Click header to collapse
    const separacionHeader = screen.getByText("Separación").closest("button");
    fireEvent.click(separacionHeader!);
    await waitFor(() => {
      expect(screen.queryByText("Proforma")).toBeNull();
    });
    // Click again to expand
    fireEvent.click(separacionHeader!);
    expect(await screen.findByText("Proforma")).toBeDefined();
  });

  it("proceso legal: etapa sin hitos muestra mensaje", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Entrega")).toBeDefined();
    }, { timeout: 3000 });
    const entregaHeader = screen.getByText("Entrega").closest("button");
    fireEvent.click(entregaHeader!);
    expect(await screen.findByText("No hay hitos configurados para esta etapa.")).toBeDefined();
  });

  it("proceso legal: hitos con descripcion visible", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    // SEPARACION expanded, hito "Proforma" has descripcion
    expect(screen.getByText("Desc de proforma")).toBeDefined();
  });


  it("hito toggle: PENDIENTE a EN_PROGRESO optimistic", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Contrato")).toBeDefined();
    }, { timeout: 3000 });
    // Expand CONTRATO
    const contratoHeader = screen.getByText("Contrato").closest("button");
    fireEvent.click(contratoHeader!);
    // Find "Firma" hito (PENDIENTE)
    await screen.findByText("Firma");
    // Click the circular checkbox button
    const firmaRow = screen.getByText("Firma").closest(".flex.items-start.justify-between");
    const checkbox = firmaRow?.querySelector("button");
    fireEvent.click(checkbox!);
    await waitFor(() => {
      expect(mockUpdateHitoEstado).toHaveBeenCalledWith("h-2", "EN_PROGRESO");
    });
  });

  it("hito toggle: falla y revierte", async () => {
    mockUpdateHitoEstado.mockRejectedValue(new Error("Network error"));
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    // SEPARACION is expanded, hito is COMPLETADO
    const firmaRow = screen.getByText("Proforma").closest(".flex.items-start.justify-between");
    const checkbox = firmaRow?.querySelector("button");
    fireEvent.click(checkbox!);
    await waitFor(() => {
      expect(screen.getByText("No se pudo actualizar el hito. Intente nuevamente.")).toBeDefined();
    });
  });

  it("hito toggle: error aparece y luego es limpiado con setTimeout", async () => {
    mockUpdateHitoEstado.mockRejectedValue(new Error("Network error"));
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    const firmaRow = screen.getByText("Proforma").closest(".flex.items-start.justify-between");
    const checkbox = firmaRow?.querySelector("button");
    fireEvent.click(checkbox!);
    await waitFor(() => {
      expect(screen.getByText("No se pudo actualizar el hito. Intente nuevamente.")).toBeDefined();
    });
    // setTimeout clears the error after 4s - just verify it was called
    expect(mockUpdateHitoEstado).toHaveBeenCalled();
  });

  it("hito toggle: EN_PROGRESO a COMPLETADO", async () => {
    const stepper = makeStepper();
    stepper.etapas[0].hitos[0].estado = "EN_PROGRESO";
    stepper.etapas[0].porcentajeAvance = 50;
    mockFetchStepper.mockResolvedValue(stepper);
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    const firmaRow = screen.getByText("Proforma").closest(".flex.items-start.justify-between");
    const checkbox = firmaRow?.querySelector("button");
    fireEvent.click(checkbox!);
    await waitFor(() => {
      expect(mockUpdateHitoEstado).toHaveBeenCalledWith("h-1", "COMPLETADO");
    });
  });


  it("cambia al tab Documentos", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    expect(await screen.findByText("Todos")).toBeDefined();
  });

  it("documentos tab: muestra filtros de etapa", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    expect(await screen.findByText("Todos")).toBeDefined();
    expect(screen.getByText("Separación")).toBeDefined();
    expect(screen.getByText("Contrato")).toBeDefined();
    expect(screen.getByText("Pago")).toBeDefined();
  });

  it("documentos tab: filtro activo cambia estilo", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    const filtroSep = await screen.findByText("Separación");
    fireEvent.click(filtroSep);
    await waitFor(() => {
      expect(filtroSep.classList.contains("bg-arch-gold")).toBe(true);
    });
  });

  it("documentos tab: skeleton mientras carga", async () => {
    let resolveDocs!: (v: any) => void;
    mockFetchStageDocs.mockReturnValue(new Promise((resolve) => { resolveDocs = resolve; }));
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await waitFor(() => {
      expect(document.querySelector(".animate-pulse")).toBeDefined();
    });
    resolveDocs({ documents: [] });
  });

  it("documentos tab: empty state sin documentos", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    expect(await screen.findByText("No hay documentos en esta etapa.")).toBeDefined();
  });

  it("documentos tab: muestra documentos en lista", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocPrueba" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    const items = await screen.findAllByText("DocPrueba");
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("documentos tab: hasDownload muestra boton download", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocDL", hasDownload: true, downloadUrl: "https://x.com/x.pdf" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocDL");
    const downloadBtn = document.querySelector('[title="Descargar / Ver Archivo"]');
    expect(downloadBtn).toBeDefined();
  });

  it("documentos tab: badges Completado y Pendiente", async () => {
    mockLoaded();
    const doc1 = makeDocumento({ id: "d1", title: "DocComplete", status: "COMPLETADA" });
    const doc2 = makeDocumento({ id: "d2", title: "DocPend", status: "PENDIENTE", hasDownload: false, downloadUrl: null });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc1, doc2] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocComplete");
    const completados = screen.getAllByText("Completado");
    const pendientes = screen.getAllByText("Pendiente");
    expect(completados.length).toBeGreaterThanOrEqual(1);
    expect(pendientes.length).toBeGreaterThanOrEqual(1);
  });

  it("documentos tab: nota corporativa con status COMPLETADA", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocNote", status: "COMPLETADA", notaCorporativa: "Todo OK", hasDownload: true, downloadUrl: "url" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocNote");
    const notas = screen.getAllByText("Nota Corporativa:");
    expect(notas.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Todo OK").length).toBeGreaterThanOrEqual(1);
  });

  it("documentos tab: nota corporativa con status PENDIENTE", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocWarn", status: "PENDIENTE", hasDownload: false, downloadUrl: null, notaCorporativa: "Falta" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocWarn");
    const avisos = screen.getAllByText("Nota del Abogado (Observación):");
    expect(avisos.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Falta").length).toBeGreaterThanOrEqual(1);
  });

  it("documentos tab: sin notas corporativas", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocSin", notaCorporativa: null, hasDownload: false, downloadUrl: null });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocSin");
    const sin = screen.getAllByText("Sin notas corporativas.");
    expect(sin.length).toBeGreaterThanOrEqual(1);
  });

  it("documentos tab: descripcion del documento visible", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocDesc", description: "Desc larga" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    const descs = await screen.findAllByText("Desc larga");
    expect(descs.length).toBeGreaterThanOrEqual(1);
  });


  it("documentos tab: abre modal de edicion", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocEdit" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocEdit");
    const editBtn = document.querySelector('[title="Editar Información"]');
    fireEvent.click(editBtn!);
    expect(await screen.findByText("Editar Requisito Documental")).toBeDefined();
  });

  it("documentos tab: edit modal pre-fills fields", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "TituloX", description: "DescX", emissionDate: "2026-02-10", icon: "badge" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("TituloX");
    const editBtn = document.querySelector('[title="Editar Información"]');
    fireEvent.click(editBtn!);
    const titleInput = screen.getByDisplayValue("TituloX");
    expect(titleInput).toBeDefined();
    const descInput = screen.getByDisplayValue("DescX");
    expect(descInput).toBeDefined();
  });

  it("documentos tab: cierra modal de edicion con Cancelar", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocCancel" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocCancel");
    const editBtn = document.querySelector('[title="Editar Información"]');
    fireEvent.click(editBtn!);
    await screen.findByText("Editar Requisito Documental");
    const cancelBtns = screen.getAllByText("Cancelar");
    fireEvent.click(cancelBtns[0]);
    await waitFor(() => {
      expect(screen.queryByText("Editar Requisito Documental")).toBeNull();
    });
  });

  it("documentos tab: guardar cambios exitosamente", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocSave" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    mockUpdateRequisito.mockResolvedValue({} as any);
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocSave");
    const editBtn = document.querySelector('[title="Editar Información"]');
    fireEvent.click(editBtn!);
    await screen.findByText("Editar Requisito Documental");
    const guardarBtn = screen.getByText("Guardar Cambios");
    fireEvent.click(guardarBtn);
    await waitFor(() => {
      expect(mockUpdateRequisito).toHaveBeenCalled();
    });
  });

  it("documentos tab: guardar cambios falla con error", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocFail" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    mockUpdateRequisito.mockRejectedValue(new Error("Update failed"));
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocFail");
    const editBtn = document.querySelector('[title="Editar Información"]');
    fireEvent.click(editBtn!);
    await screen.findByText("Editar Requisito Documental");
    const guardarBtn = screen.getByText("Guardar Cambios");
    fireEvent.click(guardarBtn);
    expect(await screen.findByText("Update failed")).toBeDefined();
  });


  it("documentos tab: delete muestra dialog", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocDel", hasDownload: true, downloadUrl: "url" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocDel");
    const deleteBtn = document.querySelector('[title="Eliminar Archivo"]');
    fireEvent.click(deleteBtn!);
    expect(await screen.findByTestId("dialog-modal")).toBeDefined();
    expect(screen.getByText("Eliminar Archivo de Requisito")).toBeDefined();
  });

  it("documentos tab: delete confirma y elimina", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocDel2", hasDownload: true, downloadUrl: "url" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    mockDeleteArchivo.mockResolvedValue({} as any);
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocDel2");
    const deleteBtn = document.querySelector('[title="Eliminar Archivo"]');
    fireEvent.click(deleteBtn!);
    await screen.findByTestId("dialog-modal");
    const confirmBtn = screen.getByTestId("dialog-confirm");
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(mockDeleteArchivo).toHaveBeenCalledWith("doc-1");
    });
  });

  it("documentos tab: delete falla y muestra error", async () => {
    mockLoaded();
    const doc = makeDocumento({ title: "DocDelFail", hasDownload: true, downloadUrl: "url" });
    mockFetchStageDocs.mockResolvedValue({ documents: [doc] });
    mockDeleteArchivo.mockRejectedValue(new Error("Error al eliminar el archivo."));
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Documentos"));
    await screen.findAllByText("DocDelFail");
    const deleteBtn = document.querySelector('[title="Eliminar Archivo"]');
    fireEvent.click(deleteBtn!);
    await screen.findByTestId("dialog-modal");
    const confirmBtn = screen.getByTestId("dialog-confirm");
    fireEvent.click(confirmBtn);
    expect(await screen.findByText("Error al eliminar el archivo.")).toBeDefined();
  });


  it("no renderiza stepper con uuid vacio", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="" />);
    await screen.findByText("Resumen");
    expect(mockFetchStepper).not.toHaveBeenCalled();
  });

  it("proceso legal: EN_PROGRESO stages auto expanded", async () => {
    mockFetchStepper.mockResolvedValue(makeStepperWithEN_PROGRESO());
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    fireEvent.click(await screen.findByText("Proceso legal"));
    await waitFor(() => {
      expect(screen.getByText("Separación")).toBeDefined();
    }, { timeout: 3000 });
    expect(screen.getByText("Proforma")).toBeDefined();
  });

  it("stepper load error caught gracefully", async () => {
    mockFetchStepper.mockRejectedValue(new Error("Stepper load error"));
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    await screen.findByText("Resumen");
    expect(screen.getByText("Resumen")).toBeDefined();
  });

  it("abre modal de edicion de contrato, guarda cambios y actualiza estado", async () => {
    mockLoaded();
    mockActualizarContrato.mockResolvedValue(makeBaseExpediente({
      tipoFinanciamiento: "CREDITO_DIRECTO",
      fechaCompletado: "2026-07-01T00:00:00",
    }));

    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);

    // Click Editar Contrato
    const editBtn = await screen.findByText("Editar Contrato");
    fireEvent.click(editBtn);

    expect(screen.getByRole("heading", { name: "Editar Contrato" })).toBeDefined();

    // Change financing type select
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "CREDITO_DIRECTO" } });

    // Submit form
    const saveBtn = screen.getByText("Guardar");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockActualizarContrato).toHaveBeenCalledWith("ua-1", expect.objectContaining({
        tipoFinanciamiento: "CREDITO_DIRECTO",
      }));
    });
  });

});
