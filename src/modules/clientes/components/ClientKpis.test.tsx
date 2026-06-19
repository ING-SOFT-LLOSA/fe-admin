/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientKpis from "./ClientKpis";
import type { ClienteAssignment } from "@/types/user";

const mockAssignments: ClienteAssignment[] = [
  { unitId: 1, clientId: 1, projectName: "Aurora", unitLabel: "Dpto 301", status: "Vigente", financing: "Crédito Directo", assignedAt: "2026-01-01", uuidUsuarioActivo: "ua-1", estadoTramiteLegal: "" } as any,
  { unitId: 2, clientId: 1, projectName: "Aurora", unitLabel: "Cochera 12", status: "Vigente", financing: "Crédito Directo", assignedAt: "2026-01-05", uuidUsuarioActivo: "ua-2", estadoTramiteLegal: "" } as any,
];

describe("ClientKpis", () => {
  it("muestra el número de propiedades activas", () => {
    render(<ClientKpis assignments={mockAssignments} />);
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("Propiedades")).toBeDefined();
  });

  it("muestra el número de proyectos únicos", () => {
    render(<ClientKpis assignments={mockAssignments} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("Proyectos")).toBeDefined();
  });

  it("muestra 'Activo' cuando hay propiedades vigentes", () => {
    render(<ClientKpis assignments={mockAssignments} />);
    expect(screen.getByText("Activo")).toBeDefined();
  });

  it("muestra 'Sin unidades' cuando no hay propiedades vigentes", () => {
    render(<ClientKpis assignments={[]} />);
    expect(screen.getByText("Sin unidades")).toBeDefined();
  });
});
