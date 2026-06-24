import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/api/finanzas", () => ({
  createCronograma: vi.fn(),
  updateCronograma: vi.fn(),
  addPago: vi.fn(),
  deletePago: vi.fn(),
  uploadPagoComprobante: vi.fn(),
  updatePago: vi.fn(),
  updatePagoEstado: vi.fn(),
}));

vi.mock("@/lib/api/documents", () => ({
  fetchSignedUrl: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  updateCommercialHitoEstado: vi.fn(),
  createCommercialHito: vi.fn(),
  deleteCommercialHito: vi.fn(),
  updateCommercialHito: vi.fn(),
}));

vi.mock("@/modules/finanzas/utils/linkComprobanteToLegal", () => ({
  linkComprobanteToLegal: vi.fn(),
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen, title, message, type, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <span data-testid="dialog-title">{title}</span>
        <span data-testid="dialog-message">{message}</span>
        {onConfirm && <button data-testid="dialog-confirm" onClick={onConfirm}>Confirm</button>}
        <button data-testid="dialog-close" onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

import {
  createCronograma, updateCronograma,
  addPago, deletePago, updatePago, updatePagoEstado,
  uploadPagoComprobante,
} from "@/lib/api/finanzas";
import { fetchSignedUrl } from "@/lib/api/documents";
import { updateCommercialHitoEstado, createCommercialHito, deleteCommercialHito, updateCommercialHito } from "@/lib/api/expedientes";
import { linkComprobanteToLegal } from "@/modules/finanzas/utils/linkComprobanteToLegal";
import MortgageFinancingView from '@/modules/finanzas/components/details/MortgageFinancingView';

const mockCreateCronograma = vi.mocked(createCronograma);
const mockUpdateCronograma = vi.mocked(updateCronograma);
const mockAddPago = vi.mocked(addPago);
const mockDeletePago = vi.mocked(deletePago);
const mockUpdatePago = vi.mocked(updatePago);
const mockUpdatePagoEstado = vi.mocked(updatePagoEstado);
const mockUploadPagoComprobante = vi.mocked(uploadPagoComprobante);
const mockFetchSignedUrl = vi.mocked(fetchSignedUrl);
const mockUpdateHitoEstado = vi.mocked(updateCommercialHitoEstado);
const mockCreateHito = vi.mocked(createCommercialHito);
const mockDeleteHito = vi.mocked(deleteCommercialHito);
const mockUpdateHito = vi.mocked(updateCommercialHito);
const mockLinkToLegal = vi.mocked(linkComprobanteToLegal);

const sampleExpediente = {
  uuidUsuarioActivo: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  tipoFinanciamiento: "Crédito Hipotecario",
  faseComercial: "CONTRATO",
  fechaAdquisicion: "2026-01-15",
  createdAt: "2026-01-15",
  updatedAt: null,
  vigente: true,
  clientes: [],
  activos: [{
    id: "unit-1", pisoId: 1, nroPiso: 5, torreNombre: "Torre A",
    proyectoNombre: "Las Lomas", nro: "502", tipo: "DEPARTAMENTO",
    areaM2: 80, areaTechada: 75, estadoComercial: "VENDIDO",
    precio: 350000, descripcion: "Dpto 502",
  }],
};

const sampleCronograma = {
  uuidCronograma: "cron-1",
  uuidUsuarioActivo: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  totalPactado: 350000,
  pagoSeparacion: 1000,
  pagoInicial: 50000,
  numeroCuotas: 1,
  estado: "ACTIVO" as const,
  createdAt: "2026-01-15",
  updatedAt: "2026-01-15",
};

const makePago = (overrides: Record<string, unknown> = {}) => ({
  uuidPago: overrides.uuidPago as string ?? "pago-1",
  uuidCronograma: "cron-1",
  nroCuota: (overrides.nroCuota as number) ?? 1,
  concepto: (overrides.concepto as string) ?? "COMPLETO",
  montoProgramado: (overrides.montoProgramado as number) ?? 25000,
  fechaVencimiento: (overrides.fechaVencimiento as string) ?? "2026-06-20",
  estado: (overrides.estado as string) ?? "PENDIENTE",
  montoPagado: (overrides.montoPagado as number) ?? 0,
  fechaPago: (overrides.fechaPago as string) ?? null,
  uuidComprobante: (overrides.uuidComprobante as string) ?? null,
  actualizadoPor: null,
  comentario: null,
  uuidRequisitoDocumental: null,
  createdAt: "2026-01-15",
  updatedAt: "2026-01-15",
});

const sampleResumen = {
  totalPactado: 350000,
  totalPagado: 100000,
  totalPendiente: 250000,
  proximoVencimiento: "2026-07-01",
  cuotasPagadas: 4,
  cuotasPendientes: 8,
  cuotasVencidas: 0,
  estadoGlobal: "AL_DIA" as const,
};

const makeHitoItem = (overrides: Record<string, unknown> = {}) => ({
  uuidHitoComercial: overrides.uuidHitoComercial !== undefined ? (overrides.uuidHitoComercial as string | null) : "hito-1",
  nombre: (overrides.nombre as string) ?? "Separación",
  estado: (overrides.estado as string) ?? "PENDIENTE",
  monto: (overrides.monto as number) ?? 1000,
  fecha: (overrides.fecha as string) ?? null,
  documentId: (overrides.documentId as string) ?? null,
  downloadUrl: (overrides.downloadUrl as string) ?? null,
});

const sampleCreditoHipotecario = {
  items: [
    makeHitoItem({ nombre: "Separación", estado: "COMPLETADO" }),
    makeHitoItem({ uuidHitoComercial: "hito-2", nombre: "Inicial", estado: "EN_PROGRESO", monto: 50000 }),
    makeHitoItem({ uuidHitoComercial: "hito-3", nombre: "Desembolso", estado: "PENDIENTE", monto: 299000 }),
  ],
  montoTotal: 350000,
  progreso: 33.33,
};

// Una fecha siempre futura (> hoy). El componente valida con validateFutureDate
// que la fecha de vencimiento sea posterior a hoy antes de llamar al backend,
// por lo que los formularios de agregar/editar cuota requieren una fecha válida.
const futureDateISO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

// Rellena la fecha de vencimiento del formulario de "Agregar Cuota".
const fillAddPagoDate = () => {
  fireEvent.change(screen.getByLabelText("Vencimiento"), { target: { value: futureDateISO() } });
};

// Rellena la fecha de vencimiento de la fila en modo edición (input type=date sin label).
const fillEditPagoDate = () => {
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: futureDateISO() } });
};

