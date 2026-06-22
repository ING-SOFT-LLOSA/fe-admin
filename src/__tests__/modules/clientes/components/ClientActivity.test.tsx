/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientActivity from '@/modules/clientes/components/ClientActivity';
import type { ClienteAssignment } from "@/types/user";

const mockAssignments: ClienteAssignment[] = [
  { unitId: 1, clientId: 1, projectName: "Aurora", unitLabel: "Dpto 301", status: "Vigente", financing: "Crédito Directo", assignedAt: "2026-06-15", uuidUsuarioActivo: "ua-1" } as any,
];

describe("ClientActivity", () => {
  it("muestra mensaje cuando no hay actividad", () => {
    render(<ClientActivity assignments={[]} />);
    expect(screen.getByText("Sin actividad registrada.")).toBeDefined();
  });

  it("muestra 'Actividad Reciente' como título", () => {
    render(<ClientActivity assignments={mockAssignments} />);
    expect(screen.getByText("Actividad Reciente")).toBeDefined();
  });

  it("muestra evento de asignación vigente", () => {
    render(<ClientActivity assignments={mockAssignments} />);
    expect(screen.getByText(/Se asignó Dpto 301 en Aurora/i)).toBeDefined();
  });

  it("muestra evento de cliente registrado cuando hay clientCreatedAt", () => {
    render(<ClientActivity assignments={mockAssignments} clientCreatedAt="2026-01-01" />);
    expect(screen.getByText("Cliente registrado en el sistema")).toBeDefined();
  });

  it("muestra evento de desvinculación para asignaciones no vigentes", () => {
    const nonVigente: ClienteAssignment[] = [
      { ...mockAssignments[0], status: "Desvinculado", unitLabel: "Dpto 302" } as any,
    ];
    render(<ClientActivity assignments={nonVigente} />);
    expect(screen.getByText(/Se desvinculó Dpto 302 en Aurora/i)).toBeDefined();
  });
});
