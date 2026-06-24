/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import UnlinkPropertyModal from '@/modules/clientes/components/UnlinkPropertyModal';

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

  it("muestra el título de cancelación y la unidad afectada", () => {
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );
    expect(screen.getByText("Cancelar contrato")).toBeDefined();
    expect(screen.getByText("Unidades que se desvincularán")).toBeDefined();
    expect(screen.getByText("Dpto 301")).toBeDefined();
  });

  it("omite el bloque de unidades si no hay unitLabel", () => {
    const assignmentSinUnidad = { ...mockAssignment, unitLabel: undefined };
    render(
      <UnlinkPropertyModal open={true} assignment={assignmentSinUnidad} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );
    expect(screen.queryByText("Unidades que se desvincularán")).toBeNull();
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

    fireEvent.click(screen.getByText("Confirmar cancelación"));

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

    fireEvent.click(screen.getByText("Confirmar cancelación"));

    expect(await screen.findByText("No se pudo desvincular")).toBeDefined();
  });

  it("muestra error genérico si unlinkAssignment falla con un error no-Error", async () => {
    mockUnlink.mockRejectedValue("fallo crudo");
    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Confirmar cancelación"));

    expect(await screen.findByText("No se pudo cancelar el contrato.")).toBeDefined();
  });

  it("muestra 'Cancelando…' mientras se procesa", async () => {
    mockUnlink.mockReturnValue(new Promise(() => {}));

    render(
      <UnlinkPropertyModal open={true} assignment={mockAssignment} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Confirmar cancelación"));

    expect(await screen.findByText("Cancelando…")).toBeDefined();
  });

  it("convierte uuidUsuarioActivo a string al llamar a unlinkAssignment", async () => {
    const assignmentConNumero = { ...mockAssignment, uuidUsuarioActivo: 42 };
    render(
      <UnlinkPropertyModal open={true} assignment={assignmentConNumero} onClose={vi.fn()} onUnlinked={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Confirmar cancelación"));

    await waitFor(() => {
      expect(mockUnlink).toHaveBeenCalledWith("42");
    });
  });
});
