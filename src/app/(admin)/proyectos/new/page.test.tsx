import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NewProjectPage from "./page";

vi.mock("@/modules/proyectos/components/NewProjectWizard", () => ({
  default: () => <div data-testid="new-project-wizard" />,
}));

describe("NewProjectPage", () => {
  it("renders title and description", () => {
    render(<NewProjectPage />);
    expect(screen.getByText("Crear Nuevo Proyecto")).toBeDefined();
    expect(
      screen.getByText(/Completa los datos generales y configura la estructura de inventario/),
    ).toBeDefined();
  });

  it("renders NewProjectWizard component", () => {
    render(<NewProjectPage />);
    expect(screen.getByTestId("new-project-wizard")).toBeDefined();
  });
});
