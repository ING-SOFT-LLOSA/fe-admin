import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReactivarUsuarioModal from '@/modules/clientes/components/ReactivarUsuarioModal';
import type { ClienteRow } from "@/types/user";

vi.mock("@/lib/api/users", () => ({
  activarUsuario: vi.fn(),
}));

import { activarUsuario } from "@/lib/api/users";
const mockActivar = vi.mocked(activarUsuario);

const mockUsuario: ClienteRow = {
  id: 5,
  initials: "JP",
  name: "Juan Pérez",
  dni: "12345678",
  email: "juan@test.com",
  phone: "999999999",
  project: "Revisar perfil",
  status: "INACTIVO",
  statusBg: "bg-slate-100",
  tipoUsuario: "CLIENTE",
  rol: "USER",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReactivarUsuarioModal", () => {
  it("no renderiza nada cuando open es false", () => {
    const { container } = render(
      <ReactivarUsuarioModal
        open={false}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onReactivated={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("no renderiza nada cuando usuario es null", () => {
    const { container } = render(
      <ReactivarUsuarioModal
        open={true}
        usuario={null}
        onClose={vi.fn()}
        onReactivated={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el nombre y email del usuario cuando está abierto", () => {
    render(
      <ReactivarUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onReactivated={vi.fn()}
      />
    );
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("juan@test.com")).toBeInTheDocument();
  });

  it("muestra el título 'Reactivar cliente'", () => {
    render(
      <ReactivarUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onReactivated={vi.fn()}
      />
    );
    expect(screen.getByText("Reactivar cliente")).toBeInTheDocument();
  });

  it("llama a onClose cuando se hace clic en Cancelar", () => {
    const onClose = vi.fn();
    render(
      <ReactivarUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={onClose}
        onReactivated={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("llama a activarUsuario y onReactivated cuando se confirma", async () => {
    mockActivar.mockResolvedValue(undefined);
    const onReactivated = vi.fn();
    const onClose = vi.fn();

    render(
      <ReactivarUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={onClose}
        onReactivated={onReactivated}
      />
    );

    fireEvent.click(screen.getByText("Reactivar"));
    await waitFor(() => expect(mockActivar).toHaveBeenCalledWith(5));
    expect(onReactivated).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("muestra error si activarUsuario lanza una excepción", async () => {
    mockActivar.mockRejectedValue(new Error("Error al reactivar"));
    const onReactivated = vi.fn();

    render(
      <ReactivarUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onReactivated={onReactivated}
      />
    );

    fireEvent.click(screen.getByText("Reactivar"));
    await waitFor(() =>
      expect(screen.getByText("Error al reactivar")).toBeInTheDocument()
    );
    expect(onReactivated).not.toHaveBeenCalled();
  });

  it("muestra mensaje genérico si el error no es una instancia de Error", async () => {
    mockActivar.mockRejectedValue("error-string");

    render(
      <ReactivarUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onReactivated={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Reactivar"));
    await waitFor(() =>
      expect(screen.getByText("No se pudo reactivar el cliente.")).toBeInTheDocument()
    );
  });

  it("muestra 'Reactivando...' mientras carga", async () => {
    mockActivar.mockImplementation(() => new Promise(() => {}));

    render(
      <ReactivarUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onReactivated={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Reactivar"));
    expect(screen.getByText("Reactivando...")).toBeInTheDocument();
  });
});
