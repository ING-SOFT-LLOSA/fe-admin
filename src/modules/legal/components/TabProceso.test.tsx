/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabProceso } from "./TabProceso";
import type { ProcesoEtapa } from "./constants";

function makeHito(overrides: Partial<ProcesoEtapa> = {}): ProcesoEtapa {
  return {
    id: "h-1",
    uuidHito: "h-uuid-1",
    label: "Proforma",
    etapaProceso: "SEPARACION",
    orden: 1,
    estado: "pendiente",
    icon: "description",
    comentarios: "",
    fechaInicio: "2026-01-01",
    fechaFin: undefined,
    ...overrides,
  };
}

describe("TabProceso", () => {
  const mockUpdateHito = vi.fn();

  it("muestra las etapas agrupadas con encabezados", () => {
    const etapas = [
      makeHito({ id: "h-1", etapaProceso: "SEPARACION", label: "Proforma", estado: "completado" }),
      makeHito({ id: "h-2", etapaProceso: "CONTRATO", label: "Firma de contrato", estado: "pendiente" }),
    ];

    render(
      <TabProceso
        etapas={etapas}
        loadingStepper={false}
        canEdit={false}
        onUpdateHito={mockUpdateHito}
      />
    );

    expect(screen.getByText("Separación")).toBeDefined();
    expect(screen.getByText("Contrato")).toBeDefined();
    expect(screen.getByText("Proforma")).toBeDefined();
    expect(screen.getByText("Firma de contrato")).toBeDefined();
  });

  it("muestra el badge de estado correcto para hitos completados", () => {
    const etapas = [
      makeHito({ id: "h-1", estado: "completado", label: "Proforma" }),
    ];

    render(
      <TabProceso
        etapas={etapas}
        loadingStepper={false}
        canEdit={false}
        onUpdateHito={mockUpdateHito}
      />
    );

    expect(screen.getByText("Completado")).toBeDefined();
  });

  it("muestra select de estado cuando canEdit es true", () => {
    const etapas = [
      makeHito({ id: "h-1", uuidHito: "uuid-real", estado: "pendiente" }),
    ];

    render(
      <TabProceso
        etapas={etapas}
        loadingStepper={false}
        canEdit={true}
        onUpdateHito={mockUpdateHito}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeDefined();
  });

  it("llama a onUpdateHito al cambiar el select", () => {
    mockUpdateHito.mockResolvedValue(undefined);
    const etapas = [
      makeHito({ id: "h-1", uuidHito: "uuid-real", estado: "pendiente" }),
    ];

    render(
      <TabProceso
        etapas={etapas}
        loadingStepper={false}
        canEdit={true}
        onUpdateHito={mockUpdateHito}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "COMPLETADO" } });
    expect(mockUpdateHito).toHaveBeenCalledWith("uuid-real", "COMPLETADO");
  });

  it("deshabilita el select cuando loadingStepper es true", () => {
    const etapas = [
      makeHito({ id: "h-1", uuidHito: "uuid-real", estado: "pendiente" }),
    ];

    render(
      <TabProceso
        etapas={etapas}
        loadingStepper={true}
        canEdit={true}
        onUpdateHito={mockUpdateHito}
      />
    );

    const select = screen.getByRole("combobox");
    expect((select as HTMLSelectElement).disabled).toBe(true);
  });

  it("no muestra select cuando canEdit es false", () => {
    const etapas = [
      makeHito({ id: "h-1", uuidHito: "uuid-real", estado: "pendiente" }),
    ];

    render(
      <TabProceso
        etapas={etapas}
        loadingStepper={false}
        canEdit={false}
        onUpdateHito={mockUpdateHito}
      />
    );

    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("muestra comentarios cuando están presentes", () => {
    const etapas = [
      makeHito({ id: "h-1", estado: "completado", comentarios: "Enviado y firmado por el cliente" }),
    ];

    render(
      <TabProceso
        etapas={etapas}
        loadingStepper={false}
        canEdit={false}
        onUpdateHito={mockUpdateHito}
      />
    );

    expect(screen.getByText("Enviado y firmado por el cliente")).toBeDefined();
  });
});
