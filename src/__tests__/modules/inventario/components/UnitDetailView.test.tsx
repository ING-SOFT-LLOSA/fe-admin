import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/modules/inventario/services", () => ({
  fetchAllActivosPorProyecto: vi.fn(),
  updateActivo: vi.fn(),
  deleteActivo: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { fetchAllActivosPorProyecto, updateActivo, deleteActivo } from "@/modules/inventario/services";
import UnitDetailView from '@/modules/inventario/components/UnitDetailView';

const mockFetchAllActivosPorProyecto = vi.mocked(fetchAllActivosPorProyecto);
const mockUpdateActivo = vi.mocked(updateActivo);
const mockDeleteActivo = vi.mocked(deleteActivo);

const sampleUnit = {
  id: "unit-1",
  nro: "502",
  pisoId: 1,
  nroPiso: 5,
  torreNombre: "Torre A",
  proyectoNombre: "Las Lomas",
  tipo: "DEPARTAMENTO",
  areaM2: 80,
  areaTechada: 75,
  estadoComercial: "DISPONIBLE",
  precio: 350000,
  descripcion: "Dpto 502 en Torre A",
};

describe("UnitDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockFetchAllActivosPorProyecto.mockResolvedValue([sampleUnit] as any);
    mockUpdateActivo.mockResolvedValue(sampleUnit as any);
    mockDeleteActivo.mockResolvedValue(undefined as any);
  });

  it("shows loading skeleton initially", () => {
    mockFetchAllActivosPorProyecto.mockReturnValue(new Promise(() => {}));
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    expect(document.querySelector(".skeleton")).toBeTruthy();
  });

  it("loads and displays unit data", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });
  });

  it("shows 'Unidad no encontrada' when unit doesn't exist", async () => {
    mockFetchAllActivosPorProyecto.mockResolvedValue([] as any);
    render(<UnitDetailView projectId="proj-1" unitId="unit-999" />);
    expect(await screen.findByText("Unidad no encontrada")).toBeDefined();
  });

  it("shows error message when fetch fails", async () => {
    mockFetchAllActivosPorProyecto.mockRejectedValue(new Error("Load error"));
    render(<UnitDetailView projectId="proj-1" unitId="unit-999" />);
    expect(await screen.findByText("Unidad no encontrada")).toBeDefined();
    expect(screen.getByText("Load error")).toBeDefined();
  });

  it("shows generic error when non-Error thrown", async () => {
    mockFetchAllActivosPorProyecto.mockRejectedValue("fail");
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    expect(await screen.findByText("Unidad no encontrada")).toBeDefined();
    expect(screen.getByText("No se pudo cargar la unidad.")).toBeDefined();
  });

  it("has Volver a unidades link", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });
    const link = screen.getByText("Volver a unidades");
    expect(link.closest("a")?.getAttribute("href")).toBe("/proyectos/proj-1/unidades");
  });

  it("saves changes successfully", async () => {
    mockUpdateActivo.mockResolvedValue({ ...sampleUnit, nro: "503" } as any);
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Guardar cambios"));
    await waitFor(() => {
      expect(mockUpdateActivo).toHaveBeenCalledWith("unit-1", expect.any(Object));
    });
    expect(await screen.findByText("Unidad actualizada correctamente.")).toBeDefined();
  });

  it("shows error when save fails", async () => {
    mockUpdateActivo.mockRejectedValue(new Error("Save error"));
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Guardar cambios"));
    expect(await screen.findByText("Save error")).toBeDefined();
  });

  it("shows generic error when save throws non-Error", async () => {
    mockUpdateActivo.mockRejectedValue("fail");
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Guardar cambios"));
    expect(await screen.findByText("No se pudo guardar la unidad.")).toBeDefined();
  });

  it("shows success message after save", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Guardar cambios"));
    expect(await screen.findByText("Unidad actualizada correctamente.")).toBeDefined();
  });

  it("updates form fields when typing", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    const nroInput = screen.getByLabelText("Número") as HTMLInputElement;
    fireEvent.change(nroInput, { target: { value: "601" } });
    expect(nroInput.value).toBe("601");

    const tipoInput = screen.getByLabelText("Tipo") as HTMLInputElement;
    fireEvent.change(tipoInput, { target: { value: "COCHERA" } });
    expect(tipoInput.value).toBe("COCHERA");

    const areaInput = screen.getByLabelText("Ocupada (m²)") as HTMLInputElement;
    fireEvent.change(areaInput, { target: { value: "100" } });
    expect(areaInput.value).toBe("100");
  });

  it("shows disabled piso input", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });
    const pisoInput = screen.getByLabelText("Piso") as HTMLInputElement;
    expect(pisoInput.disabled).toBe(true);
  });

  it("has Ir a asignaciones link", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });
    expect(screen.getByText("Ir a asignaciones")).toBeDefined();
  });

  it("defaults areaTechada to areaM2 when areaM2 input is changed", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    const areaInput = screen.getByLabelText("Ocupada (m²)") as HTMLInputElement;
    const areaTechadaInput = screen.getByLabelText("Área techada") as HTMLInputElement;

    fireEvent.change(areaInput, { target: { value: "120" } });
    expect(areaInput.value).toBe("120");
    expect(areaTechadaInput.value).toBe("120");
  });

  it("abre diálogo de confirmación al hacer clic en eliminar", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    const deleteBtn = screen.getByText("Eliminar unidad");
    fireEvent.click(deleteBtn);

    expect(screen.getByText("¿Eliminar unidad?")).toBeDefined();
    expect(screen.getByText(/¿Estás seguro de que deseas eliminar la unidad "502"?/)).toBeDefined();
  });

  it("cancela la eliminación si el usuario cancela en el diálogo", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Eliminar unidad"));
    expect(screen.getByText("¿Eliminar unidad?")).toBeDefined();

    const cancelBtn = screen.getByText("Cancelar");
    fireEvent.click(cancelBtn);

    expect(screen.queryByText("¿Eliminar unidad?")).toBeNull();
    expect(mockDeleteActivo).not.toHaveBeenCalled();
  });

  it("llama a deleteActivo y redirige al confirmar en el diálogo", async () => {
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Eliminar unidad"));
    const confirmBtn = screen.getByText("Eliminar");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteActivo).toHaveBeenCalledWith("unit-1");
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/proyectos/proj-1/unidades");
    });
  });

  it("muestra error si falla la eliminación", async () => {
    mockDeleteActivo.mockRejectedValue(new Error("No se puede eliminar porque tiene contratos"));
    render(<UnitDetailView projectId="proj-1" unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText("Unidad 502")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Eliminar unidad"));
    const confirmBtn = screen.getByText("Eliminar");
    fireEvent.click(confirmBtn);

    expect(await screen.findByText("No se puede eliminar porque tiene contratos")).toBeDefined();
    expect(screen.queryByText("¿Eliminar unidad?")).toBeNull();
  });
});
