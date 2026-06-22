/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, fireEvent, screen } from "@testing-library/react";
import NewClientPage from '@/app/(admin)/clientes/new/page';

vi.mock("@/lib/api/users", () => ({
  registerCliente: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { registerCliente } from "@/lib/api/users";
import { useRouter } from "next/navigation";

const mockRegister = vi.mocked(registerCliente);
const mockUseRouter = vi.mocked(useRouter);

describe("NewClientPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
    mockRegister.mockResolvedValue({ id: 1 } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el título y subtítulo del wizard", () => {
    render(<NewClientPage />);
    expect(document.body.textContent).toContain("Nuevo");
    expect(document.body.textContent).toContain("cliente");
  });

  it("muestra el título del formulario Crear nuevo cliente", () => {
    render(<NewClientPage />);
    expect(document.body.textContent).toContain("Crear nuevo cliente");
  });

  it("muestra el panel lateral con info cards", () => {
    render(<NewClientPage />);
    expect(document.body.textContent).toContain("Se enviará un correo de activación al cliente");
    expect(document.body.textContent).toContain("El cliente creará su propia contraseña");
    expect(document.body.textContent).toContain("Acceso inmediato tras la activación");
  });

  it("tiene link Volver a clientes hacia /clientes", () => {
    render(<NewClientPage />);
    const links = document.querySelectorAll("a[href='/clientes']");
    expect(links.length).toBeGreaterThan(0);
  });

  it("tiene el botón Cancelar que apunta a /clientes", () => {
    render(<NewClientPage />);
    const cancelLinks = document.querySelectorAll("a[href='/clientes']");
    expect(cancelLinks.length).toBeGreaterThan(0);
  });

  it("llama a registerCliente al hacer submit con datos válidos", async () => {
    render(<NewClientPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Carlos" } });
    fireEvent.change(inputs[1], { target: { value: "Ruiz" } });
    fireEvent.change(inputs[2], { target: { value: "carlos@test.com" } });
    fireEvent.change(inputs[3], { target: { value: "+51 999 888 777" } });
    fireEvent.change(inputs[4], { target: { value: "12345678" } });

    const submitBtn = document.querySelector("button[type='submit']") as HTMLButtonElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs.nombre).toBe("Carlos");
    expect(callArgs.apellidos).toBe("Ruiz");
    expect(callArgs.email).toBe("carlos@test.com");
    expect(callArgs.tipoUsuario).toBe("CLIENTE");
  });

  it("muestra mensaje de éxito tras crear el cliente", async () => {
    render(<NewClientPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = document.querySelector("button[type='submit']") as HTMLButtonElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(document.body.textContent).toContain("Cliente creado exitosamente.");
    });
  });

  it("muestra error si registerCliente falla con Error", async () => {
    mockRegister.mockRejectedValue(new Error("Email duplicado"));
    render(<NewClientPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = document.querySelector("button[type='submit']") as HTMLButtonElement;
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Email duplicado")).toBeDefined();
  });

  it("muestra error genérico si falla con un error no-Error", async () => {
    mockRegister.mockRejectedValue("crudo");
    render(<NewClientPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = document.querySelector("button[type='submit']") as HTMLButtonElement;
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("No se pudo crear el cliente."),
    ).toBeDefined();
  });

  it("muestra 'Creando...' mientras loading=true", async () => {
    mockRegister.mockReturnValue(new Promise(() => {}));

    render(<NewClientPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "ana@test.com" } });

    const submitBtn = document.querySelector("button[type='submit']") as HTMLButtonElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(document.body.textContent).toContain("Creando...");
    });
  });
});
