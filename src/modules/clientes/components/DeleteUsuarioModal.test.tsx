import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DeleteUsuarioModal from "./DeleteUsuarioModal";
import type { ClienteRow } from "@/types/user";

vi.mock("@/lib/api/users", () => ({
  desactivarUsuario: vi.fn(),
}));

import { desactivarUsuario } from "@/lib/api/users";
const mockDesactivar = vi.mocked(desactivarUsuario);

const mockUsuario: ClienteRow = {
  id: 5,
  initials: "JP",
  name: "Juan Pérez",
  dni: "12345678",
  email: "juan@test.com",
  phone: "999999999",
  project: "Revissar perfil",
  status: "ACTIVO",
  statusBg: "bg-green-100",
  tipoUsuario: "CLIENTE",
  rol: "USER",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DeleteUsuarioModal", () => {
  it("no renderiza nada cuando open es false", () => {
    const { container } = render(
      <DeleteUsuarioModal
        open={false}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("no renderiza nada cuando usuario es null", () => {
    const { container } = render(
      <DeleteUsuarioModal
        open={true}
        usuario={null}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el nombre y email del usuario cuando está abierto", () => {
    render(
      <DeleteUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("juan@test.com")).toBeInTheDocument();
  });

  it("muestra el título 'Desactivar cliente'", () => {
    render(
      <DeleteUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );
    expect(screen.getByText("Desactivar cliente")).toBeInTheDocument();
  });

  it("llama a onClose cuando se hace clic en Cancelar", () => {
    const onClose = vi.fn();
    render(
      <DeleteUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={onClose}
        onDeleted={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("llama a desactivarUsuario y onDeleted cuando se confirma", async () => {
    mockDesactivar.mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    const onClose = vi.fn();

    render(
      <DeleteUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={onClose}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByText("Desactivar"));
    await waitFor(() => expect(mockDesactivar).toHaveBeenCalledWith(5));
    expect(onDeleted).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("muestra error si desactivarUsuario lanza una excepción", async () => {
    mockDesactivar.mockRejectedValue(new Error("Error al desactivar"));
    const onDeleted = vi.fn();

    render(
      <DeleteUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByText("Desactivar"));
    await waitFor(() =>
      expect(screen.getByText("Error al desactivar")).toBeInTheDocument()
    );
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("muestra mensaje genérico si el error no es una instancia de Error", async () => {
    mockDesactivar.mockRejectedValue("error-string");

    render(
      <DeleteUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Desactivar"));
    await waitFor(() =>
      expect(screen.getByText("No se pudo desactivar el cliente.")).toBeInTheDocument()
    );
  });

  it("muestra 'Desactivando...' mientras carga", async () => {
    mockDesactivar.mockImplementation(() => new Promise(() => {}));

    render(
      <DeleteUsuarioModal
        open={true}
        usuario={mockUsuario}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Desactivar"));
    expect(screen.getByText("Desactivando...")).toBeInTheDocument();
  });
});
