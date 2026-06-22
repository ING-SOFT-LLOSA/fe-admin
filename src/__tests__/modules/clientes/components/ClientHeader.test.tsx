/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClientHeader from '@/modules/clientes/components/ClientHeader';

const mockClient: any = {
  id: 1,
  name: "Juan Pérez",
  email: "juan@test.com",
  phone: "999999999",
  dni: "12345678",
  status: "Activo",
  createdAt: "2025-06-15",
};

describe("ClientHeader", () => {
  it("muestra el nombre y email del cliente", () => {
    render(
      <ClientHeader client={mockClient} hasActiveProperties={true} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText("Juan Pérez")).toBeDefined();
    expect(screen.getByText("juan@test.com")).toBeDefined();
  });

  it("muestra las iniciales del cliente", () => {
    render(
      <ClientHeader client={mockClient} hasActiveProperties={true} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText("JP")).toBeDefined();
  });

  it("muestra el DNI del cliente", () => {
    render(
      <ClientHeader client={mockClient} hasActiveProperties={true} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText("12345678")).toBeDefined();
  });

  it("llama a onEdit al hacer clic en Editar información", () => {
    const onEdit = vi.fn();
    render(
      <ClientHeader client={mockClient} hasActiveProperties={true} onEdit={onEdit} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Editar información"));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("llama a onDelete al hacer clic en Eliminar cliente", () => {
    const onDelete = vi.fn();
    render(
      <ClientHeader client={mockClient} hasActiveProperties={true} onEdit={vi.fn()} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByText("Eliminar cliente"));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
