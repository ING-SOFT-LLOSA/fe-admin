/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectForm from "./ProjectForm";
import type { ProyectoCreateDTO } from "@/modules/proyectos/types";

const mockValues: ProyectoCreateDTO = {
  nombre: "Proyecto Aurora",
  departamento: "Lima",
  distrito: "Miraflores",
  direccion: "Av. Los Olivos 123",
  fechaInicio: "2026-03-01",
  fechaFin: "2026-12-01",
  descripcion: "Edificio residencial",
  precertificacionEdgeLeed: false,
};

describe("ProjectForm", () => {
  it("muestra los valores iniciales", () => {
    render(
      <ProjectForm
        values={mockValues}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByDisplayValue("Proyecto Aurora")).toBeDefined();
    expect(screen.getByDisplayValue("Av. Los Olivos 123")).toBeDefined();
    expect(screen.getByDisplayValue("Lima")).toBeDefined();
    expect(screen.getByDisplayValue("Miraflores")).toBeDefined();
  });

  it("muestra el botón Guardar cambios", () => {
    render(
      <ProjectForm
        values={mockValues}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByText("Guardar cambios")).toBeDefined();
  });

  it("muestra Guardando... cuando isSaving es true", () => {
    render(
      <ProjectForm
        values={mockValues}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSaving={true}
      />
    );

    expect(screen.getByText("Guardando...")).toBeDefined();
    expect(screen.queryByText("Guardar cambios")).toBeNull();
  });

  it("llama a onChange al escribir en un campo", () => {
    const onChange = vi.fn();
    render(
      <ProjectForm
        values={mockValues}
        onChange={onChange}
        onSubmit={vi.fn()}
        isSaving={false}
      />
    );

    const input = screen.getByDisplayValue("Proyecto Aurora");
    fireEvent.change(input, { target: { value: "Nuevo nombre" } });
    expect(onChange).toHaveBeenCalledWith("nombre", "Nuevo nombre");
  });

  it("muestra error de validación al intentar guardar con campos vacíos", () => {
    const emptyValues: ProyectoCreateDTO = {
      ...mockValues,
      nombre: "",
      direccion: "",
      departamento: "",
      distrito: "",
    };

    render(
      <ProjectForm
        values={emptyValues}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSaving={false}
      />
    );

    fireEvent.click(screen.getByText("Guardar cambios"));
    expect(screen.getByText("El nombre del proyecto es obligatorio.")).toBeDefined();
  });

  it("llama a onSubmit cuando los datos son válidos", () => {
    const onSubmit = vi.fn();
    render(
      <ProjectForm
        values={mockValues}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        isSaving={false}
      />
    );

    fireEvent.click(screen.getByText("Guardar cambios"));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("el botón está deshabilitado cuando isSaving es true", () => {
    render(
      <ProjectForm
        values={mockValues}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSaving={true}
      />
    );

    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
