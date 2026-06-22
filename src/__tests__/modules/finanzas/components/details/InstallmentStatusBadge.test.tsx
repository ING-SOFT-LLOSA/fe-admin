import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InstallmentStatusBadge from '@/modules/finanzas/components/details/InstallmentStatusBadge';

describe("InstallmentStatusBadge", () => {
  it("muestra 'Pagado' para estado PAGADO", () => {
    render(<InstallmentStatusBadge status="PAGADO" />);
    expect(screen.getByText("Pagado")).toBeDefined();
  });

  it("muestra 'Pendiente' para estado PENDIENTE", () => {
    render(<InstallmentStatusBadge status="PENDIENTE" />);
    expect(screen.getByText("Pendiente")).toBeDefined();
  });

  it("muestra 'Vencido' para estado VENCIDO", () => {
    render(<InstallmentStatusBadge status="VENCIDO" />);
    expect(screen.getByText("Vencido")).toBeDefined();
  });
});
