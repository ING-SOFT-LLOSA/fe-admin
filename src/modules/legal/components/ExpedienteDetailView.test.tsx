/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ExpedienteDetailView from "./ExpedienteDetailView";

vi.mock("./hooks", () => ({
  useExpediente: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchCommercialStepper: vi.fn().mockResolvedValue({ uuidUsuarioActivo: "ua-1", etapas: [] }),
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
  fetchUsuarios: vi.fn().mockResolvedValue([]),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: () => null,
}));

import { useExpediente } from "./hooks";

const mockUseExpediente = vi.mocked(useExpediente);

function mockLoading() {
  mockUseExpediente.mockReturnValue({
    expediente: null,
    stages: [],
    loading: true,
    error: "",
    setExpediente: vi.fn(),
    refresh: vi.fn(),
  } as any);
}

function mockError() {
  mockUseExpediente.mockReturnValue({
    expediente: null,
    stages: [],
    loading: false,
    error: "Expediente no encontrado",
    setExpediente: vi.fn(),
    refresh: vi.fn(),
  } as any);
}

function mockLoaded() {
  mockUseExpediente.mockReturnValue({
    expediente: {
      uuidUsuarioActivo: "ua-1",
      clientes: [{ nombre: "Juan", apellidos: "Pérez", email: "juan@test.com", documentoIdentidad: "12345678" }],
      activos: [{ proyectoNombre: "Aurora", tipo: "Dpto", nro: "301", torreNombre: "Torre A" }],
      tipoFinanciamiento: "Crédito Directo",
      vigente: true,
    },
    stages: [
      { etapaProceso: "SEPARACION", estado: "COMPLETADO", totalHitos: 1, hitosCompletados: 1 },
      { etapaProceso: "CONTRATO", estado: "PENDIENTE", totalHitos: 0, hitosCompletados: 0 },
    ],
    loading: false,
    error: "",
    setExpediente: vi.fn(),
    refresh: vi.fn(),
  } as any);
}

describe("ExpedienteDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra loading spinner mientras carga", () => {
    mockLoading();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(screen.getByText("Cargando expediente...")).toBeDefined();
  });

  it("muestra mensaje de error si falla la carga", () => {
    mockError();
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

  it("muestra la información del cliente en el header", async () => {
    mockLoaded();
    render(<ExpedienteDetailView uuidUsuarioActivo="ua-1" />);
    expect(await screen.findByText("Juan Pérez")).toBeDefined();
  });
});
