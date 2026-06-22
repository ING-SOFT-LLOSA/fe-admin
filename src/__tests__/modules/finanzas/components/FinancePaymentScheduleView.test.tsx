import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FinancePaymentScheduleView from '@/modules/finanzas/components/FinancePaymentScheduleView';

vi.mock('@/modules/finanzas/components/steps/ClientSearchStep', () => ({
  default: ({ onSelectClient }: any) => (
    <div data-testid="search-step">
      <button onClick={() => onSelectClient({ id: 1, nombre: "Juan" })}>
        Select
      </button>
    </div>
  ),
}));

vi.mock('@/modules/finanzas/components/steps/ContractSelectionStep', () => ({
  default: ({ onSelectContract, onBack }: any) => (
    <div data-testid="contract-step">
      <button onClick={() => onSelectContract({ uuidUsuarioActivo: "ua-1" })}>
        Select Contract
      </button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/modules/finanzas/components/steps/PaymentManagementStep', () => ({
  default: ({ onBack }: any) => (
    <div data-testid="management-step">
      <button onClick={onBack}>Back to Contracts</button>
    </div>
  ),
}));

describe("FinancePaymentScheduleView", () => {
  it("muestra el título Pagos y Financiamiento", () => {
    render(<FinancePaymentScheduleView />);
    expect(screen.getByText("Pagos y Financiamiento")).toBeDefined();
  });

  it("empieza en el paso de búsqueda de cliente", () => {
    render(<FinancePaymentScheduleView />);
    expect(screen.getByTestId("search-step")).toBeDefined();
  });

  it("avanza a contratos al seleccionar cliente", () => {
    render(<FinancePaymentScheduleView />);
    fireEvent.click(screen.getByText("Select"));
    expect(screen.getByTestId("contract-step")).toBeDefined();
  });

  it("avanza a gestión de pagos al seleccionar contrato", () => {
    render(<FinancePaymentScheduleView />);
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText("Select Contract"));
    expect(screen.getByTestId("management-step")).toBeDefined();
  });

  it("los breadcrumbs muestran los 3 pasos", () => {
    render(<FinancePaymentScheduleView />);
    expect(screen.getByText("Buscar Cliente")).toBeDefined();
    expect(screen.getByText("Contratos")).toBeDefined();
    expect(screen.getByText("Gestión de Pagos")).toBeDefined();
  });
});
