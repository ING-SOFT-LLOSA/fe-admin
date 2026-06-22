/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClientProperties from '@/modules/clientes/components/ClientProperties';
import type { ClienteAssignment } from "@/types/user";

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

const mockAssignments: ClienteAssignment[] = [
  { unitId: 1, clientId: 1, projectName: "Aurora", unitLabel: "Dpto 301", status: "Vigente", financing: "Crédito Directo", assignedAt: "2026-01-01", uuidUsuarioActivo: "ua-1" } as any,
];

describe("ClientProperties", () => {
  it("muestra mensaje cuando no hay propiedades activas", () => {
    render(<ClientProperties assignments={[]} onUnlink={vi.fn()} />);
    expect(screen.getByText("No tiene propiedades vinculadas activas.")).toBeDefined();
  });

  it("muestra la propiedad activa con su label y financiamiento", () => {
    render(<ClientProperties assignments={mockAssignments} onUnlink={vi.fn()} />);
    expect(screen.getByText("Dpto 301")).toBeDefined();
    expect(screen.getByText("Crédito Directo")).toBeDefined();
    expect(screen.getByText("Propiedades")).toBeDefined();
  });

  it("llama a onUnlink al hacer clic en Desvincular", () => {
    const onUnlink = vi.fn();
    render(<ClientProperties assignments={mockAssignments} onUnlink={onUnlink} />);
    fireEvent.click(screen.getByText("Desvincular"));
    expect(onUnlink).toHaveBeenCalledWith(mockAssignments[0]);
  });
});
