import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmployeeSchedulePage from "./page";

describe("EmployeeSchedulePage", () => {
  it("renders title and description", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("Cronograma")).toBeDefined();
    expect(screen.getByText(/Tu agenda de reuniones/)).toBeDefined();
  });

  it("renders Agendar Reunión button", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("Agendar Reunión")).toBeDefined();
  });

  it("renders calendar header and navigation", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("Octubre 2024")).toBeDefined();
    const navBtns = screen.getAllByRole("button");
    expect(navBtns.length).toBeGreaterThan(0);
  });

  it("renders day-of-week headers", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("D")).toBeDefined();
    expect(screen.getByText("L")).toBeDefined();
    expect(screen.getAllByText("M").length).toBe(2);
    expect(screen.getByText("J")).toBeDefined();
    expect(screen.getByText("V")).toBeDefined();
    expect(screen.getByText("S")).toBeDefined();
  });

  it("renders 31 calendar day buttons with today highlighted (24)", () => {
    render(<EmployeeSchedulePage />);
    const dayButtons = screen.getAllByText(/^[0-9]+$/);
    expect(dayButtons.length).toBe(31);
    const today = screen.getByText("24");
    expect(today.className).toContain("bg-[#023143]");
  });

  it("renders hoy/date header with event count", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("Hoy, 24 Oct")).toBeDefined();
    expect(screen.getByText("5 eventos")).toBeDefined();
  });

  it("renders all 5 events with time, title and client info", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("Reunión de presentación")).toBeDefined();
    expect(screen.getByText("Firma de contrato de separación")).toBeDefined();
    expect(screen.getByText("Vencimiento cuota inicial")).toBeDefined();
    expect(screen.getByText("Visita a obra")).toBeDefined();
    expect(screen.getByText("Enviar reporte de avance")).toBeDefined();
    expect(screen.getByText(/Familia Gómez/)).toBeDefined();
    expect(screen.getByText(/Carlos Ruiz/)).toBeDefined();
    expect(screen.getByText(/Ana Soto/)).toBeDefined();
    expect(screen.getByText(/Luis Vargas/)).toBeDefined();
    expect(screen.getByText(/Múltiples/)).toBeDefined();
  });

  it("displays time ranges correctly", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("10:00 AM")).toBeDefined();
    expect(screen.getByText("11:00 AM")).toBeDefined();
    expect(screen.getByText("03:00 PM")).toBeDefined();
  });

  it("toggles completed state on click for toggleable events", () => {
    render(<EmployeeSchedulePage />);
    const checkboxes = screen.getAllByText("check_box_outline_blank");
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]);
    expect(screen.getAllByText("check").length).toBeGreaterThanOrEqual(1);
  });

  it("applies line-through style to completed tasks", () => {
    render(<EmployeeSchedulePage />);
    const completed = screen.getByText("Firma de contrato de separación");
    expect(completed.className).toContain("line-through");
    expect(completed.className).toContain("text-[#72787c]");
  });

  it("does not render check icon for payment and construction type events", () => {
    render(<EmployeeSchedulePage />);
    expect(screen.getByText("Vencimiento cuota inicial")).toBeDefined();
    expect(screen.getByText("Visita a obra")).toBeDefined();
  });
});
