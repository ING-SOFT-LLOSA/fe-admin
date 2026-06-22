import { describe, it, expect } from "vitest";
import { validateProjectForm } from '@/modules/proyectos/utils/validation';

describe("validateProjectForm", () => {
  it("valida que los campos obligatorios estén presentes y correctos", () => {
    let errors = validateProjectForm({ nombre: "", direccion: "", departamento: "", distrito: "" });
    expect(errors.nombre).toBe("El nombre del proyecto es obligatorio.");
    expect(errors.direccion).toBe("La dirección es obligatoria.");
    expect(errors.departamento).toBe("El departamento es obligatorio.");
    expect(errors.distrito).toBe("El distrito es obligatorio.");

    errors = validateProjectForm({ nombre: "Ed", direccion: "Calle 1", departamento: "Lima", distrito: "Miraflores" });
    expect(errors.nombre).toBe("El nombre debe tener al menos 3 caracteres.");
  });

  it("valida el rango de fechas de inicio y fin", () => {
    let errors = validateProjectForm({
      nombre: "Proyecto A",
      direccion: "Calle 1",
      departamento: "Lima",
      distrito: "Miraflores",
      fechaInicio: "2026-01-10",
      fechaFin: "2026-01-05", // Fin antes del inicio
    });
    expect(errors.fechaFin).toBe("La fecha de fin no puede ser anterior a la fecha de inicio.");

    errors = validateProjectForm({
      nombre: "Proyecto A",
      direccion: "Calle 1",
      departamento: "Lima",
      distrito: "Miraflores",
      fechaInicio: "2026-01-10",
      fechaFin: "2026-01-20", // Correcto
    });
    expect(errors.fechaFin).toBeUndefined();
  });
});
