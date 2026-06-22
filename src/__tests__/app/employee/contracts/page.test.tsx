import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmployeeContractsPage from '@/app/employee/contracts/page';

describe("EmployeeContractsPage", () => {
  it("renders title and description", () => {
    render(<EmployeeContractsPage />);
    expect(screen.getByText("Mis Contratos")).toBeDefined();
    expect(screen.getByText(/Gestión de contratos/)).toBeDefined();
  });

  it("renders all 5 contract cards", () => {
    render(<EmployeeContractsPage />);
    expect(screen.getByText("Familia Gómez")).toBeDefined();
    expect(screen.getByText("Carlos Ruiz")).toBeDefined();
    expect(screen.getByText("Ana Soto")).toBeDefined();
    expect(screen.getByText("Luis Vargas")).toBeDefined();
    expect(screen.getByText("Empresa XYZ")).toBeDefined();
  });

  it("renders unit info per contract", () => {
    render(<EmployeeContractsPage />);
    expect(screen.getByText("Los Pinos - Lote 12")).toBeDefined();
    expect(screen.getByText("Torre A - 402")).toBeDefined();
    expect(screen.getByText("Edificio Central - Of 205")).toBeDefined();
    expect(screen.getByText("Torre A - 305")).toBeDefined();
    expect(screen.getByText("Edificio Central - Of 101")).toBeDefined();
  });

  it("renders all state badges", () => {
    render(<EmployeeContractsPage />);
    expect(screen.getByText("Generado")).toBeDefined();
    expect(screen.getByText("Pendiente de firma")).toBeDefined();
    expect(screen.getByText("En revisión")).toBeDefined();
    expect(screen.getByText("Firmado")).toBeDefined();
    expect(screen.getByText("Legalizado")).toBeDefined();
  });

  it("renders deadlines and highlights urgent ones", () => {
    render(<EmployeeContractsPage />);
    const todayEl = screen.getByText("Hoy");
    expect(todayEl).toBeDefined();
    expect(todayEl.className).toContain("text-[#ba1a1a]");
    expect(screen.getByText("30 Oct")).toBeDefined();
    expect(screen.getByText("02 Nov")).toBeDefined();
  });

  it("renders action buttons (Ver, Subir, Marcar) for each card", () => {
    render(<EmployeeContractsPage />);
    expect(screen.getAllByText("visibility").length).toBe(5);
    expect(screen.getAllByText("upload_file").length).toBe(5);
    expect(screen.getAllByText("check_circle").length).toBe(5);
  });

  it("all buttons have title attributes", () => {
    render(<EmployeeContractsPage />);
    expect(screen.getAllByTitle("Ver contrato").length).toBe(5);
    expect(screen.getAllByTitle("Subir documento").length).toBe(5);
    expect(screen.getAllByTitle("Marcar avance").length).toBe(5);
  });
});
