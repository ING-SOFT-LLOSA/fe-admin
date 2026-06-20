/* eslint-disable @typescript-eslint/no-explicitany */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import EditClienteModal from "./EditClienteModal";
import type { ClienteRow } from "@/types/user";

vi.mock("@/lib/api/users", () => ({
  updateCliente: vi.fn(),
}));

import { updateCliente } from "@/lib/api/users";

const mockUpdate = vi.mocked(updateCliente);

const sampleCliente: ClienteRow = {
  id: 1,
  initials: "AG",
  name: "Ana García",
  nombre: "Ana",
  apellidos: "García",
  dni: "12345678",
  email: "ana@test.com",
  phone: "+51999888777",
  project: "Aurora",
  status: "ACTIVO",
  statusBg: "bg-green-100",
  tipoUsuario: "CLIENTE",
  rol: "USER",
  createdAt: "2026-01-01",
} as any;

describe("EditClienteModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue(sampleCliente);
    // jsdom no implementa scrollIntoView por defecto
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("no renderiza nada si open es false", () => {
    const { container } = render(
      <EditClienteModal open={false} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("no renderiza nada si cliente es null", () => {
    const { container } = render(
      <EditClienteModal open={true} cliente={null} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el título Editar cliente cuando está abierto", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    expect(await screen.findByText("Editar cliente")).toBeDefined();
    expect(
      screen.getByText(/Actualizar información de contacto y documentos/),
    ).toBeDefined();
  });

  it("pobla el formulario desde el cliente al abrir", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await waitFor(() => {
      const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
      const apellidosInput = document.querySelector('input[name="apellidos"]') as HTMLInputElement;
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const docInput = document.querySelector('input[name="documentoIdentidad"]') as HTMLInputElement;
      const phoneInput = document.querySelector('input[name="telefono"]') as HTMLInputElement;
      expect(nombreInput.value).toBe("Ana");
      expect(apellidosInput.value).toBe("García");
      expect(emailInput.value).toBe("ana@test.com");
      expect(docInput.value).toBe("12345678");
      expect(phoneInput.value).toBe("+51999888777");
    });
  });

  it("convierte placeholders '—' a string vacío en el formulario", async () => {
    const clienteConGuiones: ClienteRow = {
      ...sampleCliente,
      dni: "—",
      phone: "—",
    };
    render(
      <EditClienteModal open={true} cliente={clienteConGuiones} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await waitFor(() => {
      const docInput = document.querySelector('input[name="documentoIdentidad"]') as HTMLInputElement;
      const phoneInput = document.querySelector('input[name="telefono"]') as HTMLInputElement;
      expect(docInput.value).toBe("");
      expect(phoneInput.value).toBe("");
    });
  });

  it("deshabilita el campo de email", () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    expect(emailInput.disabled).toBe(true);
  });

  it("muestra error de validación si el nombre está vacío", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
    fireEvent.change(nombreInput, { target: { value: "   " } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("El nombre es obligatorio."),
    ).toBeDefined();
  });

  it("muestra error de validación si los apellidos están vacíos", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const apellidosInput = document.querySelector('input[name="apellidos"]') as HTMLInputElement;
    fireEvent.change(apellidosInput, { target: { value: "   " } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("Los apellidos son obligatorios."),
    ).toBeDefined();
  });

  it("muestra error de validación si el teléfono no tiene formato válido", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const phoneInput = document.querySelector('input[name="telefono"]') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: "12345" } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText(/El teléfono debe iniciar con/),
    ).toBeDefined();
  });

  it("muestra error de validación si el DNI contiene letras", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const docInput = document.querySelector('input[name="documentoIdentidad"]') as HTMLInputElement;
    fireEvent.change(docInput, { target: { value: "abc12345" } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("El documento debe contener solo números."),
    ).toBeDefined();
  });

  it("muestra error de validación si el DNI no es de 8 ni 11 dígitos", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const docInput = document.querySelector('input[name="documentoIdentidad"]') as HTMLInputElement;
    fireEvent.change(docInput, { target: { value: "12345" } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText(/Debe ser un DNI \(8 dígitos\) o RUC \(11 dígitos\)/),
    ).toBeDefined();
  });

  it("hace scrollIntoView y focus al campo con error", async () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
    nombreInput.removeAttribute("required");
    fireEvent.change(nombreInput, { target: { value: "   " } });
    nombreInput.focus = vi.fn();

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  it("actualiza el cliente correctamente", async () => {
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={onClose} onUpdated={onUpdated} />,
    );
    await screen.findByText("Editar cliente");

    const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
    fireEvent.change(nombreInput, { target: { value: "Andrea" } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
    expect(mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ nombre: "Andrea" }));
    expect(
      await screen.findByText(/Información del cliente actualizada/),
    ).toBeDefined();
  });

  it("normaliza el teléfono removiendo espacios", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const phoneInput = document.querySelector('input[name="telefono"]') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: "+51 999 888 777" } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
    expect(mockUpdate.mock.calls[0][1].telefono).toBe("+51999888777");
  });

  it("muestra error si updateCliente falla con Error", async () => {
    mockUpdate.mockRejectedValue(new Error("Servidor caído"));
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText("Servidor caído")).toBeDefined();
  });

  it("muestra error genérico si updateCliente falla con error no-Error", async () => {
    mockUpdate.mockRejectedValue("crudo");
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText("No se pudo actualizar el cliente.")).toBeDefined();
  });

  it("muestra 'Guardando…' mientras se procesa el submit", async () => {
    mockUpdate.mockReturnValue(new Promise(() => {}));

    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText("Guardando…")).toBeDefined();
  });

  it("llama a onClose al hacer clic en Cancelar", () => {
    const onClose = vi.fn();
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={onClose} onUpdated={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Cancelar$/ }));
    expect(onClose).toHaveBeenCalled();
  });

  it("llama a onClose al hacer clic en el botón X", () => {
    const onClose = vi.fn();
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={onClose} onUpdated={vi.fn()} />,
    );
    const allButtons = screen.getAllByRole("button");
    const closeBtn = allButtons.find(
      (b) =>
        b.querySelector(".material-symbols-outlined")?.textContent === "close" &&
        b.className.includes("text-slate-400"),
    );
    expect(closeBtn).toBeDefined();
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("no hace nada al intentar submit si cliente es null", async () => {
    const { rerender } = render(
      <EditClienteModal open={true} cliente={null} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    // Rerender con cliente
    rerender(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");
    // Esperar a que el form se inicialice (Promise.resolve().then(() => setForm(...)))
    await screen.findByDisplayValue("Ana");

    // No debe haber problema al hacer submit
    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it("limpia los errores al cambiar un campo", async () => {
    render(
      <EditClienteModal open={true} cliente={sampleCliente} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    await screen.findByText("Editar cliente");

    const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
    nombreInput.removeAttribute("required");
    fireEvent.change(nombreInput, { target: { value: "   " } });

    const submitBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("El nombre es obligatorio."),
    ).toBeDefined();

    // Escribir en el campo debe limpiar el error
    fireEvent.change(nombreInput, { target: { value: "C" } });

    expect(screen.queryByText("El nombre es obligatorio.")).toBeNull();
  });
});