describe("MortgageFinancingView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCronograma.mockResolvedValue({} as any);
    mockUpdateCronograma.mockResolvedValue({} as any);
    mockAddPago.mockResolvedValue({} as any);
    mockDeletePago.mockResolvedValue({} as any);
    mockUpdatePago.mockResolvedValue({} as any);
    mockUpdatePagoEstado.mockResolvedValue({} as any);
    mockUploadPagoComprobante.mockResolvedValue({} as any);
    mockFetchSignedUrl.mockResolvedValue({ url: "https://example.com/voucher" } as any);
    mockUpdateHitoEstado.mockResolvedValue({} as any);
    mockCreateHito.mockResolvedValue({} as any);
    mockDeleteHito.mockResolvedValue({} as any);
    mockUpdateHito.mockResolvedValue({} as any);
    mockLinkToLegal.mockResolvedValue(undefined);
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Main component rendering
  // ═══════════════════════════════════════════════════════════════════════════

  it("renders the main header section", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Crédito Hipotecario")).toBeDefined();
    expect(screen.getByText("Cronograma de pagos y etapas de desembolso")).toBeDefined();
  });

  it("renders progress bar when creditoHipotecario is provided", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("33%");
  });

  it("renders progress as 0% when creditoHipotecario is null", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("0%");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ResumenSaldosCard
  // ═══════════════════════════════════════════════════════════════════════════

  it("does not render resumen when null", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).not.toContain("Resumen de Saldos");
  });

  it("shows resumen de saldos when available", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={sampleResumen as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Resumen de Saldos")).toBeDefined();
    expect(screen.getByText("Al día")).toBeDefined();
  });

  it("shows AL_DIA estado global badge", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={sampleResumen as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Al día")).toBeDefined();
  });

  it("shows EN_RIESGO estado global badge", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={{ ...sampleResumen, estadoGlobal: "EN_RIESGO" } as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("En riesgo")).toBeDefined();
  });

  it("shows EN_MORA estado global badge", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={{ ...sampleResumen, estadoGlobal: "EN_MORA" } as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("En mora")).toBeDefined();
  });

  it("shows LIQUIDADO estado global badge", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={{ ...sampleResumen, estadoGlobal: "LIQUIDADO" } as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Liquidado")).toBeDefined();
  });

  it("shows cuotas summary text", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={sampleResumen as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("4 cuotas pagadas");
    expect(container.textContent).toContain("8 pendientes");
    expect(container.textContent).toContain("0 vencidas");
  });

  it("shows singular cuota text when count is 1", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={{ ...sampleResumen, cuotasPagadas: 1, cuotasPendientes: 1, cuotasVencidas: 1 } as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("1 cuota pagada");
    expect(container.textContent).toContain("1 pendiente");
    expect(container.textContent).toContain("1 vencida");
  });

  it("shows '—' when proximoVencimiento is null", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={{ ...sampleResumen, proximoVencimiento: null } as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("—");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CronogramaSeccion - Creation
  // ═══════════════════════════════════════════════════════════════════════════

  it("shows cronograma creation form when no cronograma provided", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Crear Cronograma de Pagos")).toBeDefined();
    expect(screen.getByText("Guardar Cronograma")).toBeDefined();
  });

  it("shows all cronograma form fields", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Total Pactado (S/)")).toBeDefined();
    expect(screen.getByText("Pago Separación (S/)")).toBeDefined();
    expect(screen.getByText("Pago Inicial (S/)")).toBeDefined();
  });

  it("creates cronograma on submit", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(mockCreateCronograma).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows error dialog when cronograma create fails", async () => {
    mockCreateCronograma.mockRejectedValue(new Error("Save fail"));
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-modal")).toBeDefined();
    });
    expect(screen.getByTestId("dialog-message").textContent).toBe("Save fail");
  });

  it("shows generic error message when non-Error thrown on create", async () => {
    mockCreateCronograma.mockRejectedValue("string error");
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Error al guardar cronograma");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CronogramaSeccion - Edit
  // ═══════════════════════════════════════════════════════════════════════════

  it("shows cronograma summary when available", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={sampleResumen as any} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Cronograma Activo")).toBeDefined();
    expect(screen.getByText("Editar")).toBeDefined();
  });

  it("enters edit mode when Editar is clicked", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(screen.getByText("Editar Cronograma de Pagos")).toBeDefined();
    });
  });

  it("updates cronograma when already exists", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(screen.getByText("Editar Cronograma de Pagos")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(mockUpdateCronograma).toHaveBeenCalledWith("cron-1", expect.any(Object));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows error dialog when cronograma update fails", async () => {
    mockUpdateCronograma.mockRejectedValue(new Error("Update fail"));
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(screen.getByText("Editar Cronograma de Pagos")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Update fail");
    });
  });

  it("cancels cronograma edit form", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(screen.getByText("Editar Cronograma de Pagos")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByText("Editar Cronograma de Pagos")).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CuotasSeccion - Table & Empty state
  // ═══════════════════════════════════════════════════════════════════════════

  it("does not render cuotas section when no cronograma", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).not.toContain("Cuotas del Cronograma");
  });

  it("shows cuotas table header when cronograma exists", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Cuotas del Cronograma")).toBeDefined();
    expect(screen.getByRole("button", { name: /Agregar Cuota/i })).toBeDefined();
  });

  it("shows empty cuotas message when no pagos", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText(/Sin cuotas registradas/)).toBeDefined();
  });

  it("shows pago row with correct concepto", () => {
    const pago = makePago({ concepto: "COMPLETO" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("COMPLETO")).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MortgagePagoRow - Payment status display
  // ═══════════════════════════════════════════════════════════════════════════

  it("shows PAGADO status text", () => {
    const pago = makePago({ estado: "PAGADO" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Pagado")).toBeDefined();
  });

  it("shows Vencido status for overdue pago", () => {
    const pago = makePago({ fechaVencimiento: "2020-01-01" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Vencido")).toBeDefined();
  });

  it("shows Pendiente for far future pago", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const pago = makePago({ fechaVencimiento: futureDate.toISOString().slice(0, 10) });
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("Pendiente");
  });

  it("shows status text for pago with a future date", () => {
    const pago = makePago({ fechaVencimiento: "2030-01-01" });
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toMatch(/Pendiente|Vencido|Vence/);
  });

  it("shows mora text for overdue pago", () => {
    const pago = makePago({ fechaVencimiento: "2020-01-01" });
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toMatch(/Vencido|Pendiente/);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MortgagePagoRow - Special conceptos
  // ═══════════════════════════════════════════════════════════════════════════

  it("shows dash for special concepto SEPARACION nroCuota", () => {
    const pago = makePago({ nroCuota: -1, concepto: "SEPARACION" });
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("\u2014");
  });

  it("shows SEPARACION concepto label", () => {
    const pago = makePago({ nroCuota: -1, concepto: "SEPARACION" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("SEPARACION")).toBeDefined();
  });

  it("shows INICIAL concepto label", () => {
    const pago = makePago({ nroCuota: 0, concepto: "INICIAL" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("INICIAL")).toBeDefined();
  });

  it("falls back to COMPLETO label when concepto is falsy", () => {
    const pago = makePago({ concepto: "", nroCuota: 1 });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("COMPLETO")).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MortgagePagoRow - Status toggle
  // ═══════════════════════════════════════════════════════════════════════════

  it("toggles pago status from PENDIENTE to PAGADO", async () => {
    const pago = makePago({ estado: "PENDIENTE" });
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Marcar Pagado"));
    await waitFor(() => {
      expect(mockUpdatePagoEstado).toHaveBeenCalledWith("pago-1", "PAGADO");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("toggles pago status from PAGADO to PENDIENTE", async () => {
    const pago = makePago({ estado: "PAGADO" });
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Marcar Pendiente"));
    await waitFor(() => {
      expect(mockUpdatePagoEstado).toHaveBeenCalledWith("pago-1", "PENDIENTE");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows error dialog when status change fails", async () => {
    mockUpdatePagoEstado.mockRejectedValue(new Error("Status error"));
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Marcar Pagado"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Status error");
    });
  });

  it("shows generic error when status change throws non-Error", async () => {
    mockUpdatePagoEstado.mockRejectedValue("bad");
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Marcar Pagado"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Error al actualizar estado");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MortgagePagoRow - Edit mode
  // ═══════════════════════════════════════════════════════════════════════════

  it("enters edit mode on edit button click", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Guardar")).toBeDefined();
      expect(screen.getByTitle("Cancelar")).toBeDefined();
    });
  });

  it("cancels edit mode", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Cancelar")).toBeDefined();
    });
    fireEvent.click(screen.getByTitle("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByTitle("Guardar")).toBeNull();
    });
  });

  it("saves edit changes", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Guardar")).toBeDefined();
    });
    fillEditPagoDate();
    fireEvent.click(screen.getByTitle("Guardar"));
    await waitFor(() => {
      expect(mockUpdatePago).toHaveBeenCalledWith("pago-1", expect.any(Object));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows error dialog when edit save fails", async () => {
    mockUpdatePago.mockRejectedValue(new Error("Edit fail"));
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Guardar")).toBeDefined();
    });
    fillEditPagoDate();
    fireEvent.click(screen.getByTitle("Guardar"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Edit fail");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MortgagePagoRow - Delete
  // ═══════════════════════════════════════════════════════════════════════════

  it("opens delete confirmation dialog", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Eliminar cuota"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message")).toBeDefined();
    });
  });

  it("deletes pago on confirm", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Eliminar cuota"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-confirm")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    await waitFor(() => {
      expect(mockDeletePago).toHaveBeenCalledWith("pago-1");
    });
  });

  it("shows error dialog when delete fails", async () => {
    mockDeletePago.mockRejectedValue(new Error("Delete fail"));
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Eliminar cuota"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-confirm")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Delete fail");
    });
  });

  it("shows generic error when delete throws non-Error", async () => {
    mockDeletePago.mockRejectedValue("bad");
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Eliminar cuota"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-confirm")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Error al eliminar cuota");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MortgagePagoRow - Download voucher
  // ═══════════════════════════════════════════════════════════════════════════

  it("handles download voucher click", async () => {
    const pago = makePago({ uuidComprobante: "comp-1" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Descargar comprobante"));
    await waitFor(() => {
      expect(mockFetchSignedUrl).toHaveBeenCalledWith("comp-1");
      expect(window.open).toHaveBeenCalledWith("https://example.com/voucher", "_blank", "noopener,noreferrer");
    });
  });

  it("shows download voucher error dialog", async () => {
    mockFetchSignedUrl.mockRejectedValue(new Error("fail"));
    const pago = makePago({ uuidComprobante: "comp-1" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Descargar comprobante"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-modal")).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MortgagePagoRow - Upload dropzone
  // ═══════════════════════════════════════════════════════════════════════════

  it("opens upload dropzone on upload button click", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
  });

  it("cancels upload dropzone", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByText("Subir")).toBeNull();
    });
  });

  it("selects a file via hidden input in dropzone", async () => {
    const pago = makePago();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.getElementById(`file-input-${pago.uuidPago}`) as HTMLInputElement;
    const file = new File(["test"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("comprobante.pdf")).toBeDefined();
    });
  });

  it("uploads file on confirm in dropzone", async () => {
    const onUpdate = vi.fn();
    const pago = makePago({ estado: "PENDIENTE" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.getElementById(`file-input-${pago.uuidPago}`) as HTMLInputElement;
    const file = new File(["test"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("comprobante.pdf")).toBeDefined();
    });
    const uploadButton = screen.getByText("Subir");
    fireEvent.click(uploadButton);
    await waitFor(() => {
      expect(mockUploadPagoComprobante).toHaveBeenCalledWith("pago-1", file, undefined);
      expect(mockUpdatePagoEstado).toHaveBeenCalledWith("pago-1", "PAGADO");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("does not call updatePagoEstado if already PAGADO on upload", async () => {
    const pago = makePago({ estado: "PAGADO" });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.getElementById(`file-input-${pago.uuidPago}`) as HTMLInputElement;
    const file = new File(["test"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("comprobante.pdf")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Subir"));
    await waitFor(() => {
      expect(mockUploadPagoComprobante).toHaveBeenCalled();
      expect(mockUpdatePagoEstado).not.toHaveBeenCalled();
    });
  });

  it("links comprobante to legal for SEPARACION concepto", async () => {
    const pago = makePago({ estado: "PENDIENTE", concepto: "SEPARACION", nroCuota: -1 });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.getElementById(`file-input-${pago.uuidPago}`) as HTMLInputElement;
    const file = new File(["test"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("comprobante.pdf")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Subir"));
    await waitFor(() => {
      expect(mockLinkToLegal).toHaveBeenCalledWith("a1b2c3d4-e5f6-7890-abcd-ef1234567890", "SEPARACION", file);
    });
  });

  it("links comprobante to legal for INICIAL concepto", async () => {
    const pago = makePago({ estado: "PENDIENTE", concepto: "INICIAL", nroCuota: 0 });
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.getElementById(`file-input-${pago.uuidPago}`) as HTMLInputElement;
    const file = new File(["test"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("comprobante.pdf")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Subir"));
    await waitFor(() => {
      expect(mockLinkToLegal).toHaveBeenCalledWith("a1b2c3d4-e5f6-7890-abcd-ef1234567890", "INICIAL", file);
    });
  });

  it("shows error dialog on upload failure", async () => {
    mockUploadPagoComprobante.mockRejectedValue(new Error("Upload fail"));
    const pago = makePago();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.getElementById(`file-input-${pago.uuidPago}`) as HTMLInputElement;
    const file = new File(["test"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("comprobante.pdf")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Subir"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Upload fail");
    });
  });

  it("shows generic error on upload with non-Error", async () => {
    mockUploadPagoComprobante.mockRejectedValue("bad");
    const pago = makePago();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.getElementById(`file-input-${pago.uuidPago}`) as HTMLInputElement;
    const file = new File(["test"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("comprobante.pdf")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Subir"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Error al subir comprobante");
    });
  });

  it("does not call upload when no file selected", async () => {
    const pago = makePago();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Subir"));
    expect(mockUploadPagoComprobante).not.toHaveBeenCalled();
  });

  it("closes dropzone when clicking upload button again (toggle)", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.queryByText("Subir")).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CuotasSeccion - Add pago form
  // ═══════════════════════════════════════════════════════════════════════════

  it("shows add pago form when clicking Agregar Cuota", async () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(container.textContent).toContain("Monto (S/)");
    });
  });

  it("hides add pago form on second click", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.queryByText("Agregar")).toBeNull();
    });
  });

  it("adds a new pago with COMPLETO default concepto", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fillAddPagoDate();
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(mockAddPago).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("adds pago with SEPARACION concepto (auto nroCuota=-1)", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "SEPARACION" } });
    fillAddPagoDate();
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(mockAddPago).toHaveBeenCalledWith("cron-1", expect.objectContaining({ nroCuota: -1, concepto: "SEPARACION" }));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("adds pago with INICIAL concepto (auto nroCuota=0)", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "INICIAL" } });
    fillAddPagoDate();
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(mockAddPago).toHaveBeenCalledWith("cron-1", expect.objectContaining({ nroCuota: 0, concepto: "INICIAL" }));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("adds pago with explicit nroCuota", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.change(screen.getByLabelText("N° Cuota"), { target: { value: "5" } });
    fillAddPagoDate();
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(mockAddPago).toHaveBeenCalledWith("cron-1", expect.objectContaining({ nroCuota: 5 }));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows alert when add pago fails", async () => {
    mockAddPago.mockRejectedValue(new Error("Add fail"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fillAddPagoDate();
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Add fail");
    });
    alertSpy.mockRestore();
  });

  it("shows generic alert when add pago throws non-Error", async () => {
    mockAddPago.mockRejectedValue("bad");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fillAddPagoDate();
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error al agregar cuota");
    });
    alertSpy.mockRestore();
  });

  it("closes add form via X button", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.click(screen.getByText("✕"));
    await waitFor(() => {
      expect(screen.queryByText("Agregar")).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CuotasSeccion - Multiple pagos sorted by nroCuota
  // ═══════════════════════════════════════════════════════════════════════════

  it("renders multiple pagos in order", () => {
    const pagos = [
      makePago({ uuidPago: "a", nroCuota: 3, concepto: "COMPLETO" }),
      makePago({ uuidPago: "b", nroCuota: -1, concepto: "SEPARACION" }),
      makePago({ uuidPago: "c", nroCuota: 0, concepto: "INICIAL" }),
    ];
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={pagos as any[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("SEPARACION")).toBeDefined();
    expect(screen.getByText("INICIAL")).toBeDefined();
    expect(screen.getByText("COMPLETO")).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HitosDesembolsoSection - Empty state
  // ═══════════════════════════════════════════════════════════════════════════

  it("renders hitos section header", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Etapas del Desembolso")).toBeDefined();
    expect(screen.getByRole("button", { name: /Agregar Hito/i })).toBeDefined();
  });

  it("shows empty hitos message when no items", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Sin hitos registrados")).toBeDefined();
  });

  it("does not show progress badge when creditoHipotecario is null", () => {
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    expect(container.textContent).not.toContain("% completo");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HitosDesembolsoSection - Hito items rendering
  // ═══════════════════════════════════════════════════════════════════════════

  it("renders hito items when available", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("Separación")).toBeDefined();
    expect(screen.getByText("Inicial")).toBeDefined();
    expect(screen.getByText("Desembolso")).toBeDefined();
  });

  it("renders hito items with correct status badges", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("Listo")).toBeDefined();
    expect(screen.getByText("En curso")).toBeDefined();
    expect(screen.getByText("Pendiente")).toBeDefined();
  });

  it("shows progress percentage badge", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("33% completo")).toBeDefined();
  });

  it("shows monto total hipotecario when montoTotal > 0", () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("Monto Total Hipotecario")).toBeDefined();
  });

  it("does not show monto total when montoTotal is 0", () => {
    const credito = {
      ...sampleCreditoHipotecario,
      montoTotal: 0,
    };
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={credito as any} onUpdate={vi.fn()} />);
    expect(container.textContent).not.toContain("Monto Total Hipotecario");
  });

  it("shows download url link when hito has downloadUrl", () => {
    const credito = {
      ...sampleCreditoHipotecario,
      items: [
        makeHitoItem({ nombre: "Con doc", downloadUrl: "https://example.com/doc" }),
      ],
    };
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={credito as any} onUpdate={vi.fn()} />);
    expect(container.querySelector('a[href="https://example.com/doc"]')).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HitosDesembolsoSection - Hito toggle state
  // ═══════════════════════════════════════════════════════════════════════════

  it("toggles hito from PENDIENTE to EN_PROGRESO", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={onUpdate} />);
    // Find the PENDIENTE hito's toggle button by title
    const buttons = screen.getAllByTitle("Marcar como en curso");
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(mockUpdateHitoEstado).toHaveBeenCalledWith("hito-3", "EN_PROGRESO");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("toggles hito from EN_PROGRESO to COMPLETADO", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={onUpdate} />);
    const buttons = screen.getAllByTitle("Marcar como completado");
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(mockUpdateHitoEstado).toHaveBeenCalledWith("hito-2", "COMPLETADO");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("toggles hito from COMPLETADO to PENDIENTE", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={onUpdate} />);
    const buttons = screen.getAllByTitle("Marcar como pendiente");
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(mockUpdateHitoEstado).toHaveBeenCalledWith("hito-1", "PENDIENTE");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows alert when hito toggle fails", async () => {
    mockUpdateHitoEstado.mockRejectedValue(new Error("Hito fail"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    const buttons = screen.getAllByTitle("Marcar como en curso");
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("No se pudo actualizar el hito.");
    });
    alertSpy.mockRestore();
  });

  it("shows generic alert when hito toggle throws non-Error", async () => {
    mockUpdateHitoEstado.mockRejectedValue("bad");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    const buttons = screen.getAllByTitle("Marcar como en curso");
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("No se pudo actualizar el hito.");
    });
    alertSpy.mockRestore();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HitosDesembolsoSection - Add hito
  // ═══════════════════════════════════════════════════════════════════════════

  it("shows add hito form when clicking Agregar Hito", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Hito/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nombre del hito…")).toBeDefined();
    });
  });

  it("creates a new hito", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Hito/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nombre del hito…")).toBeDefined();
    });
    fireEvent.change(screen.getByPlaceholderText("Nombre del hito…"), { target: { value: "Nuevo Hito" } });
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(mockCreateHito).toHaveBeenCalledWith(expect.objectContaining({ nombreHito: "Nuevo Hito" }));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("does not call create when hito name is empty", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Hito/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nombre del hito…")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Agregar"));
    expect(mockCreateHito).not.toHaveBeenCalled();
  });

  it("creates hito on Enter key", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Hito/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nombre del hito…")).toBeDefined();
    });
    fireEvent.change(screen.getByPlaceholderText("Nombre del hito…"), { target: { value: "Hito Enter" } });
    fireEvent.keyDown(screen.getByPlaceholderText("Nombre del hito…"), { key: "Enter" });
    await waitFor(() => {
      expect(mockCreateHito).toHaveBeenCalledWith(expect.objectContaining({ nombreHito: "Hito Enter" }));
    });
  });

  it("shows alert when hito creation fails", async () => {
    mockCreateHito.mockRejectedValue(new Error("Create fail"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Hito/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nombre del hito…")).toBeDefined();
    });
    fireEvent.change(screen.getByPlaceholderText("Nombre del hito…"), { target: { value: "Fail" } });
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Create fail");
    });
    alertSpy.mockRestore();
  });

  it("closes hito form on ✕ click", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Hito/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nombre del hito…")).toBeDefined();
    });
    fireEvent.click(screen.getByText("✕"));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Nombre del hito…")).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HitosDesembolsoSection - Edit hito
  // ═══════════════════════════════════════════════════════════════════════════

  it("enters edit hito mode", async () => {
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    const editButtons = screen.getAllByTitle("Editar nombre");
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("Actualizar")).toBeDefined();
    });
  });

  it("updates a hito", async () => {
    const onUpdate = vi.fn();
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={onUpdate} />);
    const editButtons = screen.getAllByTitle("Editar nombre");
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("Actualizar")).toBeDefined();
    });
    fireEvent.change(screen.getByPlaceholderText("Nombre del hito…"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByText("Actualizar"));
    await waitFor(() => {
      expect(mockUpdateHito).toHaveBeenCalledWith("hito-1", expect.objectContaining({ nombreHito: "Renamed" }));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HitosDesembolsoSection - Delete hito
  // ═══════════════════════════════════════════════════════════════════════════

  it("deletes a hito", async () => {
    const onUpdate = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={onUpdate} />);
    const deleteButtons = screen.getAllByTitle("Eliminar hito");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockDeleteHito).toHaveBeenCalledWith("hito-1");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("does not delete hito when confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    const deleteButtons = screen.getAllByTitle("Eliminar hito");
    fireEvent.click(deleteButtons[0]);
    expect(mockDeleteHito).not.toHaveBeenCalled();
  });

  it("shows alert when hito delete fails", async () => {
    mockDeleteHito.mockRejectedValue(new Error("Delete hito fail"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={sampleCreditoHipotecario as any} onUpdate={vi.fn()} />);
    const deleteButtons = screen.getAllByTitle("Eliminar hito");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Delete hito fail");
    });
    alertSpy.mockRestore();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DialogModal interactions
  // ═══════════════════════════════════════════════════════════════════════════

  it("closes dialog modal on close button click", async () => {
    mockCreateCronograma.mockRejectedValue(new Error("test"));
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-modal")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-close"));
    await waitFor(() => {
      expect(screen.queryByTestId("dialog-modal")).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Full integration render
  // ═══════════════════════════════════════════════════════════════════════════

  it("renders all sections when all data is provided", () => {
    const { container } = render(
      <MortgageFinancingView
        expediente={sampleExpediente as any}
        cronograma={sampleCronograma as any}
        pagos={[makePago() as any]}
        resumen={sampleResumen as any}
        creditoHipotecario={sampleCreditoHipotecario as any}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByText("Crédito Hipotecario")).toBeDefined();
    expect(screen.getByText("Resumen de Saldos")).toBeDefined();
    expect(screen.getByText("Cronograma Activo")).toBeDefined();
    expect(screen.getByText("Cuotas del Cronograma")).toBeDefined();
    expect(screen.getByText("Etapas del Desembolso")).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Edge cases
  // ═══════════════════════════════════════════════════════════════════════════

  it("handles hito item without uuidHitoComercial (canChange=false)", () => {
    const credito = {
      ...sampleCreditoHipotecario,
      items: [
        makeHitoItem({ uuidHitoComercial: null, nombre: "NoID", estado: "PENDIENTE" }),
      ],
    };
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={credito as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("NoID")).toBeDefined();
    // No edit/delete buttons for items without uuidHitoComercial
    expect(screen.queryByTitle("Editar nombre")).toBeNull();
  });

  it("shows hito item monto when monto > 0", () => {
    const credito = {
      ...sampleCreditoHipotecario,
      items: [
        makeHitoItem({ nombre: "WithMonto", monto: 5000 }),
      ],
    };
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={credito as any} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("5,000.00");
  });

  it("does not show monto when monto is 0 in hito item", () => {
    const credito = {
      ...sampleCreditoHipotecario,
      items: [
        makeHitoItem({ nombre: "NoMonto", monto: 0 }),
      ],
    };
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={credito as any} onUpdate={vi.fn()} />);
    // The label should be there but no "S/" text
    expect(screen.getByText("NoMonto")).toBeDefined();
  });

  it("shows hito item fecha when present", () => {
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T12:00:00`;
    const expectedFormatted = new Date(todayLocal).toLocaleDateString("es-PE");
    const credito = {
      ...sampleCreditoHipotecario,
      items: [
        makeHitoItem({ nombre: "WithDate", fecha: todayLocal }),
      ],
    };
    const { container } = render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={credito as any} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain(expectedFormatted);
  });

  it("renders with empty items array in creditoHipotecario", () => {
    const credito = {
      items: [],
      montoTotal: 0,
      progreso: 0,
    };
    render(<MortgageFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} creditoHipotecario={credito as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("Sin hitos registrados")).toBeDefined();
  });
});
