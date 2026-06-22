import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmployeeClientsPage from '@/app/employee/clients/page';

describe("EmployeeClientsPage", () => {
  it("renders title and description", () => {
    render(<EmployeeClientsPage />);
    expect(screen.getByText("Mis Clientes")).toBeDefined();
    expect(screen.getByText(/Directorio de clientes/)).toBeDefined();
  });

  it("renders search input", () => {
    render(<EmployeeClientsPage />);
    expect(screen.getByPlaceholderText("Buscar cliente...")).toBeDefined();
  });

  it("renders table headers", () => {
    render(<EmployeeClientsPage />);
    expect(screen.getByText("Cliente")).toBeDefined();
    expect(screen.getByText("Proyecto")).toBeDefined();
    expect(screen.getByText("Departamento")).toBeDefined();
    expect(screen.getByText("Estado")).toBeDefined();
    expect(screen.getByText("Última Interacción")).toBeDefined();
    expect(screen.getByText("Próxima Acción")).toBeDefined();
  });

  it("renders all 5 clients in table body", () => {
    render(<EmployeeClientsPage />);
    expect(screen.getByText("Carlos Ruiz")).toBeDefined();
    expect(screen.getByText("Familia Gómez")).toBeDefined();
    expect(screen.getByText("Ana Soto")).toBeDefined();
    expect(screen.getByText("Luis Vargas")).toBeDefined();
    expect(screen.getByText("Empresa XYZ")).toBeDefined();
  });

  it("renders project and apt for each client", () => {
    render(<EmployeeClientsPage />);
    expect(screen.getAllByText("Torre A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("402")).toBeDefined();
    expect(screen.getByText("Los Pinos")).toBeDefined();
    expect(screen.getAllByText("Edificio Central").length).toBe(2);
  });

  it("renders state badges for each client", () => {
    render(<EmployeeClientsPage />);
    expect(screen.getByText("Firma pendiente")).toBeDefined();
    expect(screen.getByText("Separación pagada")).toBeDefined();
    expect(screen.getByText("Interesado")).toBeDefined();
    expect(screen.getByText("En seguimiento de obra")).toBeDefined();
    expect(screen.getByText("Contrato generado")).toBeDefined();
  });

  it("renders last interaction and next action columns", () => {
    render(<EmployeeClientsPage />);
    expect(screen.getByText("Hace 2 días")).toBeDefined();
    expect(screen.getByText("Llamar para confirmar firma")).toBeDefined();
    expect(screen.getByText("Enviar fotos de avance")).toBeDefined();
  });

  it("renders visibility buttons for each row", () => {
    render(<EmployeeClientsPage />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);
  });
});
