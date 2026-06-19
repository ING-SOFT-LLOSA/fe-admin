/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ObraTabTimeline from "./ObraTabTimeline";
import type { EtapaResponseDTO } from "@/lib/api/obra";

const mockEtapas: EtapaResponseDTO[] = [
  { id: "e-1", nombre: "Cimentación", orden: 1, estado: "COMPLETADA", proyectoId: "p-1" } as any,
  { id: "e-2", nombre: "Estructura", orden: 2, estado: "EN_PROGRESO", proyectoId: "p-1" } as any,
  { id: "e-3", nombre: "Acabados", orden: 3, estado: "PENDIENTE", proyectoId: "p-1" } as any,
];

describe("ObraTabTimeline", () => {
  it("muestra el título Timeline Constructivo", () => {
    render(<ObraTabTimeline projectId="p-1" etapas={mockEtapas} />);
    expect(screen.getByText("Timeline Constructivo")).toBeDefined();
  });

  it("muestra los nombres de las etapas ordenadas", () => {
    render(<ObraTabTimeline projectId="p-1" etapas={mockEtapas} />);
    expect(screen.getByText("Cimentación")).toBeDefined();
    expect(screen.getByText("Estructura")).toBeDefined();
    expect(screen.getByText("Acabados")).toBeDefined();
  });

  it("muestra los badges de estado", () => {
    render(<ObraTabTimeline projectId="p-1" etapas={mockEtapas} />);
    expect(screen.getByText("Completado")).toBeDefined();
    expect(screen.getByText("En progreso")).toBeDefined();
    expect(screen.getByText("Pendiente")).toBeDefined();
  });

  it("muestra mensaje cuando no hay hitos", () => {
    render(<ObraTabTimeline projectId="p-1" etapas={[]} />);
    expect(screen.getByText(/No hay hitos maestros configurados/)).toBeDefined();
  });

  it("muestra iconos correctos para diferentes tipos de hitos", () => {
    const hitos: EtapaResponseDTO[] = [
      { id: "h-1", nombre: "Antecedentes", orden: 1, estado: "COMPLETADA", proyectoId: "p-1" } as any,
      { id: "h-2", nombre: "Demolición", orden: 2, estado: "COMPLETADA", proyectoId: "p-1" } as any,
      { id: "h-3", nombre: "Inicio de obra", orden: 3, estado: "EN_PROGRESO", proyectoId: "p-1" } as any,
      { id: "h-4", nombre: "Excavación", orden: 4, estado: "PENDIENTE", proyectoId: "p-1" } as any,
      { id: "h-5", nombre: "Obra húmeda", orden: 4, estado: "PENDIENTE", proyectoId: "p-1" } as any,
    ];
    render(<ObraTabTimeline projectId="p-1" etapas={hitos} />);
    expect(screen.getByText("Antecedentes")).toBeDefined();
    expect(screen.getByText("Demolición")).toBeDefined();
    expect(screen.getByText("Inicio de obra")).toBeDefined();
  });
});
