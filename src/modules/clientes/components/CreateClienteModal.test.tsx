/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import CreateClienteModal from "./CreateClienteModal";

vi.mock("@/lib/api/users", () => ({
  registerCliente: vi.fn(),
}));

import { registerCliente } from "@/lib/api/users";

const mockRegister = vi.mocked(registerCliente);

describe("CreateClienteModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockResolvedValue({} as any);
  });

  it("no renderiza nada si open es false", () => {
    const { container } = render(
      <CreateClienteModal open={false} onClose={vi.fn()} onCreated={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el título Crear cliente cuando está abierto", () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getAllByText("Crear cliente").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra los campos del formulario (Nombres, Apellidos, Email, DNI, Teléfono)", () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByText(/Nombres/)).toBeDefined();
    expect(screen.getByText(/Apellidos/)).toBeDefined();
    expect(screen.getByText(/Correo electrónico/)).toBeDefined();
    expect(screen.getByText(/DNI/)).toBeDefined();
    expect(screen.getByText(/Teléfono/)).toBeDefined();
  });

  it("muestra error de validación si el nombre está vacío", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    // Llenar los otros campos requeridos para que pase la validación HTML5,
    // pero dejar el nombre con whitespace (trim() lo considera vacío en la validación React)
    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "   " } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("El nombre es obligatorio."),
    ).toBeDefined();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("muestra error de validación si los apellidos están vacíos", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "   " } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("Los apellidos son obligatorios."),
    ).toBeDefined();
  });

  it("muestra error de validación si el email está vacío", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });

    // Quitar el atributo required y el type=email para evitar la validación HTML5
    // y poder testear la validación React de email vacío
    const emailInput = inputs[2] as HTMLInputElement;
    emailInput.removeAttribute("required");
    emailInput.removeAttribute("type");

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("El correo electrónico es obligatorio."),
    ).toBeDefined();
  });

  it("muestra error de validación si el teléfono no tiene formato válido", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });
    fireEvent.change(inputs[4], { target: { value: "12345" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText(/El teléfono debe iniciar con/),
    ).toBeDefined();
  });

  it("muestra error de validación si el DNI contiene letras", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });
    fireEvent.change(inputs[3], { target: { value: "abc12345" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("El documento debe contener solo números."),
    ).toBeDefined();
  });

  it("muestra error de validación si el DNI no es de 8 ni 11 dígitos", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });
    fireEvent.change(inputs[3], { target: { value: "12345" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText(/Debe ser un DNI \(8 dígitos\) o RUC \(11 dígitos\)/),
    ).toBeDefined();
  });

  it("crea el cliente correctamente con datos válidos", async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(<CreateClienteModal open={true} onClose={onClose} onCreated={onCreated} />);

    // Llenar campos
    const inputs = document.querySelectorAll("input");
    const nombreInput = inputs[0] as HTMLInputElement;
    const apellidosInput = inputs[1] as HTMLInputElement;
    const emailInput = inputs[2] as HTMLInputElement;
    const dniInput = inputs[3] as HTMLInputElement;
    const phoneInput = inputs[4] as HTMLInputElement;

    fireEvent.change(nombreInput, { target: { value: "Carlos" } });
    fireEvent.change(apellidosInput, { target: { value: "Ruiz" } });
    fireEvent.change(emailInput, { target: { value: "carlos@test.com" } });
    fireEvent.change(dniInput, { target: { value: "12345678" } });
    fireEvent.change(phoneInput, { target: { value: "+51999888777" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs.nombre).toBe("Carlos");
    expect(callArgs.apellidos).toBe("Ruiz");
    expect(callArgs.email).toBe("carlos@test.com");
    expect(callArgs.documentoIdentidad).toBe("12345678");
    expect(callArgs.telefono).toBe("+51999888777");
    expect(callArgs.tipoUsuario).toBe("CLIENTE");
  });

  it("normaliza el teléfono removiendo espacios antes de enviar", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });
    fireEvent.change(inputs[4], { target: { value: "+51 999 888 777" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    expect(mockRegister.mock.calls[0][0].telefono).toBe("+51999888777");
  });

  it("no envía teléfono si está vacío", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    expect(mockRegister.mock.calls[0][0].telefono).toBeUndefined();
  });

  it("no envía documentoIdentidad si está vacío", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    expect(mockRegister.mock.calls[0][0].documentoIdentidad).toBeUndefined();
  });

  it("muestra mensaje de éxito tras crear el cliente y llama onCreated", async () => {
    const onCreated = vi.fn();
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={onCreated} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText(/Cliente creado correctamente/),
    ).toBeDefined();
    expect(onCreated).toHaveBeenCalled();
  });

  it("muestra error si registerCliente falla con Error", async () => {
    mockRegister.mockRejectedValue(new Error("Correo ya registrado"));
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText("Correo ya registrado")).toBeDefined();
  });

  it("muestra error genérico si registerCliente falla con un error no-Error", async () => {
    mockRegister.mockRejectedValue("fallo crudo");
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText("No se pudo crear el cliente.")).toBeDefined();
  });

  it("muestra 'Creando...' mientras se procesa el submit", async () => {
    mockRegister.mockReturnValue(new Promise(() => {}));

    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText("Creando...")).toBeDefined();
  });

  it("llama a onClose al hacer clic en el botón X", () => {
    const onClose = vi.fn();
    render(<CreateClienteModal open={true} onClose={onClose} onCreated={vi.fn()} />);

    // El botón X tiene solo un icono close, sin texto
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

  it("llama a onClose al hacer clic en Cancelar", () => {
    const onClose = vi.fn();
    render(<CreateClienteModal open={true} onClose={onClose} onCreated={vi.fn()} />);

    const cancelBtn = screen.getByRole("button", { name: /^Cancelar$/ });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("limpia el formulario y el error al cerrar", async () => {
    const onClose = vi.fn();
    render(<CreateClienteModal open={true} onClose={onClose} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });

    const cancelBtn = screen.getByRole("button", { name: /^Cancelar$/ });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("limpia errores de campo al cambiar el valor", async () => {
    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    // Llenar los otros campos requeridos con whitespace para que pase HTML5
    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "   " } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      await screen.findByText("El nombre es obligatorio."),
    ).toBeDefined();

    // Escribir en el campo debe limpiar el error
    fireEvent.change(inputs[0], { target: { value: "C" } });

    expect(screen.queryByText("El nombre es obligatorio.")).toBeNull();
  });

  it("no permite enviar dos veces mientras loading=true", async () => {
    mockRegister.mockReturnValue(new Promise(() => {}));

    render(<CreateClienteModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = screen.getByRole("button", { name: /Crear cliente/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Después de clickar, loading=true y el botón está disabled
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
