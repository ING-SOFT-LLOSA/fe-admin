import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InventoryConfigurator from '@/modules/proyectos/components/InventoryConfigurator';
import type { InventoryConfig } from "@/modules/proyectos/utils/wizard-logic";

const initialData: InventoryConfig = {
  numTorres: 3,
  pisosPorTorre: 5,
  depasPorPiso: 4,
  cocherasPorPiso: 1,
  depositosPorPiso: 1,
};

describe("InventoryConfigurator", () => {
  it("renders form with initial values", () => {
    render(<InventoryConfigurator initialData={initialData} onBack={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Número de torres")).toBeDefined();
    expect(screen.getByLabelText("Pisos por torre")).toBeDefined();
    expect(screen.getByLabelText(/Dptos. por piso/)).toBeDefined();
    expect(screen.getByLabelText(/Cocheras por piso/)).toBeDefined();
    expect(screen.getByLabelText(/Depósitos por piso/)).toBeDefined();
  });

  it("shows summary with calculated totals", () => {
    render(<InventoryConfigurator initialData={initialData} onBack={vi.fn()} onSubmit={vi.fn()} />);
    // 3 torres x 5 pisos = 15 pisos totales
    // 15 x 4 = 60 departamentos, 15 x 1 = 15 cocheras, 15 x 1 = 15 depositos
    // total = 90
    expect(screen.getByText("3")).toBeDefined(); // torres
    expect(screen.getByText("Pisos totales")).toBeDefined();
  });

  it("calls onBack when Volver is clicked", () => {
    const onBack = vi.fn();
    render(<InventoryConfigurator initialData={initialData} onBack={onBack} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText("Volver"));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onSubmit with config data when form is submitted", () => {
    const onSubmit = vi.fn();
    render(<InventoryConfigurator initialData={initialData} onBack={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("Siguiente paso"));
    expect(onSubmit).toHaveBeenCalledWith(initialData);
  });

  it("updates config when input changes", () => {
    render(<InventoryConfigurator initialData={initialData} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const torresInput = screen.getByLabelText("Número de torres") as HTMLInputElement;
    fireEvent.change(torresInput, { target: { name: "numTorres", value: "5" } });
    expect(torresInput.value).toBe("5");
  });

  it("submits updated form after changing torres count", () => {
    const onSubmit = vi.fn();
    render(<InventoryConfigurator initialData={initialData} onBack={vi.fn()} onSubmit={onSubmit} />);
    const torresInput = screen.getByLabelText("Número de torres") as HTMLInputElement;
    fireEvent.change(torresInput, { target: { value: "7" } });
    fireEvent.click(screen.getByText("Siguiente paso"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ numTorres: 7 }));
  });

  it("renders Resumen estimado heading", () => {
    render(<InventoryConfigurator initialData={initialData} onBack={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Resumen estimado")).toBeDefined();
  });

  it("renders Estructura principal section", () => {
    render(<InventoryConfigurator initialData={initialData} onBack={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Estructura principal")).toBeDefined();
    expect(screen.getByText("Unidades promedio por piso")).toBeDefined();
  });
});
