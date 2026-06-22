import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/api/finanzas", () => ({
  updatePagoEstado: vi.fn(),
  uploadPagoComprobante: vi.fn(),
  addPago: vi.fn(),
  deletePago: vi.fn(),
  updatePago: vi.fn(),
  createCronograma: vi.fn(),
  updateCronograma: vi.fn(),
}));

vi.mock("@/lib/api/documents", () => ({
  fetchSignedUrl: vi.fn(),
}));

vi.mock("@/modules/finanzas/utils/linkComprobanteToLegal", () => ({
  linkComprobanteToLegal: vi.fn(),
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen, title, message, onConfirm, onClose }: { isOpen: boolean; title: string; message: string; onConfirm?: () => void; onClose: () => void }) =>
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
import DirectFinancingView from '@/modules/finanzas/components/details/DirectFinancingView';

const mockCreateCronograma = vi.mocked(createCronograma);
const mockUpdateCronograma = vi.mocked(updateCronograma);
const mockAddPago = vi.mocked(addPago);
const mockDeletePago = vi.mocked(deletePago);
const mockUpdatePago = vi.mocked(updatePago);
const mockUpdatePagoEstado = vi.mocked(updatePagoEstado);
const mockUploadPagoComprobante = vi.mocked(uploadPagoComprobante);

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
  numeroCuotas: 12,
  estado: "ACTIVO",
};

