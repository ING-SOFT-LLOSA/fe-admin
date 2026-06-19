import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfoChip, ResumenKpi, LoadingSpinner, Spinner, ErrorBanner } from "./ui";

describe("InfoChip", () => {
  it("muestra el icono y el label", () => {
    render(<InfoChip icon="badge" label="12345678" />);
    expect(screen.getByText("12345678")).toBeDefined();
  });
});

describe("ResumenKpi", () => {
  it("muestra icono, label y valor", () => {
    render(<ResumenKpi icon="person" label="Cliente" value="Juan Pérez" />);
    expect(screen.getByText("Cliente")).toBeDefined();
    expect(screen.getByText("Juan Pérez")).toBeDefined();
  });
});

describe("LoadingSpinner", () => {
  it("muestra label por defecto", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Cargando...")).toBeDefined();
  });

  it("muestra label personalizado", () => {
    render(<LoadingSpinner label="Cargando expediente..." />);
    expect(screen.getByText("Cargando expediente...")).toBeDefined();
  });
});

describe("Spinner", () => {
  it("renderiza un SVG con clase animate-spin", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.classList.contains("animate-spin")).toBe(true);
  });
});

describe("ErrorBanner", () => {
  it("muestra el mensaje de error", () => {
    render(<ErrorBanner message="Error al cargar datos" />);
    expect(screen.getByText("Error al cargar datos")).toBeDefined();
  });
});
