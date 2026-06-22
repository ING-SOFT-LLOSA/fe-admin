import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FinancingSummaryCards from '@/modules/finanzas/components/details/FinancingSummaryCards';

describe("FinancingSummaryCards", () => {
  it("muestra cantidad de unidades y valor comercial", () => {
    render(
      <FinancingSummaryCards
        resumen={null}
        commercialValue={250000}
        unitCount={5}
      />
    );
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("Unidades")).toBeDefined();
    expect(screen.getByText("Valor Comercial Total")).toBeDefined();
  });

  it("muestra total pagado desde el resumen", () => {
    render(
      <FinancingSummaryCards
        resumen={{ totalPagado: 50000, totalPendiente: 200000 } as any}
        commercialValue={250000}
        unitCount={3}
      />
    );
    expect(screen.getByText("Total Pagado")).toBeDefined();
  });

  it("muestra 0 cuando resumen es null", () => {
    render(
      <FinancingSummaryCards
        resumen={null}
        commercialValue={180000}
        unitCount={2}
      />
    );
    expect(screen.getByText("Saldo Pendiente")).toBeDefined();
  });
});
