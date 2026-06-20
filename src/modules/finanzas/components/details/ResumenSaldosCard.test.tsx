import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ResumenSaldosCard from "./ResumenSaldosCard";
import type { CronogramaResumenResponse } from "@/modules/finanzas/types";

describe("ResumenSaldosCard", () => {
  it("retorna null si resumen es nulo", () => {
    const { container } = render(<ResumenSaldosCard resumen={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza el resumen de saldos con datos correctos", () => {
    const mockResumen: CronogramaResumenResponse = {
      totalPactado: 500000,
      totalPagado: 200000,
      totalPendiente: 300000,
      estadoGlobal: "AL_DIA",
      cuotasPagadas: 3,
      cuotasPendientes: 9,
      cuotasVencidas: 0,
      proximoVencimiento: "2026-07-15",
    };

    render(<ResumenSaldosCard resumen={mockResumen} />);

    expect(screen.getByText("Resumen de Saldos")).toBeDefined();
    expect(screen.getByText("Al día")).toBeDefined();
    expect(screen.getByText(/3 cuotas pagadas/)).toBeDefined();
    expect(screen.getByText(/9 pendientes/)).toBeDefined();
    expect(screen.getByText(/0 vencidas/)).toBeDefined();
  });

  it("renderiza correctamente cuando estadoGlobal, proximoVencimiento son nulos y cuotas son singulares", () => {
    const mockResumen: CronogramaResumenResponse = {
      totalPactado: 500000,
      totalPagado: 200000,
      totalPendiente: 300000,
      estadoGlobal: null as any,
      cuotasPagadas: 1,
      cuotasPendientes: 1,
      cuotasVencidas: 1,
      proximoVencimiento: null,
    };

    render(<ResumenSaldosCard resumen={mockResumen} />);

    expect(screen.queryByText("Al día")).toBeNull();
    expect(screen.getByText("1 cuota pagada")).toBeDefined();
    expect(screen.getByText("1 pendiente")).toBeDefined();
    expect(screen.getByText("1 vencida")).toBeDefined();
    expect(screen.getByText("—")).toBeDefined();
  });
});
