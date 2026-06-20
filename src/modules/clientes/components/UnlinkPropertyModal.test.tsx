/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import UnlinkPropertyModal from "./UnlinkPropertyModal";

vi.mock("@/lib/api/users", () => ({
  unlinkAssignment: vi.fn(),
}));

import { unlinkAssignment } from "@/lib/api/users";

const mockUnlink = vi.mocked(unlinkAssignment);

const mockAssignment: any = {
  unitId: 1,
  projectName: "Aurora",
  unitLabel: "Dpto 301",
  uuidUsuarioActivo: "ua-1",
};

describe("UnlinkPropertyModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnlink.mockResolvedValue(undefined);
  });

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

  it("usa 'Propiedad #unitId' si no hay projectName", () => {
    const assignmentSinProyecto = { ...mockAssignment, projectName: undefined, unitLabel: undefined };
    render(
      <UnlinkPropertyModal open={true} assignment={assignmentSinProyecto} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );
    expect(screen.getByText(/Propiedad #1/)).toBeDefined();
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

  it("llama a unlinkAssignment y onUnlinked al confirmar", async () => {
    const onUnlinked = vi.fn();
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={onUnlinked} />
    );

    fireEvent.click(screen.getByText("Desvincular"));

    await waitFor(() => {
      expect(mockUnlink).toHaveBeenCalledWith("ua-1");
      expect(onUnlinked).toHaveBeenCalled();
    });
  });

  it("muestra error si unlinkAssignment falla con Error", async () => {
    mockUnlink.mockRejectedValue(new Error("No se pudo desvincular"));
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Desvincular"));

    expect(await screen.findByText("No se pudo desvincular")).toBeDefined();
  });

  it("muestra error genérico si unlinkAssignment falla con un error no-Error", async () => {
    mockUnlink.mockRejectedValue("fallo crudo");
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Desvincular"));

    expect(await screen.findByText("No se pudo desvincular la propiedad.")).toBeDefined();
  });

  it("muestra 'Desvinculando…' mientras se procesa", async () => {
    mockUnlink.mockReturnValue(new Promise(() => {}));

    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Desvincular"));

    expect(await screen.findByText("Desvinculando…")).toBeDefined();
  });

  it("convierte uuidUsuarioActivo a string al llamar a unlinkAssignment", async () => {
    const assignmentConNumero = { ...mockAssignment, uuidUsuarioActivo: 42 };
    render(
      <UnlinkPropertyModal open={true} assignment={assignmentConNumero} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Desvincular"));

    await waitFor(() => {
      expect(mockUnlink).toHaveBeenCalledWith("42");
    });
  });
});
