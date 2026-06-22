import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmployeeDashboardPage from '@/app/employee/dashboard/page';

describe("EmployeeDashboardPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders title and description with formatted date", () => {
    render(<EmployeeDashboardPage />);
    expect(screen.getByText("Mi Dashboard")).toBeDefined();
    expect(screen.getByText(/Resumen de tus tareas/)).toBeDefined();
    expect(screen.getByText(/viernes, 19 de junio/)).toBeDefined();
  });

  it("renders all 5 KPI cards with values and labels", () => {
    render(<EmployeeDashboardPage />);
    expect(screen.getByText("Clientes Asignados")).toBeDefined();
    expect(screen.getByText("34")).toBeDefined();
    expect(screen.getByText("Contratos Pendientes")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("Reuniones de Hoy")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("Seguimientos Vencidos")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
    expect(screen.getByText("Avances por Enviar")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
  });

  it("renders Nuevo Seguimiento button", () => {
    render(<EmployeeDashboardPage />);
    const btn = screen.getByText("Nuevo Seguimiento");
    expect(btn).toBeDefined();
  });

  it("renders the action list section", () => {
    render(<EmployeeDashboardPage />);
    expect(screen.getByText("Mis Próximas Acciones")).toBeDefined();
    expect(screen.getByText(/Tareas prioritarias/)).toBeDefined();
    expect(screen.getByText("5 pendientes")).toBeDefined();
  });

  it("renders all 5 action items with text and Resolver buttons", () => {
    render(<EmployeeDashboardPage />);
    expect(screen.getByText(/Llamar a cliente Carlos Ruiz/)).toBeDefined();
    expect(screen.getByText(/Revisar contrato de separación/)).toBeDefined();
    expect(screen.getByText(/Agendar firma con familia Gómez/)).toBeDefined();
    expect(screen.getByText(/Subir avance de obra/)).toBeDefined();
    expect(screen.getByText(/Confirmar recepción de documentos/)).toBeDefined();

    const resolveBtns = screen.getAllByText("Resolver");
    expect(resolveBtns.length).toBe(5);
  });
});
