import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmployeeProgressPage from '@/app/employee/progress/page';

describe("EmployeeProgressPage", () => {
  it("renders title and description", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getByText("Avances de Obra")).toBeDefined();
    expect(screen.getByText(/Sube fotos y videos/)).toBeDefined();
  });

  it("renders the New Advance form section", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getByText("Nuevo Avance")).toBeDefined();
    expect(screen.getByPlaceholderText("Ej. Vaciado de cimientos")).toBeDefined();
    expect(screen.getByText("Guardar Borrador")).toBeDefined();
  });

  it("renders form labels", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getByText("Título del avance")).toBeDefined();
    expect(screen.getByText("Proyecto")).toBeDefined();
    expect(screen.getByText("Etapa / Hito")).toBeDefined();
    expect(screen.getByText("Descripción")).toBeDefined();
    expect(screen.getByText("Archivos multimedia")).toBeDefined();
  });

  it("renders project and stage selects with options", () => {
    render(<EmployeeProgressPage />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(2);
    expect(screen.getByText("Torre A")).toBeDefined();
    expect(screen.getByText("Edificio Central")).toBeDefined();
    expect(screen.getByText("Estructura")).toBeDefined();
    expect(screen.getByText("Acabados")).toBeDefined();
  });

  it("renders file upload area", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getByText("Haz clic para subir")).toBeDefined();
    expect(screen.getByText(/Fotos \(JPG\/PNG\) o Videos \(MP4\)/)).toBeDefined();
  });

  it("renders advance history section", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getByText("Historial de Avances")).toBeDefined();
    expect(screen.getByText("Todos")).toBeDefined();
    expect(screen.getByText("Borradores")).toBeDefined();
  });

  it("renders all 4 advance entries with state badges", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getByText("Vaciado de losa 4to piso")).toBeDefined();
    expect(screen.getByText("Instalación de drywall interiores")).toBeDefined();
    expect(screen.getByText("Excavación profunda terminada")).toBeDefined();
    expect(screen.getByText("Pintura fachada oeste")).toBeDefined();

    expect(screen.getByText("Borrador")).toBeDefined();
    expect(screen.getByText("Listo para enviar")).toBeDefined();
    expect(screen.getByText("Enviado")).toBeDefined();
    expect(screen.getByText("Visto por cliente")).toBeDefined();
  });

  it("renders stage/project and date for each entry", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getByText("Torre A • Estructura")).toBeDefined();
    expect(screen.getByText("Torre A • Acabados")).toBeDefined();
    expect(screen.getByText("Edificio Central • Cimentación")).toBeDefined();
    expect(screen.getByText("Los Pinos • Acabados Exteriores")).toBeDefined();
  });

  it("renders conditional buttons based on state (Borrador/Listo has Edit+Enviar, others have Ver detalle)", () => {
    render(<EmployeeProgressPage />);
    expect(screen.getAllByText("Editar").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Enviar a clientes").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ver detalle").length).toBeGreaterThanOrEqual(1);
  });
});
