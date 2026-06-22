/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewProjectWizard from '@/modules/proyectos/components/NewProjectWizard';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/modules/proyectos/components/GeneralDataForm', () => ({
  default: ({ initialData, onSubmit, onCancel }: any) => (
    <div data-testid="general-form">
      <button onClick={() => onSubmit(initialData)}>Next</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('@/modules/proyectos/components/InventoryConfigurator', () => ({
  default: ({ initialData, onSubmit, onBack }: any) => (
    <div data-testid="inventory-form">
      <button onClick={() => onSubmit(initialData)}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/modules/proyectos/components/UnitEditorStep', () => ({
  default: ({ torres, onSubmit, onBack }: any) => (
    <div data-testid="unit-editor">
      <span data-testid="torres-count">{torres.length}</span>
      <button onClick={() => onSubmit(torres)}>Create</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/modules/proyectos/components/LoadingOverlay', () => ({
  default: ({ message }: any) => <div data-testid="loading">{message}</div>,
}));

vi.mock("@/modules/proyectos/utils/api-client", () => ({
  createProject: vi.fn(),
  createInventory: vi.fn(),
  generateEstructura: vi.fn(),
}));

import {
  createProject,
  createInventory,
  generateEstructura,
} from "@/modules/proyectos/utils/api-client";

const mockCreateProject = vi.mocked(createProject);
const mockCreateInventory = vi.mocked(createInventory);
const mockGenerateEstructura = vi.mocked(generateEstructura);

const sampleTorres = [
  {
    nombre: "Torre 1",
    pisos: [
      {
        nroPiso: 1,
        activos: [
          {
            nro: "101",
            tipo: "DEPARTAMENTO" as const,
            areaM2: 70,
            areaTechada: 0,
            precio: 200000,
            estadoComercial: "DISPONIBLE",
            descripcion: "Dpto 101",
          },
        ],
      },
    ],
  },
];

describe("NewProjectWizard", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateProject.mockResolvedValue({ id: "proj-123" });
    mockCreateInventory.mockResolvedValue(undefined);
    mockGenerateEstructura.mockReturnValue([]);
  });

  // === Render & breadcrumb ===

  it("empieza en el paso de Datos Generales", () => {
    render(<NewProjectWizard />);
    expect(screen.getByTestId("general-form")).toBeDefined();
  });

  it("muestra los 3 pasos en el breadcrumb", () => {
    render(<NewProjectWizard />);
    expect(screen.getByText("Datos generales")).toBeDefined();
    expect(screen.getByText("Inventario")).toBeDefined();
    expect(screen.getByText("Editar unidades")).toBeDefined();
  });

  it("muestra los números de paso 1, 2, 3", () => {
    render(<NewProjectWizard />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  // === Step navigation forward ===

  it("avanza al paso de Inventario después de GeneralData", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("inventory-form")).toBeDefined();
  });

  it("avanza al paso de UnitEditor después de Inventario", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("unit-editor")).toBeDefined();
  });

  // === Step navigation backward ===

  it("puede volver atrás desde Inventario a General", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("general-form")).toBeDefined();
  });

  it("puede volver atrás desde UnitEditor a Inventario", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("inventory-form")).toBeDefined();
  });

  // === Cancel from GeneralDataForm ===

  it("navega a /proyectos al cancelar en GeneralDataForm", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockPush).toHaveBeenCalledWith("/proyectos");
  });

  // === generateEstructura ===

  it("llama a generateEstructura con la configuración del inventario", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    expect(mockGenerateEstructura).toHaveBeenCalledWith(
      expect.objectContaining({
        numTorres: 1,
        pisosPorTorre: 5,
        depasPorPiso: 4,
        cocherasPorPiso: 2,
        depositosPorPiso: 1,
      })
    );
  });

  it("pasa las torres generadas al UnitEditorStep", () => {
    mockGenerateEstructura.mockReturnValue(sampleTorres);
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("torres-count").textContent).toBe("1");
  });

  // === Successful project creation ===

  it("llama a createProject con los datos generales", async () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "",
          departamento: "",
          descripcion: "",
        })
      );
    });
  });

  it("llama a createInventory con el projectId y las torres", async () => {
    mockGenerateEstructura.mockReturnValue(sampleTorres);

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockCreateInventory).toHaveBeenCalledWith(
        "proj-123",
        sampleTorres
      );
    });
  });

  it("muestra mensaje de éxito al completar la creación", async () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(
        screen.getByText("Proyecto creado exitosamente.")
      ).toBeDefined();
    });
  });

  it("navega a la página del proyecto tras el timeout de éxito", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    // The async function awaits createProject and createInventory,
    // then schedules a 1200ms setTimeout for navigation.
    // Advance all timers to flush both microtasks and the timer.
    await vi.advanceTimersByTimeAsync(1200);

    expect(mockPush).toHaveBeenCalledWith("/proyectos/proj-123");
    expect(mockRefresh).toHaveBeenCalled();

    vi.useRealTimers();
  });

  // === Loading overlay ===

  it("muestra el loading overlay durante la creación", async () => {
    let resolveProject: (value: { id: string }) => void;
    mockCreateProject.mockReturnValue(
      new Promise((resolve) => {
        resolveProject = resolve;
      })
    );

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toBeDefined();
    });

    // Cleanup: resolve pending promise
    resolveProject!({ id: "proj-123" });
    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalled();
    });
  });

  it("muestra 'Creando proyecto general...' como primer mensaje de carga", async () => {
    let resolveProject: (value: { id: string }) => void;
    mockCreateProject.mockReturnValue(
      new Promise((resolve) => {
        resolveProject = resolve;
      })
    );

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(
        screen.getByText("Creando proyecto general...")
      ).toBeDefined();
    });

    resolveProject!({ id: "proj-123" });
    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalled();
    });
  });

  it("muestra 'Generando estructura física y unidades...' tras crear el proyecto", async () => {
    let resolveInventory: (value: void) => void;
    mockCreateProject.mockResolvedValue({ id: "proj-123" });
    mockCreateInventory.mockReturnValue(
      new Promise((resolve) => {
        resolveInventory = resolve;
      })
    );

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(
        screen.getByText("Generando estructura física y unidades...")
      ).toBeDefined();
    });

    resolveInventory!(undefined);
  });

  // === Error handling ===

  it("muestra error cuando createProject falla", async () => {
    mockCreateProject.mockRejectedValue(new Error("Error de red"));

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Error de red")).toBeDefined();
    });
  });

  it("muestra el banner con el prefijo 'Error:'", async () => {
    mockCreateProject.mockRejectedValue(new Error("Fallo"));

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      const banner = screen.getByText(/^Error:/);
      expect(banner).toBeDefined();
    });
  });

  it("llama a console.error cuando falla la creación", async () => {
    mockCreateProject.mockRejectedValue(new Error("Test error"));

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating project:",
        expect.any(Error)
      );
    });
  });

  it("muestra error cuando createInventory falla", async () => {
    mockCreateProject.mockResolvedValue({ id: "proj-123" });
    mockCreateInventory.mockRejectedValue(new Error("Error de inventario"));

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Error de inventario")).toBeDefined();
    });
  });

  it("muestra mensaje genérico cuando el error no es de tipo Error", async () => {
    mockCreateProject.mockRejectedValue("error en string");

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(
        screen.getByText(/Ocurrió un error al crear el proyecto/)
      ).toBeDefined();
    });
  });

  it("oculta el loading overlay cuando ocurre un error", async () => {
    mockCreateProject.mockRejectedValue(new Error("Fallo"));

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.queryByTestId("loading")).toBeNull();
    });
  });

  it("mantiene visible el UnitEditor al ocurrir un error", async () => {
    mockCreateProject.mockRejectedValue(new Error("Fallo"));

    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText(/^Error:/)).toBeDefined();
    });
    expect(screen.getByTestId("unit-editor")).toBeDefined();
  });

  // === Breadcrumb active state ===

  it("muestra el paso 1 activo (opacity-100) en GENERAL", () => {
    render(<NewProjectWizard />);
    const stepOne = screen.getByText("Datos generales").closest("div");
    expect(stepOne?.className).toContain("opacity-100");
  });

  it("muestra el paso 2 activo (opacity-100) en INVENTORY", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    const stepTwo = screen.getByText("Inventario").closest("div");
    expect(stepTwo?.className).toContain("opacity-100");
  });

  it("muestra el paso 3 activo (opacity-100) en UNIT_EDITOR", () => {
    render(<NewProjectWizard />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    const stepThree = screen.getByText("Editar unidades").closest("div");
    expect(stepThree?.className).toContain("opacity-100");
  });
});
