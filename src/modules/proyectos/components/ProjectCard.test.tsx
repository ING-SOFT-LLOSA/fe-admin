import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/modules/proyectos/utils/format", () => ({
  formatProjectDate: vi.fn((d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toISOString().slice(0, 10);
  }),
}));

import ProjectCard from "./ProjectCard";
import type { Proyecto } from "../types/proyecto";

const sampleProject: Proyecto = {
  id: "proj-1",
  nombre: "Las Lomas",
  departamento: "Lima",
  distrito: "Miraflores",
  direccion: "Av. Principal 123",
  fechaInicio: "2026-01-01",
  fechaFin: "2027-12-31",
  precertificacionEdgeLeed: false,
  descripcion: "Proyecto residencial",
} as unknown as Proyecto;

describe("ProjectCard", () => {
  it("renders project name", () => {
    render(<ProjectCard project={sampleProject} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.getByText("Las Lomas")).toBeDefined();
  });

  it("shows location when distrito is available", () => {
    render(<ProjectCard project={sampleProject} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.getByText("Miraflores")).toBeDefined();
  });

  it("shows avance progress bar", () => {
    render(<ProjectCard project={sampleProject} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.getByText("45%")).toBeDefined();
    expect(screen.getByText("Avance de Obra")).toBeDefined();
  });

  it("shows LEED/EDGE badge when precertificacion is true", () => {
    const leedProject = { ...sampleProject, precertificacionEdgeLeed: true };
    render(<ProjectCard project={leedProject} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.getByText("LEED / EDGE")).toBeDefined();
  });

  it("links to project detail page", () => {
    render(<ProjectCard project={sampleProject} clientesCount={5} dptosCount={20} avance={45} />);
    const link = screen.getByText("Las Lomas").closest("a");
    expect(link?.getAttribute("href")).toBe("/proyectos/proj-1");
  });

  it("shows clientes and dptos counts", () => {
    render(<ProjectCard project={sampleProject} clientesCount={12} dptosCount={85} avance={60} />);
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("85")).toBeDefined();
  });

  it("shows inicio date when fechaInicio is set", () => {
    render(<ProjectCard project={sampleProject} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.getByText("Inicio")).toBeDefined();
  });

  it("hides inicio section when fechaInicio is null", () => {
    const noDate = { ...sampleProject, fechaInicio: null as unknown as string };
    render(<ProjectCard project={noDate} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.queryByText("Inicio")).toBeNull();
  });

  it("clamps avance between 0 and 100", () => {
    render(<ProjectCard project={sampleProject} clientesCount={5} dptosCount={20} avance={150} />);
    const bar = document.querySelector(".bg-arch-gold");
    expect(bar?.getAttribute("style")).toContain("100%");
  });

  it("shows departamento when distrito is null", () => {
    const noDistrito = { ...sampleProject, distrito: null as unknown as string, departamento: "Lima" };
    render(<ProjectCard project={noDistrito} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.getByText("Lima")).toBeDefined();
  });

  it("handles missing location gracefully", () => {
    const noLocation = { ...sampleProject, distrito: null as unknown as string, departamento: null as unknown as string };
    render(<ProjectCard project={noLocation} clientesCount={5} dptosCount={20} avance={45} />);
    expect(screen.queryByText("Miraflores")).toBeNull();
  });
});
