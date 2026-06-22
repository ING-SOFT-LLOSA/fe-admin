import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/modules/proyectos/services", () => ({
  deleteProyecto: vi.fn(),
  updateProyecto: vi.fn(),
}));

vi.mock("@/lib/api/http", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/modules/proyectos/components/ProjectForm", () => ({
  default: ({ values, onChange, onSubmit, isSaving }: { values: Record<string, unknown>; onChange: (f: string, v: unknown) => void; onSubmit: () => void; isSaving: boolean }) => (
    <div data-testid="project-form">
      <span data-testid="project-name">{values.nombre as string}</span>
      <button data-testid="fake-submit" onClick={onSubmit} disabled={isSaving}>Guardar proyecto</button>
    </div>
  ),
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen, title, message, onConfirm, onClose }: { isOpen: boolean; title: string; message: string; onConfirm?: () => void; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <span data-testid="dialog-title">{title}</span>
        <span data-testid="dialog-message">{message}</span>
        <button data-testid="dialog-confirm" onClick={() => { onConfirm?.(); }}>Confirm</button>
        <button data-testid="dialog-cancel" onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { apiFetch } from "@/lib/api/http";
import { updateProyecto, deleteProyecto } from "@/modules/proyectos/services";
import ProjectDetailView from '@/modules/proyectos/components/ProjectDetailView';

const mockApiFetch = vi.mocked(apiFetch);
const mockUpdateProyecto = vi.mocked(updateProyecto);
const mockDeleteProyecto = vi.mocked(deleteProyecto);

const sampleProject = {
  id: "proj-1",
  nombre: "Las Lomas",
  descripcion: "Proyecto residencial",
  precertificacionEdgeLeed: false,
  departamento: "Lima",
  distrito: "Miraflores",
  direccion: "Av. Principal 123",
  fechaInicio: "2026-01-01",
  fechaFin: "2027-12-31",
};

describe("ProjectDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue([sampleProject] as any);
    mockUpdateProyecto.mockResolvedValue(undefined);
    mockDeleteProyecto.mockResolvedValue(undefined);
  });

  it("shows loading skeleton initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<ProjectDetailView projectId="proj-1" />);
    expect(document.querySelector(".skeleton")).toBeTruthy();
  });

  it("loads and renders project form", async () => {
    render(<ProjectDetailView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("project-form")).toBeDefined();
    });
    expect(screen.getByTestId("project-name").textContent).toBe("Las Lomas");
  });

  it("calls updateProyecto when saving", async () => {
    render(<ProjectDetailView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("fake-submit")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("fake-submit"));
    await waitFor(() => {
      expect(mockUpdateProyecto).toHaveBeenCalledWith("proj-1", expect.objectContaining({ nombre: "Las Lomas" }));
    });
    expect(screen.getByText("Proyecto actualizado correctamente.")).toBeDefined();
  });

  it("shows error dialog when save fails", async () => {
    mockUpdateProyecto.mockRejectedValue(new Error("Save error"));
    render(<ProjectDetailView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("fake-submit")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("fake-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-modal")).toBeDefined();
    });
    expect(screen.getByTestId("dialog-title").textContent).toBe("Error de Guardado");
  });

  it("shows delete confirmation dialog", async () => {
    render(<ProjectDetailView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("project-form")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Eliminar proyecto"));
    await waitFor(() => {
      expect(screen.getByText("¿Estás completamente seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer y borrará todas las unidades y etapas asociadas.")).toBeDefined();
    });
  });

  it("handles delete on confirm", async () => {
    render(<ProjectDetailView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("project-form")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Eliminar proyecto"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-confirm")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    await waitFor(() => {
      expect(mockDeleteProyecto).toHaveBeenCalledWith("proj-1");
    });
  });

  it("shows danger zone section", async () => {
    render(<ProjectDetailView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("project-form")).toBeDefined();
    });
    expect(screen.getByText("Zona de peligro")).toBeDefined();
  });

  it("renders empty form when project not found", async () => {
    mockApiFetch.mockResolvedValue([] as any);
    render(<ProjectDetailView projectId="proj-2" />);
    await waitFor(() => {
      expect(screen.getByTestId("project-form")).toBeDefined();
    });
    expect(screen.getByTestId("project-name").textContent).toBe("");
  });

  it("shows Deleting... text while deleting", async () => {
    mockDeleteProyecto.mockReturnValue(new Promise(() => {}));
    render(<ProjectDetailView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("project-form")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Eliminar proyecto"));
    await waitFor(() => {
      expect(screen.getByTestId("dialog-confirm")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    await waitFor(() => {
      expect(screen.getByText("Eliminando...")).toBeDefined();
    });
  });
});
