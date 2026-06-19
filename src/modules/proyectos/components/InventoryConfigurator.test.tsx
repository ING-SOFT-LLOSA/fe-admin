/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InventoryConfigurator from "./InventoryConfigurator";

const initialData = {
  numTorres: 2,
  pisosPorTorre: 5,
  depasPorPiso: 4,
  cocherasPorPiso: 2,
  depositosPorPiso: 1,
};

describe("InventoryConfigurator", () => {
  it("muestra los valores iniciales en los campos", () => {
    const { container } = render(
      <InventoryConfigurator
        initialData={initialData}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const torresInput = container.querySelector('input[name="numTorres"]') as HTMLInputElement;
    expect(torresInput).not.toBeNull();
    expect(torresInput.value).toBe("2");
    expect(screen.getByDisplayValue("5")).toBeDefined();
    expect(screen.getByDisplayValue("4")).toBeDefined();
  });

  it("muestra el resumen estimado", () => {
    render(
      <InventoryConfigurator
        initialData={initialData}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Resumen estimado")).toBeDefined();
    expect(screen.getByText("Unidades totales")).toBeDefined();
  });

  it("llama a onBack al hacer clic en Volver", () => {
    const onBack = vi.fn();
    render(
      <InventoryConfigurator
        initialData={initialData}
        onBack={onBack}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Volver"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("llama a onSubmit con la configuración al enviar el formulario", () => {
    const onSubmit = vi.fn();
    render(
      <InventoryConfigurator
        initialData={initialData}
        onBack={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByText("Siguiente paso"));
    expect(onSubmit).toHaveBeenCalledWith(initialData);
  });
});
