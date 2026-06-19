/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NewProjectWizard from "./NewProjectWizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("./GeneralDataForm", () => ({
  default: ({ onSubmit, onCancel }: any) => (
    <div data-testid="general-form">
      <button onClick={() => onSubmit({ nombre: "Test" })}>Next</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("./InventoryConfigurator", () => ({
  default: ({ onSubmit, onBack }: any) => (
    <div data-testid="inventory-form">
      <button onClick={() => onSubmit({ numTorres: 1, pisosPorTorre: 5, depasPorPiso: 4, cocherasPorPiso: 2, depositosPorPiso: 1 })}>
        Next
      </button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock("./UnitEditorStep", () => ({
  default: ({ onSubmit, onBack }: any) => (
    <div data-testid="unit-editor">
      <button onClick={() => onSubmit([])}>Create</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock("./LoadingOverlay", () => ({
  default: ({ message }: any) => <div data-testid="loading">{message}</div>,
}));

vi.mock("@/modules/proyectos/utils/api-client", () => ({
  createProject: vi.fn(),
  createInventory: vi.fn(),
  generateEstructura: vi.fn(() => []),
}));

describe("NewProjectWizard", () => {
  it("empieza en el paso de Datos Generales", () => {
    render(<NewProjectWizard />);
    expect(screen.getByTestId("general-form")).toBeDefined();
  });

  it("muestra los 3 pasos en el breadcrumb", () => {
    render(<NewProjectWizard />);
    expect(screen.getByText("Datos generales")).toBeDefined();
    expect(screen.getByText("Inventario")).toBeDefined();
    expect(screen.getByText("Editar unidades")).toBeDefined();
  });

  it("avanza al paso de Inventario después de GeneralData", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("inventory-form")).toBeDefined();
  });

  it("avanza al paso de UnitEditor después de Inventario", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next")); // General -> Inventory
    fireEvent.click(screen.getByText("Next")); // Inventory -> UnitEditor
    expect(screen.getByTestId("unit-editor")).toBeDefined();
  });

  it("puede volver atrás desde Inventario a General", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next")); // General -> Inventory
    fireEvent.click(screen.getByText("Back")); // Inventory -> General
    expect(screen.getByTestId("general-form")).toBeDefined();
  });
});
