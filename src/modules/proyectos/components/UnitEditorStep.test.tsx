import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UnitEditorStep from "./UnitEditorStep";
import type { TorreData, ActivoData, PisoData } from "@/modules/proyectos/utils/wizard-logic";

function makeUnit(nro: string, tipo: string, overrides: Partial<ActivoData> = {}): ActivoData {
  return {
    nro,
    tipo,
    areaM2: overrides.areaM2 ?? 70,
    areaTechada: overrides.areaTechada ?? 0,
    precio: overrides.precio ?? 200000,
    estadoComercial: overrides.estadoComercial ?? "DISPONIBLE",
    descripcion: overrides.descripcion ?? `Dpto ${nro}`,
  };
}

function makePiso(nroPiso: number, activos: ActivoData[] = []): PisoData {
  return { nroPiso, activos };
}

function makeTorre(nombre: string, pisos: PisoData[]): TorreData {
  return { nombre, pisos };
}

const sampleTorres: TorreData[] = [
  makeTorre("Torre A", [
    makePiso(1, [
      makeUnit("101", "DEPARTAMENTO", { areaM2: 80, areaTechada: 75, precio: 350000 }),
      makeUnit("102", "DEPARTAMENTO", { areaM2: 85, areaTechada: 78, precio: 370000 }),
    ]),
    makePiso(2, [
      makeUnit("201", "DEPARTAMENTO"),
    ]),
  ]),
  makeTorre("Torre B", [
    makePiso(1, [
      makeUnit("E-1", "COCHERA", { areaM2: 12, precio: 15000 }),
      makeUnit("D-1", "DEPOSITO", { areaM2: 5, precio: 5000 }),
    ]),
  ]),
];

describe("UnitEditorStep", () => {
  it("renders torre summaries", () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Torre A")).toBeDefined();
    expect(screen.getByText("Torre B")).toBeDefined();
  });

  it("shows total unit count", () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText(/Total de unidades:/)).toBeDefined();
  });

  it("shows floor sections with unit counts", () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const pisoElements = screen.getAllByText("Piso 1");
    expect(pisoElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows unit nros in UnitCards", () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("101")).toBeDefined();
    expect(screen.getByText("102")).toBeDefined();
    expect(screen.getByText("201")).toBeDefined();
    expect(screen.getByText("E-1")).toBeDefined();
    expect(screen.getByText("D-1")).toBeDefined();
  });

  it("opens edit mode when clicking edit on a UnitCard", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const editBtns = screen.getAllByTitle("Editar");
    fireEvent.click(editBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Listo")).toBeDefined();
    });
  });

  it("closes edit mode when clicking Listo", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    await waitFor(() => {
      expect(screen.getByText("Listo")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Listo"));
    await waitFor(() => {
      expect(screen.queryByText("Listo")).toBeNull();
    });
  });

  it("opens delete confirmation modal", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const deleteBtns = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/¿Eliminar la unidad/)).toBeDefined();
    });
  });

  it("cancels deletion from modal", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    await waitFor(() => {
      expect(screen.getByText("Cancelar")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByText(/¿Eliminar la unidad/)).toBeNull();
    });
  });

  it("confirms deletion and removes unit", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const initialCount = screen.getAllByText("101").length;
    
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    await waitFor(() => {
      expect(screen.getByText("Eliminar")).toBeDefined();
    });
    fireEvent.click(screen.getAllByText("Eliminar").find(el => el.closest(".fixed"))!);
    
    await waitFor(() => {
      expect(screen.queryByText("101")).toBeNull();
    });
  });

  it("adds a new DEPARTAMENTO unit when clicking agregar", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const addBtns = screen.getAllByText(/Agregar departamentos/i);
    fireEvent.click(addBtns[0]);
    await waitFor(() => {
      const unit101s = screen.queryAllByText("101");
      expect(unit101s.length).toBeGreaterThan(0);
    });
  });

  it("adds a new COCHERA unit", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const addBtns = screen.getAllByText(/Agregar cocheras/i);
    fireEvent.click(addBtns[0]);
    await waitFor(() => {
      const cocheras = screen.queryAllByText(/^E-/);
      expect(cocheras.length).toBeGreaterThan(0);
    });
  });

  it("adds a new DEPOSITO unit", async () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    const addBtns = screen.getAllByText(/Agregar depósitos/i);
    fireEvent.click(addBtns[0]);
    await waitFor(() => {
      const depositos = screen.queryAllByText(/^D-/);
      expect(depositos.length).toBeGreaterThan(0);
    });
  });

  it("calls onBack when Volver is clicked", () => {
    const onBack = vi.fn();
    render(<UnitEditorStep torres={sampleTorres} onBack={onBack} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText("Volver"));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onSubmit with current torres data", () => {
    const onSubmit = vi.fn();
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("Crear proyecto"));
    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0]).toBeDefined();
  });

  it("does not call onSubmit and shows error if areaTechada > areaM2", () => {
    const onSubmit = vi.fn();
    const invalidTorres: TorreData[] = [
      makeTorre("Torre A", [
        makePiso(1, [
          makeUnit("101", "DEPARTAMENTO", { areaM2: 70, areaTechada: 80, precio: 350000 }),
        ]),
      ]),
    ];
    render(<UnitEditorStep torres={invalidTorres} onBack={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("Crear proyecto"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/El área techada no puede ser superior al área ocupada/)).toBeDefined();
  });

  it("shows price and area info for each unit", () => {
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText(/80 m²/)).toBeDefined();
    expect(screen.getByText(/350,000/)).toBeDefined();
  });

  it("defaults areaTechada to areaM2 when areaM2 is edited", async () => {
    const onSubmit = vi.fn();
    render(<UnitEditorStep torres={sampleTorres} onBack={vi.fn()} onSubmit={onSubmit} />);
    
    const editBtns = screen.getAllByTitle("Editar");
    fireEvent.click(editBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Listo")).toBeDefined();
    });

    const areaOcupadaInput = screen.getByLabelText("Ocupada (m²)") as HTMLInputElement;
    const areaTechadaInput = screen.getByLabelText("Tech. (m²)") as HTMLInputElement;

    fireEvent.change(areaOcupadaInput, { target: { value: "90" } });
    expect(areaOcupadaInput.value).toBe("90");
    expect(areaTechadaInput.value).toBe("90");
  });
});
