/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GeneralDataForm from '@/modules/proyectos/components/GeneralDataForm';
import type { ProjectFormData } from "@/modules/proyectos/utils/wizard-logic";

const mockInitialData: ProjectFormData = {
  nombre: "Proyecto Test",
  direccion: "Av. Siempre Viva 742",
  departamento: "Lima",
  distrito: "Miraflores",
  fechaInicio: "2026-01-01",
  fechaFin: "2026-12-31",
  descripcion: "Un proyecto de prueba",
  precertificacionEdgeLeed: false,
};

describe("GeneralDataForm", () => {
  it("muestra los valores iniciales en los campos", () => {
    render(
      <GeneralDataForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("Proyecto Test")).toBeDefined();
    expect(screen.getByDisplayValue("Av. Siempre Viva 742")).toBeDefined();
    expect(screen.getByDisplayValue("Lima")).toBeDefined();
    expect(screen.getByDisplayValue("Miraflores")).toBeDefined();
  });

  it("llama a onSubmit con los datos al enviar formulario válido", () => {
    const onSubmit = vi.fn();
    render(
      <GeneralDataForm
        initialData={mockInitialData}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Siguiente paso"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Proyecto Test",
        direccion: "Av. Siempre Viva 742",
      })
    );
  });

  it("llama a onCancel al hacer clic en Cancelar", () => {
    const onCancel = vi.fn();
    render(
      <GeneralDataForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("muestra errores de validación al enviar formulario vacío", () => {
    const emptyData: ProjectFormData = {
      ...mockInitialData,
      nombre: "",
      direccion: "",
      departamento: "",
      distrito: "",
    };

    render(
      <GeneralDataForm
        initialData={emptyData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Siguiente paso"));
    expect(screen.getByText("El nombre del proyecto es obligatorio.")).toBeDefined();
    expect(screen.getByText("La dirección es obligatoria.")).toBeDefined();
  });

  it("muestra error si el nombre tiene menos de 3 caracteres", () => {
    const shortNameData: ProjectFormData = {
      ...mockInitialData,
      nombre: "AB",
    };

    render(
      <GeneralDataForm
        initialData={shortNameData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Siguiente paso"));
    expect(screen.getByText("El nombre debe tener al menos 3 caracteres.")).toBeDefined();
  });

  it("muestra error si fecha fin es anterior a fecha inicio", () => {
    const badDateData: ProjectFormData = {
      ...mockInitialData,
      fechaInicio: "2026-12-31",
      fechaFin: "2026-01-01",
    };

    render(
      <GeneralDataForm
        initialData={badDateData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Siguiente paso"));
    expect(screen.getByText("La fecha de fin debe ser posterior a la fecha de inicio.")).toBeDefined();
  });

  it("muestra el checkbox de precertificación", () => {
    render(
      <GeneralDataForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Precertificación EDGE \/ LEED/i)).toBeDefined();
  });
});
