/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MortgageFinancingView from "./MortgageFinancingView";

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
  default: () => null,
}));

const mockExpediente: any = {
  uuidUsuarioActivo: "ua-1",
  clientes: [],
  tipoFinanciamiento: "Crédito Hipotecario",
};
const mockCronograma = { uuidCronograma: "c-1", totalPactado: 200000, numeroCuotas: 12, pagoSeparacion: 10000, pagoInicial: 20000, estado: "ACTIVO" } as any;
const mockResumen = { estadoGlobal: "AL_DIA", totalPagado: 30000, totalPendiente: 170000 } as any;
const mockCredit = { items: [], montoTotal: 200000, progreso: 15 } as any;

describe("MortgageFinancingView", () => {
  it("renderiza sin cronograma (modo creación)", () => {
    const { container } = render(
      <MortgageFinancingView
        expediente={mockExpediente}
        cronograma={null}
        pagos={[]}
        resumen={null}
        creditoHipotecario={null}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renderiza con cronograma y pagos", () => {
    const { container } = render(
      <MortgageFinancingView
        expediente={mockExpediente}
        cronograma={mockCronograma}
        pagos={[]}
        resumen={mockResumen}
        creditoHipotecario={mockCredit}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renderiza con hitos de crédito hipotecario", () => {
    const { container } = render(
      <MortgageFinancingView
        expediente={mockExpediente}
        cronograma={mockCronograma}
        pagos={[]}
        resumen={mockResumen}
        creditoHipotecario={{
          items: [
            { uuidHitoComercial: "h-1", nombre: "Carta aprobación", fecha: "2026-01-15", estado: "COMPLETADO" as const, monto: 0, documentId: null, downloadUrl: null },
          ],
          montoTotal: 200000,
          progreso: 100,
        }}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
