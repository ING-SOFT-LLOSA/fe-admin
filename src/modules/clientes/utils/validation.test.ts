import { describe, it, expect } from "vitest";
import { validateClienteForm } from "./validation";

describe("validateClienteForm", () => {
  it("retorna errores si nombre o apellidos están vacíos", () => {
    const errors = validateClienteForm({ nombre: "", apellidos: "", email: "" });
    expect(errors.nombre).toBe("El nombre es obligatorio.");
    expect(errors.apellidos).toBe("Los apellidos son obligatorios.");
  });

  it("valida email obligatorio si se solicita", () => {
    const errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", email: "" }, true);
    expect(errors.email).toBe("El correo electrónico es obligatorio.");
  });

  it("no valida email obligatorio por defecto", () => {
    // Omitting second argument to cover default parameter validateEmail = false
    const errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", email: "" });
    expect(errors.email).toBeUndefined();
  });

  it("valida formato de teléfono peruano", () => {
    let errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", telefono: "999888777" });
    expect(errors.telefono).toBeDefined();

    errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", telefono: "+51 999 888 777" });
    expect(errors.telefono).toBeUndefined();
  });

  it("valida formato de DNI y RUC", () => {
    let errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", documentoIdentidad: "abc" });
    expect(errors.documentoIdentidad).toBe("El documento debe contener solo números.");

    errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", documentoIdentidad: "12345" });
    expect(errors.documentoIdentidad).toBe("Debe ser un DNI (8 dígitos) o RUC (11 dígitos).");

    errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", documentoIdentidad: "12345678" });
    expect(errors.documentoIdentidad).toBeUndefined();

    errors = validateClienteForm({ nombre: "Carlos", apellidos: "Ruiz", documentoIdentidad: "12345678901" });
    expect(errors.documentoIdentidad).toBeUndefined();
  });
});
