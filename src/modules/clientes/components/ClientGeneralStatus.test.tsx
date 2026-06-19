/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientGeneralStatus from "./ClientGeneralStatus";

const mockAssignments: any[] = [
  { status: "Vigente", projectName: "Aurora", unitLabel: "Dpto 301", financing: "Crédito Directo", estadoTramiteLegal: "En proceso" },
];

describe("ClientGeneralStatus", () => {
  it("muestra mensaje cuando no hay unidades activas", () => {
    render(<ClientGeneralStatus assignments={[]} />);
    expect(screen.getByText("El cliente no tiene unidades asignadas actualmente.")).toBeDefined();
  });

  it("muestra el proyecto y unidad de la asignación activa", () => {
    render(<ClientGeneralStatus assignments={mockAssignments} />);
    expect(screen.getByText("Aurora")).toBeDefined();
    expect(screen.getByText("Dpto 301")).toBeDefined();
    expect(screen.getByText("Crédito Directo")).toBeDefined();
  });

  it("muestra el header Estado General", () => {
    render(<ClientGeneralStatus assignments={mockAssignments} />);
    expect(screen.getByText("Estado General")).toBeDefined();
  });
});