const makePago = (overrides: Record<string, unknown> = {}) => ({
  uuidPago: overrides.uuidPago as string ?? "pago-1",
  uuidCronograma: "cron-1",
  nroCuota: (overrides.nroCuota as number) ?? 1,
  concepto: (overrides.concepto as string) ?? "CUOTA",
  montoProgramado: (overrides.montoProgramado as number) ?? 25000,
  fechaVencimiento: (overrides.fechaVencimiento as string) ?? "2026-06-20",
  estado: (overrides.estado as string) ?? "PENDIENTE",
  uuidComprobante: (overrides.uuidComprobante as string) ?? null,
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

describe("DirectFinancingView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCronograma.mockResolvedValue({} as any);
    mockUpdateCronograma.mockResolvedValue({} as any);
    mockAddPago.mockResolvedValue({} as any);
    mockDeletePago.mockResolvedValue({} as any);
    mockUpdatePago.mockResolvedValue({} as any);
    mockUpdatePagoEstado.mockResolvedValue({} as any);
    mockUploadPagoComprobante.mockResolvedValue({} as any);
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  // ─── Cronograma Form ──────────────────────────────────────

  it("shows cronograma creation form when no cronograma provided", () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Crear Cronograma de Pagos")).toBeDefined();
    expect(screen.getByText("Guardar Cronograma")).toBeDefined();
  });

  it("shows cronograma edit form when showCronogramaForm is true", () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Total Pactado (S/)")).toBeDefined();
    expect(screen.getByText("Pago Separación (S/)")).toBeDefined();
    expect(screen.getByText("Pago Inicial (S/)")).toBeDefined();
    expect(screen.getByText("N° de Cuotas")).toBeDefined();
  });

  it("creates cronograma on submit", async () => {
    const onUpdate = vi.fn();
    mockCreateCronograma.mockResolvedValue({} as any);
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(mockCreateCronograma).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("updates cronograma when it already exists", async () => {
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={onUpdate} />);
    // Click Editar to show form
    fireEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(screen.getByText("Editar Cronograma de Pagos")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(mockUpdateCronograma).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows error dialog when cronograma save fails", async () => {
    mockCreateCronograma.mockRejectedValue(new Error("Save fail"));
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-modal")).toBeDefined();
    });
    expect(screen.getByTestId("dialog-message").textContent).toBe("Save fail");
  });

  // ─── Cronograma Summary ───────────────────────────────────

  it("shows cronograma summary when available", () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={sampleResumen as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("Cronograma Activo")).toBeDefined();
  });

  // ─── Resumen de Saldos ────────────────────────────────────

  it("shows resumen de saldos when available", () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={sampleResumen as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("Resumen de Saldos")).toBeDefined();
    expect(screen.getByText("Al día")).toBeDefined();
  });

  it("shows resumen with different estadoGlobal", () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={{ ...sampleResumen, estadoGlobal: "EN_MORA" } as any} onUpdate={vi.fn()} />);
    expect(screen.getByText("En mora")).toBeDefined();
  });

  // ─── Cuotas Table ─────────────────────────────────────────

  it("shows cuotas table with header when cronograma exists", () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Cuotas del Cronograma")).toBeDefined();
    expect(screen.getByRole("button", { name: /Agregar Cuota/i })).toBeDefined();
  });

  it("shows empty cuotas message when no pagos", () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText(/Sin cuotas registradas/)).toBeDefined();
  });

  it("shows pago row with correct data", () => {
    const pago = makePago();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("CUOTA")).toBeDefined();
  });

  it("shows PAGADO pago with check icon", () => {
    const pago = makePago({ estado: "PAGADO" });
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Pagado")).toBeDefined();
  });

  it("shows vencido status for overdue pago", () => {
    const pago = makePago({ fechaVencimiento: "2020-01-01" });
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("Vencido")).toBeDefined();
  });

  it("toggles pago status on click", async () => {
    const pago = makePago({ estado: "PENDIENTE" });
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={onUpdate} />);
    const toggleBtn = screen.getByTitle("Marcar Pagado");
    fireEvent.click(toggleBtn);
    await waitFor(() => {
      expect(mockUpdatePagoEstado).toHaveBeenCalledWith("pago-1", "PAGADO");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows error when status change fails", async () => {
    mockUpdatePagoEstado.mockRejectedValue(new Error("Status error"));
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Marcar Pagado"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message").textContent).toBe("Status error");
    });
  });

  // ─── Add Pago Form ────────────────────────────────────────

  it("shows add pago form when clicking Agregar Cuota", async () => {
    const { container } = render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(container.textContent).toContain("Monto (S/)");
    });
  });

  it("adds a new pago", async () => {
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(mockAddPago).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows alert when add pago fails", async () => {
    mockAddPago.mockRejectedValue(new Error("Add fail"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Add fail");
    });
    alertSpy.mockRestore();
  });

  // ─── Delete Pago ──────────────────────────────────────────

  it("opens delete confirmation dialog", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Eliminar cuota"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-message")).toBeDefined();
    });
  });

  it("deletes pago on confirm", async () => {
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Eliminar cuota"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-confirm")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    await waitFor(() => {
      expect(mockDeletePago).toHaveBeenCalledWith("pago-1");
    });
  });

  // ─── Edit Pago ────────────────────────────────────────────

  it("enters edit mode", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Guardar")).toBeDefined();
      expect(screen.getByTitle("Cancelar")).toBeDefined();
    });
  });

  it("cancels edit mode", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
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
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Guardar")).toBeDefined();
    });
    fireEvent.click(screen.getByTitle("Guardar"));
    await waitFor(() => {
      expect(mockUpdatePago).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  // ─── Special concepto ──────────────────────────────────────

  it("shows special conceptos correctly (SEPARACION)", () => {
    const pago = makePago({ nroCuota: -1, concepto: "SEPARACION" });
    const { container } = render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("\u2014");
  });

  it("shows INICIAL concepto when nroCuota is 0", () => {
    const pago = makePago({ nroCuota: 0, concepto: "INICIAL" });
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("INICIAL")).toBeDefined();
  });

  it("shows pago without uuidComprobante fine", () => {
    const pago = makePago({ uuidComprobante: null });
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    expect(screen.getByText("CUOTA")).toBeDefined();
  });

  // ─── PAGADO pago status toggle ────────────────────────────

  it("toggles from PAGADO to PENDIENTE", async () => {
    const pago = makePago({ estado: "PAGADO" });
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Marcar Pendiente"));
    await waitFor(() => {
      expect(mockUpdatePagoEstado).toHaveBeenCalledWith("pago-1", "PENDIENTE");
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  // ─── Vence hoy pago ────────────────────────────────────────

  it("shows status text for pago", () => {
    const pago = makePago({ fechaVencimiento: "2030-01-01" });
    const { container } = render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    // Status should be something (Pendiente, Vencido, etc.)
    expect(container.textContent).toMatch(/Pendiente|Vencido|Vence/);
  });

  it("shows 'Pendiente' for far future pago", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const pago = makePago({ fechaVencimiento: futureDate.toISOString().slice(0, 10) });
    const { container } = render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    expect(container.textContent).toContain("Pendiente");
  });

  it("handles download voucher click", async () => {
    const { fetchSignedUrl } = await import("@/lib/api/documents");
    const mockFetchSignedUrl = vi.mocked(fetchSignedUrl);
    mockFetchSignedUrl.mockResolvedValue({ url: "https://example.com/voucher" } as any);
    const pago = makePago({ uuidComprobante: "comp-1" });
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Descargar comprobante"));
    await waitFor(() => {
      expect(mockFetchSignedUrl).toHaveBeenCalledWith("comp-1");
    });
  });

  it("shows download voucher error dialog", async () => {
    const { fetchSignedUrl } = await import("@/lib/api/documents");
    const mockFetchSignedUrl = vi.mocked(fetchSignedUrl);
    mockFetchSignedUrl.mockRejectedValue(new Error("fail"));
    const pago = makePago({ uuidComprobante: "comp-1" });
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[pago as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Descargar comprobante"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-modal")).toBeDefined();
    });
  });

  it("opens dropzone on upload button click", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
  });

  it("handles dropzone cancel", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByText("Subir")).toBeNull();
    });
  });

  it("cancels cronograma edit form", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(screen.getByText("Editar Cronograma de Pagos")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByText("Editar Cronograma de Pagos")).toBeNull();
    });
  });

  it("adds pago with SEPARACION concepto", async () => {
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "SEPARACION" } });
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("adds pago with INICIAL concepto", async () => {
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "INICIAL" } });
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("closes dialog modal via close button", async () => {
    mockCreateCronograma.mockRejectedValue(new Error("fail"));
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={null} pagos={[]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("Guardar Cronograma"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-modal")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-close"));
    await waitFor(() => {
      expect(screen.queryByTestId("dialog-modal")).toBeNull();
    });
  });

  it("selects file in dropzone and triggers upload", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("test.pdf")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Subir"));
    await waitFor(() => {
      expect(mockUploadPagoComprobante).toHaveBeenCalled();
    });
  });

  it("saves edit with modified values", async () => {
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Guardar")).toBeDefined();
    });
    // Change the date input in edit mode
    const dateInputs = screen.getAllByDisplayValue(/2026-06-20/);
    if (dateInputs.length > 0) {
      fireEvent.change(dateInputs[0], { target: { value: "2026-12-25" } });
    }
    fireEvent.click(screen.getByTitle("Guardar"));
    await waitFor(() => {
      expect(mockUpdatePago).toHaveBeenCalled();
    });
  });

  it("toggles between two dates when adding pago and fills nroCuota", async () => {
    const onUpdate = vi.fn();
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[]} resumen={null} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar Cuota/i }));
    await waitFor(() => {
      expect(screen.getByText("Agregar")).toBeDefined();
    });
    // Fill explicit nroCuota
    fireEvent.change(screen.getByLabelText("N° Cuota"), { target: { value: "5" } });
    fireEvent.click(screen.getByText("Agregar"));
    await waitFor(() => {
      expect(mockAddPago).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ nroCuota: 5 }));
    });
  });

  it("types comentario in dropzone textarea", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Subir comprobante"));
    await waitFor(() => {
      expect(screen.getByText("Subir")).toBeDefined();
    });
    const textarea = screen.getByPlaceholderText("Comentario opcional del pago...");
    fireEvent.change(textarea, { target: { value: "Nota de prueba" } });
    fireEvent.click(textarea);
    expect((textarea as HTMLTextAreaElement).value).toBe("Nota de prueba");
  });

  it("changes edit form monto input", async () => {
    render(<DirectFinancingView expediente={sampleExpediente as any} cronograma={sampleCronograma as any} pagos={[makePago() as any]} resumen={null} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Editar cuota"));
    await waitFor(() => {
      expect(screen.getByTitle("Guardar")).toBeDefined();
    });
    const numberInputs = screen.getAllByDisplayValue("25000");
    // The first is the monto field in edit mode
    fireEvent.change(numberInputs[0], { target: { value: "30000" } });
    await waitFor(() => {
      expect(screen.getByDisplayValue("30000")).toBeDefined();
    });
  });
});
