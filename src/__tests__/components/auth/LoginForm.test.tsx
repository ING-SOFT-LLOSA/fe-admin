/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("LoginForm", () => {
  const mockReplace = vi.fn();
  const mockLoginEmail = vi.fn();
  const mockLoginGoogle = vi.fn();
  const mockResetPassword = vi.fn();
  const mockLogout = vi.fn();

  const defaultAuth = {
    loginEmail: mockLoginEmail,
    loginGoogle: mockLoginGoogle,
    resetPassword: mockResetPassword,
    logout: mockLogout,
    isAuthenticated: false,
    isLoading: false,
    perfil: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as any);
    vi.mocked(useAuth).mockReturnValue(defaultAuth as any);
  });

  it("muestra el formulario de inicio de sesión", () => {
    render(<LoginForm />);
    expect(screen.getByText("Inicia sesión")).toBeDefined();
    expect(screen.getByLabelText("Correo electrónico")).toBeDefined();
    expect(screen.getByLabelText("Contraseña")).toBeDefined();
    expect(screen.getByText("Acceder")).toBeDefined();
  });

  it("muestra el botón de Google", () => {
    render(<LoginForm />);
    expect(screen.getByText("Acceder con Google")).toBeDefined();
  });

  it("muestra ¿Olvidaste tu contraseña?", () => {
    render(<LoginForm />);
    expect(screen.getByText("¿Olvidaste tu contraseña?")).toBeDefined();
  });

  it("cambia a vista de recuperación de contraseña al hacer clic en 'Olvidaste tu contraseña'", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByText("¿Olvidaste tu contraseña?"));
    expect(screen.getByText("Recuperar contraseña")).toBeDefined();
    expect(screen.getByText("Enviar enlace de recuperación")).toBeDefined();
    expect(screen.getByText("Volver al inicio de sesión")).toBeDefined();
  });

  it("llama a loginEmail al hacer submit del formulario", async () => {
    mockLoginEmail.mockResolvedValue(undefined);
    const { container } = render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "admin@empresa.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(mockLoginEmail).toHaveBeenCalledWith("admin@empresa.com", "password123");
  });

  it("muestra mensaje de error cuando loginEmail falla", async () => {
    mockLoginEmail.mockRejectedValue(new Error("Correo o contraseña inválido."));
    const { container } = render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "bad@email.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "wrong" },
    });
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    expect(await screen.findByText("Correo o contraseña inválido.")).toBeDefined();
  });

  it("llama a loginGoogle al hacer clic en el botón de Google", async () => {
    mockLoginGoogle.mockResolvedValue(undefined);
    render(<LoginForm />);

    fireEvent.click(screen.getByText("Acceder con Google"));
    expect(mockLoginGoogle).toHaveBeenCalled();
  });

  it("llama a resetPassword en la vista de recuperación", async () => {
    mockResetPassword.mockResolvedValue(undefined);
    render(<LoginForm />);

    fireEvent.click(screen.getByText("¿Olvidaste tu contraseña?"));
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "user@email.com" },
    });
    fireEvent.click(screen.getByText("Enviar enlace de recuperación"));

    expect(mockResetPassword).toHaveBeenCalledWith("user@email.com");
  });

  it("redirige a redirectTo si el usuario está autenticado y no es CLIENTE", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuth,
      isAuthenticated: true,
      isLoading: false,
      perfil: { tipoUsuario: "EMPLEADO" },
    } as any);

    render(<LoginForm redirectTo="/dashboard" />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("hace logout si el usuario es CLIENTE", () => {
    mockLogout.mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuth,
      isAuthenticated: true,
      isLoading: false,
      perfil: { tipoUsuario: "CLIENTE" },
    } as any);

    render(<LoginForm />);
    expect(mockLogout).toHaveBeenCalled();
  });
});
