/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UnlinkPropertyModal from "./UnlinkPropertyModal";

vi.mock("@/lib/api/users", () => ({
  unlinkAssignment: vi.fn(),
}));

const mockAssignment: any = {
  unitId: 1,
  projectName: "Aurora",
  unitLabel: "Dpto 301",
  uuidUsuarioActivo: "ua-1",
};

describe("UnlinkPropertyModal", () => {
  it("retorna null si open es false", () => {
    const { container } = render(
      <UnlinkPropertyModal open={false} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("retorna null si assignment es null", () => {
    const { container } = render(
      <UnlinkPropertyModal open={true} assignment={null} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el nombre del proyecto a desvincular", () => {
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );
    expect(screen.getByText("Desvincular propiedad")).toBeDefined();
    expect(screen.getByText("Aurora")).toBeDefined();
    expect(screen.getByText("Dpto 301")).toBeDefined();
  });

  it("muestra advertencia de acción irreversible", () => {
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );
    expect(screen.getByText(/Esta acción no se puede deshacer/i)).toBeDefined();
  });

  it("llama a onClose al hacer clic en Cancelar", () => {
    const onClose = vi.fn();
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={onClose} onUnlinked={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
  });
});
