import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api/users", () => ({
  fetchUsuariosPaginado: vi.fn(),
}));

import { fetchUsuariosPaginado } from "@/lib/api/users";
import ClientSearchStep from "./ClientSearchStep";

const mockFetchUsuariosPaginado = vi.mocked(fetchUsuariosPaginado);

const sampleUser = {
  id: 1,
  nombre: "Ana",
  apellidos: "García",
  email: "ana@test.com",
  tipoUsuario: "CLIENTE" as const,
  documentoIdentidad: "12345678",
  activo: true,
  telefono: null,
  createdAt: "",
};

describe("ClientSearchStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
    } as any);
  });

  it("renders step header and search input", async () => {
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    expect(screen.getByText("Buscar Cliente")).toBeDefined();
    expect(screen.getByText(/Ingresa el nombre o DNI/)).toBeDefined();
    expect(screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…")).toBeDefined();
  });

  it("shows initial empty state when query is empty", async () => {
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Escribe el nombre del cliente para buscar")).toBeDefined();
    });
  });

  it("shows empty state with different message when query is typed but no results", async () => {
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
    } as any);
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "zzz" } });
    await waitFor(() => {
      expect(screen.getByText("Sin resultados para tu búsqueda")).toBeDefined();
    });
  });

  it("renders search results as clickable buttons with client info", async () => {
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [sampleUser],
      totalElements: 1,
      totalPages: 1,
    } as any);
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeDefined();
    });
    expect(screen.getByText(/DNI: 12345678/)).toBeDefined();
    expect(screen.getByText("Activo")).toBeDefined();
  });

  it("shows Inactivo badge when client is inactive", async () => {
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [{ ...sampleUser, activo: false }],
      totalElements: 1,
      totalPages: 1,
    } as any);
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    await waitFor(() => {
      expect(screen.getByText("Inactivo")).toBeDefined();
    });
  });

  it("calls onSelectClient when a client button is clicked", async () => {
    const onSelectClient = vi.fn();
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [sampleUser],
      totalElements: 1,
      totalPages: 1,
    } as any);
    render(<ClientSearchStep onSelectClient={onSelectClient} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    const btn = await screen.findByText("Ana García");
    fireEvent.click(btn);
    expect(onSelectClient).toHaveBeenCalledWith(sampleUser);
  });

  it("shows loading spinner while fetching", async () => {
    mockFetchUsuariosPaginado.mockReturnValue(new Promise(() => {}));
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).toBeTruthy();
    });
  });

  it("shows error message when fetch fails", async () => {
    mockFetchUsuariosPaginado.mockRejectedValue(new Error("Network error"));
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    expect(await screen.findByText("Network error")).toBeDefined();
  });

  it("shows generic error message when non-Error thrown", async () => {
    mockFetchUsuariosPaginado.mockRejectedValue("string error");
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    expect(await screen.findByText("Error al buscar clientes")).toBeDefined();
  });

  it("filters only CLIENTE type users", async () => {
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [sampleUser, { ...sampleUser, id: 2, tipoUsuario: "ASESOR" }],
      totalElements: 2,
      totalPages: 1,
    } as any);
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.some(b => b.textContent?.includes("Ana García"))).toBe(true);
      expect(buttons.length).toBe(1);
    });
  });

  it("shows initials avatar for client", async () => {
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [sampleUser],
      totalElements: 1,
      totalPages: 1,
    } as any);
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    await waitFor(() => {
      expect(screen.getByText("AG")).toBeDefined();
    });
  });

  it("handles client without documentoIdentidad", async () => {
    mockFetchUsuariosPaginado.mockResolvedValue({
      content: [{ ...sampleUser, documentoIdentidad: undefined, apellidos: "" }],
      totalElements: 1,
      totalPages: 1,
    } as any);
    render(<ClientSearchStep onSelectClient={vi.fn()} />);
    const input = screen.getByPlaceholderText("Nombre completo, DNI o correo electrónico…");
    fireEvent.change(input, { target: { value: "Ana" } });
    await waitFor(() => {
      expect(screen.getByText("Ana")).toBeDefined();
      expect(screen.getByText("ana@test.com")).toBeDefined();
    });
  });
});
