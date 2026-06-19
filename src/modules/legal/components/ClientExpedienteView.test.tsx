/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientExpedienteView from "./ClientExpedienteView";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchExpedientesPorUsuario: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useCommercialStepper: vi.fn(() => ({
    stepper: null,
    etapas: [],
    loading: false,
    error: "",
    updateHito: vi.fn(),
  })),
  useStageDocuments: vi.fn(() => ({
    sections: [],
    loading: false,
    error: null,
    refresh: vi.fn(),
  })),
}));

import { fetchUsuarios } from "@/lib/api/users";
import { fetchExpedientesPorUsuario } from "@/lib/api/expedientes";

const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockFetchExpedientes = vi.mocked(fetchExpedientesPorUsuario);

describe("ClientExpedienteView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      perfil: { rol: "ADMIN", funciones: [] },
    } as any);
  });

  it("muestra loading spinner al cargar datos", () => {
    mockFetchUsuarios.mockReturnValue(new Promise(() => {}));
    mockFetchExpedientes.mockReturnValue(new Promise(() => {}));

    render(<ClientExpedienteView clientId={1} />);
    expect(screen.getByText("Cargando expediente...")).toBeDefined();
  });

  it("muestra mensaje de error si la carga falla", async () => {
    mockFetchUsuarios.mockRejectedValue(new Error("Error de red"));
    mockFetchExpedientes.mockRejectedValue(new Error("Error de red"));

    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Error de red")).toBeDefined();
  });

  it("muestra aviso cuando el cliente no tiene unidades", async () => {
    mockFetchUsuarios.mockResolvedValue([
      { id: 1, nombre: "Juan", apellidos: "Pérez", email: "juan@test.com", telefono: "999999", documentoIdentidad: "12345678" },
    ] as any);
    mockFetchExpedientes.mockResolvedValue([]);

    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Este cliente no tiene unidades asignadas en el sistema.")).toBeDefined();
  });
});
