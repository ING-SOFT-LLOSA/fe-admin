/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PaymentManagementStep from '@/modules/finanzas/components/steps/PaymentManagementStep';

vi.mock('@/modules/finanzas/hooks/useFinancingData', () => ({
  useFinancingData: vi.fn(),
}));

vi.mock('@/modules/finanzas/components/details/DirectFinancingView', () => ({
  default: () => <div data-testid="direct-view">Direct Financing</div>,
}));

vi.mock('@/modules/finanzas/components/details/MortgageFinancingView', () => ({
  default: () => <div data-testid="mortgage-view">Mortgage Financing</div>,
}));

import { useFinancingData } from '@/modules/finanzas/hooks/useFinancingData';

const mockUseFinancingData = vi.mocked(useFinancingData);

describe("PaymentManagementStep", () => {
  it("muestra loading mientras carga datos", () => {
    mockUseFinancingData.mockReturnValue({
      expediente: null,
      cronograma: null,
      pagos: [],
      resumen: null,
      creditoHipotecario: null,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
      hasExpediente: null,
    } as any);

    render(
      <PaymentManagementStep
        expediente={{ uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Directo" } as any}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText("Cargando información del contrato…")).toBeDefined();
  });

  it("muestra error si hay un error", () => {
    mockUseFinancingData.mockReturnValue({
      expediente: null,
      isLoading: false,
      error: "Error al cargar",
    } as any);

    render(
      <PaymentManagementStep
        expediente={{ uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Directo" } as any}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText("Error al cargar")).toBeDefined();
  });

  it("muestra DirectFinancingView para crédito directo", () => {
    mockUseFinancingData.mockReturnValue({
      expediente: { uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Directo" },
      cronograma: null,
      pagos: [],
      resumen: null,
      creditoHipotecario: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    } as any);

    render(
      <PaymentManagementStep
        expediente={{ uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Directo" } as any}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId("direct-view")).toBeDefined();
  });

  it("muestra MortgageFinancingView para crédito hipotecario", () => {
    mockUseFinancingData.mockReturnValue({
      expediente: { uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Hipotecario" },
      cronograma: null,
      pagos: [],
      resumen: null,
      creditoHipotecario: { items: [], montoTotal: 0, progreso: 0 },
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    } as any);

    render(
      <PaymentManagementStep
        expediente={{ uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Hipotecario" } as any}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId("mortgage-view")).toBeDefined();
  });

  it("muestra el encabezado Gestionar Pagos", () => {
    mockUseFinancingData.mockReturnValue({
      expediente: { uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Directo" },
      cronograma: null,
      pagos: [],
      resumen: null,
      creditoHipotecario: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    } as any);

    render(
      <PaymentManagementStep
        expediente={{ uuidUsuarioActivo: "ua-1", tipoFinanciamiento: "Crédito Directo" } as any}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText("Gestionar Pagos")).toBeDefined();
  });
});
