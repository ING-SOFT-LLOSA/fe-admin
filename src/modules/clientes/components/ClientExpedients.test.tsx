/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientExpedients from "./ClientExpedients";
import type { ClienteAssignment } from "@/types/user";

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

const mockAssignments: ClienteAssignment[] = [
  { unitId: 1001, clientId: 1, projectName: "Aurora", unitLabel: "Dpto 301", status: "Vigente", financing: "Crédito Directo", assignedAt: "2026-01-01", uuidUsuarioActivo: "ua-1" } as any,
];

describe("ClientExpedients", () => {
  it("muestra mensaje cuando no hay expedientes activos", () => {
    render(<ClientExpedients assignments={[]} />);
    expect(screen.getByText("Sin expedientes activos.")).toBeDefined();
  });

  it("muestra los expedientes activos con su ID y proyecto", () => {
    render(<ClientExpedients assignments={mockAssignments} />);
    expect(screen.getByText(/EXP-/)).toBeDefined();
    expect(screen.getByText("Abrir")).toBeDefined();
  });

  it("muestra 'Contrato firmado' en el badge", () => {
    render(<ClientExpedients assignments={mockAssignments} />);
    expect(screen.getByText("Contrato firmado")).toBeDefined();
  });
});
