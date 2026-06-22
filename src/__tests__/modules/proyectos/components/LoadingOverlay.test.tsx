import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingOverlay from '@/modules/proyectos/components/LoadingOverlay';

describe("LoadingOverlay", () => {
  it("muestra el mensaje de carga", () => {
    render(<LoadingOverlay message="Guardando proyecto..." />);
    expect(screen.getByText("Guardando proyecto...")).toBeDefined();
  });

  it("muestra el texto de advertencia", () => {
    render(<LoadingOverlay message="Creando..." />);
    expect(screen.getByText(/no cierres ni recargues la página/i)).toBeDefined();
  });
});
