import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmployeeTrackingPage from '@/app/employee/tracking/page';

describe("EmployeeTrackingPage", () => {
  it("renders title and description", () => {
    render(<EmployeeTrackingPage />);
    expect(screen.getByText("Centro de Seguimiento")).toBeDefined();
    expect(screen.getByText(/Alertas y notificaciones/)).toBeDefined();
  });

  it("renders filter pills with counts", () => {
    render(<EmployeeTrackingPage />);
    expect(screen.getByText("2 Prioridad Alta")).toBeDefined();
    expect(screen.getByText("Todas las alertas (5)")).toBeDefined();
  });

  it("renders all 5 alert cards", () => {
    render(<EmployeeTrackingPage />);
    expect(screen.getByText("Cliente sin contacto")).toBeDefined();
    expect(screen.getByText("Contrato pendiente")).toBeDefined();
    expect(screen.getByText("Documento faltante (DNI)")).toBeDefined();
    expect(screen.getByText("Avance de obra pendiente")).toBeDefined();
    expect(screen.getByText("Reunión próxima (Mañana)")).toBeDefined();
  });

  it("renders priority badges", () => {
    render(<EmployeeTrackingPage />);
    expect(screen.getAllByText("Alta").length).toBe(2);
    expect(screen.getAllByText("Media").length).toBe(2);
    expect(screen.getByText("Baja")).toBeDefined();
  });

  it("renders client and project info per alert", () => {
    render(<EmployeeTrackingPage />);
    expect(screen.getByText(/Carlos Ruiz/)).toBeDefined();
    expect(screen.getByText(/Familia Gómez/)).toBeDefined();
    expect(screen.getByText(/Ana Soto/)).toBeDefined();
    expect(screen.getByText(/Luis Vargas/)).toBeDefined();
    expect(screen.getAllByText(/Torre A/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Los Pinos/)).toBeDefined();
  });

  it("renders action buttons for each alert", () => {
    render(<EmployeeTrackingPage />);
    expect(screen.getByText("Llamar ahora")).toBeDefined();
    expect(screen.getByText("Revisar estado")).toBeDefined();
    expect(screen.getByText("Solicitar por correo")).toBeDefined();
    expect(screen.getByText("Subir fotos")).toBeDefined();
    expect(screen.getByText("Preparar documentos")).toBeDefined();
  });

  it("renders dismiss (close) buttons for each alert", () => {
    render(<EmployeeTrackingPage />);
    const closeBtns = screen.getAllByTitle("Descartar alerta");
    expect(closeBtns.length).toBe(5);
  });
});
