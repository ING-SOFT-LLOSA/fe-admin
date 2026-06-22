/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ObraTabDashboard from '@/modules/obra/components/ObraTabDashboard';
import type { EtapaResponseDTO } from "@/lib/api/obra";

const mockEtapas: EtapaResponseDTO[] = [
  { id: "e-1", nombre: "Cimentación", orden: 1, estado: "COMPLETADA", proyectoId: "p-1" } as any,
  { id: "e-2", nombre: "Estructura", orden: 2, estado: "EN_PROGRESO", proyectoId: "p-1" } as any,
  { id: "e-3", nombre: "Acabados", orden: 3, estado: "PENDIENTE", proyectoId: "p-1" } as any,
  { id: "e-4", nombre: "Rezagada", orden: 4, estado: "RETRASADA", proyectoId: "p-1" } as any,
];

describe("ObraTabDashboard", () => {
  it("muestra el resumen de etapas", () => {
    render(<ObraTabDashboard etapas={mockEtapas} />);
    expect(screen.getByText("Resumen de etapas")).toBeDefined();
    expect(screen.getByText("Cimentación")).toBeDefined();
    expect(screen.getByText("Estructura")).toBeDefined();
    expect(screen.getByText("Acabados")).toBeDefined();
  });

  it("muestra los badges de estado correctos", () => {
    render(<ObraTabDashboard etapas={mockEtapas} />);
    expect(screen.getByText("Completada")).toBeDefined();
    expect(screen.getByText("En progreso")).toBeDefined();
    expect(screen.getByText("Pendiente")).toBeDefined();
    expect(screen.getByText("Retrasada")).toBeDefined();
  });

  it("no muestra el resumen si no hay etapas", () => {
    render(<ObraTabDashboard etapas={[]} />);
    expect(screen.queryByText("Resumen de etapas")).toBeNull();
  });
});
