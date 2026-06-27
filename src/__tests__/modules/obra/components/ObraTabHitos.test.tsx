/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ObraTabHitos from '@/modules/obra/components/ObraTabHitos';

vi.mock("@/lib/api/obra", () => ({
  crearEtapaProyecto: vi.fn(),
  getAvancesActivo: vi.fn(),
  updateAvanceUnidad: vi.fn(),
  getEtapasByProyecto: vi.fn(),
}));

vi.mock("@/lib/api/proyectos", () => ({
  fetchTorresPorProyecto: vi.fn(),
  fetchPisosPorTorre: vi.fn(),
  fetchActivosPorProyecto: vi.fn(),
}));

import {
  crearEtapaProyecto,
  getAvancesActivo,
  updateAvanceUnidad,
} from "@/lib/api/obra";
import {
  fetchTorresPorProyecto,
  fetchPisosPorTorre,
  fetchActivosPorProyecto,
} from "@/lib/api/proyectos";

const mockCrear = vi.mocked(crearEtapaProyecto);
const mockGetAvances = vi.mocked(getAvancesActivo);
const mockUpdateAvance = vi.mocked(updateAvanceUnidad);
const mockTorres = vi.mocked(fetchTorresPorProyecto);
const mockPisos = vi.mocked(fetchPisosPorTorre);
const mockActivos = vi.mocked(fetchActivosPorProyecto);

const sampleEtapas = [
  { id: 1, nombre: "Cimentación", orden: 1, estado: "COMPLETADO", hitos: [] },
  { id: 2, nombre: "Estructura", orden: 2, estado: "EN_PROGRESO", hitos: [] },
  { id: 3, nombre: "Acabados", orden: 3, estado: "PENDIENTE", hitos: [] },
];

describe("ObraTabHitos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCrear.mockResolvedValue({} as any);
    mockGetAvances.mockResolvedValue([]);
    mockUpdateAvance.mockResolvedValue({} as any);
    mockTorres.mockResolvedValue([]);
    mockPisos.mockResolvedValue([]);
    mockActivos.mockResolvedValue({ content: [] } as any);
  });

  it("muestra tabs de nivel y resumen cuando hay etapas", () => {
    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    expect(screen.getByText("Por proyecto")).toBeDefined();
    expect(screen.getByText("Por piso")).toBeDefined();
    expect(screen.getByText("Hitos maestros del proyecto")).toBeDefined();
    expect(screen.getByText("3 hitos configurados")).toBeDefined();
  });

  it("muestra badge Predefinidos cuando ya hay etapas", () => {
    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    expect(screen.getByText("Predefinidos")).toBeDefined();
  });

  it("renderiza filas para cada etapa con su estado", () => {
    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    expect(screen.getByText("Cimentación")).toBeDefined();
    expect(screen.getByText("Estructura")).toBeDefined();
    expect(screen.getByText("Acabados")).toBeDefined();
    expect(screen.getByText("Completado")).toBeDefined();
    expect(screen.getByText("En progreso")).toBeDefined();
    expect(screen.getByText("Pendiente")).toBeDefined();
  });

  it("muestra el estado vacío con botón de generar cuando no hay etapas", () => {
    render(<ObraTabHitos projectId="p-1" etapas={[]} onRefresh={vi.fn()} />);
    expect(screen.getByText("No hay hitos maestros registrados")).toBeDefined();
    expect(screen.getByText("Cargar hitos estándar")).toBeDefined();
  });

  it("genera hitos estándar al pulsar el botón", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<ObraTabHitos projectId="p-1" etapas={[]} onRefresh={onRefresh} />);

    const btn = screen.getByText("Cargar hitos estándar");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockCrear).toHaveBeenCalledTimes(10);
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it("muestra error si falla la generación de hitos", async () => {
    mockCrear.mockRejectedValue(new Error("Backend caído"));
    render(<ObraTabHitos projectId="p-1" etapas={[]} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByText("Cargar hitos estándar"));

    expect(await screen.findByText("Backend caído")).toBeDefined();
  });

  it("muestra error si la generación produce un error genérico", async () => {
    mockCrear.mockRejectedValue("no es un Error");
    render(<ObraTabHitos projectId="p-1" etapas={[]} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByText("Cargar hitos estándar"));

    expect(
      await screen.findByText(
        "No se pudieron generar todos los hitos. Verifica el backend.",
      ),
    ).toBeDefined();
  });

  it("no permite generar hitos si ya existen", () => {
    render(
      <ObraTabHitos
        projectId="p-1"
        etapas={sampleEtapas}
        onRefresh={vi.fn()}
      />,
    );

    // El botón no se muestra cuando hay etapas (estado vacío no se renderiza)
    expect(screen.queryByText("Cargar hitos estándar")).toBeNull();
  });

  it("muestra mensaje cuando no hay piso seleccionado", async () => {
    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));

    expect(
      await screen.findByText("Selecciona una torre y un piso para ver sus hitos."),
    ).toBeDefined();
  });

  it("cambia a tab Por piso y carga torres", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 5, nroSotanos: 1, areaComunM2: 100, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([
      { id: 10, nroPiso: 1 },
      { id: 11, nroPiso: 2 },
    ] as any);
    mockActivos.mockResolvedValue({
      content: [{ id: "a-1", pisoId: 10, nroPiso: 1, torreNombre: "A" } as any],
    } as any);

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));

    expect(await screen.findByText("Seleccionar piso:")).toBeDefined();
    await waitFor(() => {
      expect(mockTorres).toHaveBeenCalledWith("p-1");
    });
    await waitFor(() => {
      expect(mockPisos).toHaveBeenCalledWith(1);
    });
  });

  it("muestra mensaje de error de piso si no hay activo proxy", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 99, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({ content: [] } as any);

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));

    await waitFor(() => {
      expect(mockPisos).toHaveBeenCalled();
    });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "99" } });

    expect(
      await screen.findByText(
        /El piso seleccionado no tiene unidades registradas/,
      ),
    ).toBeDefined();
  });

  it("carga avances cuando hay activo proxy para el piso", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-proxy", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([
      {
        id: "av-1",
        hitoTitulo: "Cimentación",
        hitoOrden: 1,
        hitoTipo: "OBRA",
        estado: "PENDIENTE",
        fechaCompletado: null,
        porcentaje: 0,
      },
    ] as any);

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));

    await waitFor(() => {
      expect(mockPisos).toHaveBeenCalled();
    });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "10" } });

    expect(await screen.findByText("Cimentación")).toBeDefined();
    expect(mockGetAvances).toHaveBeenCalledWith("a-proxy");
  });

  it("permite toggle de estado de un piso y refresca", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-proxy", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([
      {
        id: "av-1",
        hitoTitulo: "Cimentación",
        hitoOrden: 1,
        hitoTipo: "OBRA",
        estado: "PENDIENTE",
        fechaCompletado: null,
        porcentaje: 0,
      },
    ] as any);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => { expect(mockPisos).toHaveBeenCalled(); });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "10" } });

    const toggle = await screen.findByText("Iniciar");
    await act(async () => {
      fireEvent.click(toggle);
    });

    await waitFor(() => {
      expect(mockUpdateAvance).toHaveBeenCalledWith("av-1", "EN_PROGRESO");
    });
  });

  it("permite toggle global de un hito maestro pendiente", async () => {
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-1", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([
      { id: "av-3", hitoTitulo: "Acabados", hitoOrden: 3, hitoTipo: "OBRA", estado: "PENDIENTE", fechaCompletado: null, porcentaje: 0 },
    ] as any);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    // solo 1 etapa PENDIENTE para que solo haya un botón "Iniciar"
    const etapas = [
      { id: 3, nombre: "Acabados", orden: 3, estado: "PENDIENTE", hitos: [] },
    ];
    render(<ObraTabHitos projectId="p-1" etapas={etapas} onRefresh={onRefresh} />);

    const completeBtn = screen.getByText("Iniciar");
    await act(async () => {
      fireEvent.click(completeBtn);
    });

    await waitFor(() => {
      expect(mockUpdateAvance).toHaveBeenCalledWith("av-3", "EN_PROGRESO");
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it("permite deshacer un hito global ya completado", async () => {
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-1", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([
      { id: "av-1", hitoTitulo: "X", hitoOrden: 1, hitoTipo: "OBRA", estado: "COMPLETADO", fechaCompletado: null, porcentaje: 100 },
    ] as any);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={onRefresh} />);
    const reset = screen.getByText("Deshacer");
    await act(async () => {
      fireEvent.click(reset);
    });

    await waitFor(() => {
      expect(mockUpdateAvance).toHaveBeenCalledWith("av-1", "EN_PROGRESO");
    });
  });

  it("reporta errores parciales cuando updateAvanceUnidad falla en toggle global", async () => {
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-1", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
        { id: "a-2", pisoId: 11, nro: "A-102", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    // Primer getAvances: 1 match; segundo: 0 matches (no genera error)
    mockGetAvances
      .mockResolvedValueOnce([
        { id: "av-1", hitoTitulo: "X", hitoOrden: 1, hitoTipo: "OBRA", estado: "PENDIENTE", fechaCompletado: null, porcentaje: 0 },
      ] as any)
      .mockResolvedValueOnce([] as any);
    mockUpdateAvance.mockRejectedValueOnce(new Error("boom"));

    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const etapas = [
      { id: 1, nombre: "X", orden: 1, estado: "PENDIENTE", hitos: [] },
    ];
    render(<ObraTabHitos projectId="p-1" etapas={etapas} onRefresh={onRefresh} />);

    const completeBtn = screen.getByText("Iniciar");
    await act(async () => {
      fireEvent.click(completeBtn);
    });

    expect(await screen.findByText(/Algunos hitos no se pudieron modificar/)).toBeDefined();
  });

  it("muestra mensaje de éxito cuando toggle global funciona", async () => {
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-1", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([
      { id: "av-1", hitoTitulo: "X", hitoOrden: 1, hitoTipo: "OBRA", estado: "PENDIENTE", fechaCompletado: null, porcentaje: 0 },
    ] as any);
    mockUpdateAvance.mockResolvedValue({} as any);
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const etapas = [
      { id: 1, nombre: "Cimentación", orden: 1, estado: "PENDIENTE", hitos: [] },
    ];
    render(<ObraTabHitos projectId="p-1" etapas={etapas} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByText("Iniciar"));

    expect(
      await screen.findByText(/Cimentación.*en progreso/),
    ).toBeDefined();
  });

  it("muestra error si el toggle global lanza una excepción", async () => {
    mockActivos.mockRejectedValue(new Error("Falla en fetchActivos"));
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const etapas = [
      { id: 1, nombre: "X", orden: 1, estado: "PENDIENTE", hitos: [] },
    ];
    render(<ObraTabHitos projectId="p-1" etapas={etapas} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByText("Iniciar"));

    expect(await screen.findByText("Falla en fetchActivos")).toBeDefined();
  });

  it("muestra error genérico si el toggle global no es un Error", async () => {
    mockActivos.mockRejectedValue("texto crudo");
    const etapas = [
      { id: 1, nombre: "X", orden: 1, estado: "PENDIENTE", hitos: [] },
    ];
    render(<ObraTabHitos projectId="p-1" etapas={etapas} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByText("Iniciar"));

    expect(
      await screen.findByText("Error al actualizar el hito global."),
    ).toBeDefined();
  });

  it("muestra error si falla updateAvanceUnidad a nivel piso", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-proxy", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([
      { id: "av-1", hitoTitulo: "Cimentación", hitoOrden: 1, hitoTipo: "OBRA", estado: "PENDIENTE", fechaCompletado: null, porcentaje: 0 },
    ] as any);
    mockUpdateAvance.mockRejectedValue(new Error("Hito previo no completado"));

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => { expect(mockPisos).toHaveBeenCalled(); });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "10" } });

    const toggle = await screen.findByText("Iniciar");
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(await screen.findByText("Hito previo no completado")).toBeDefined();
  });

  it("muestra error si getAvancesActivo falla a nivel piso", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-proxy", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockRejectedValue(new Error("No se pudieron cargar hitos"));

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => { expect(mockPisos).toHaveBeenCalled(); });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "10" } });

    expect(await screen.findByText("No se pudieron cargar hitos")).toBeDefined();
  });

  it("muestra error si updateAvanceUnidad lanza algo no-Error a nivel piso", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-proxy", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([
      { id: "av-1", hitoTitulo: "Cimentación", hitoOrden: 1, hitoTipo: "OBRA", estado: "PENDIENTE", fechaCompletado: null, porcentaje: 0 },
    ] as any);
    mockUpdateAvance.mockRejectedValue("fallo crudo");

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => { expect(mockPisos).toHaveBeenCalled(); });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "10" } });

    const toggle = await screen.findByText("Iniciar");
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(
      await screen.findByText(
        "No se pudo actualizar el estado. Verifica si el hito anterior está completado.",
      ),
    ).toBeDefined();
  });

  it("muestra mensaje 'No hay hitos registrados' cuando el piso no tiene avances", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-proxy", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([]);

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => { expect(mockPisos).toHaveBeenCalled(); });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "10" } });

    expect(await screen.findByText(/No hay hitos registrados/)).toBeDefined();
  });

  it("muestra sugerencia de cargar hitos si no hay etapas y piso sin avances", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 1, nroSotanos: 0, areaComunM2: 0, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({
      content: [
        { id: "a-proxy", pisoId: 10, nro: "A-101", tipo: "DEP", areaM2: 50, areaTechada: 50, estadoComercial: "DISP", precio: 100, descripcion: "" } as any,
      ],
    } as any);
    mockGetAvances.mockResolvedValue([]);

    render(<ObraTabHitos projectId="p-1" etapas={[]} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => { expect(mockPisos).toHaveBeenCalled(); });

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });

    await waitFor(() => {
      const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
      expect(pisoSelect.options.length).toBeGreaterThan(1);
    });
    const pisoSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(pisoSelect, { target: { value: "10" } });

    expect(
      await screen.findByText(/Primero carga los hitos maestros/),
    ).toBeDefined();
  });

  it("muestra error al cargar torres (maneja el reject de fetchTorresPorProyecto)", async () => {
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {});
    mockTorres.mockRejectedValue(new Error("fallo torres"));
    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalled();
    });
    consoleErr.mockRestore();
  });

  it("maneja error al cargar activos", async () => {
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {});
    mockActivos.mockRejectedValue(new Error("fallo activos"));
    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalled();
    });
    consoleErr.mockRestore();
  });

  it("muestra 'Cargando torres' mientras se cargan", async () => {
    mockTorres.mockReturnValue(new Promise(() => {}));
    mockActivos.mockReturnValue(new Promise(() => {}) as any);
    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));
    expect(await screen.findByText(/Cargando torres/)).toBeDefined();
  });

  it("resetea el piso seleccionado al cambiar de torre", async () => {
    mockTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A", nroPisos: 5, nroSotanos: 1, areaComunM2: 100, proyectoId: "p-1" },
      { id: 2, nombre: "Torre B", nroPisos: 3, nroSotanos: 0, areaComunM2: 50, proyectoId: "p-1" },
    ] as any);
    mockPisos.mockResolvedValue([{ id: 10, nroPiso: 1 }] as any);
    mockActivos.mockResolvedValue({ content: [] } as any);

    render(<ObraTabHitos projectId="p-1" etapas={sampleEtapas} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByText("Por piso"));

    const torreSelect = (await screen.findAllByRole("combobox"))[0] as HTMLSelectElement;
    fireEvent.change(torreSelect, { target: { value: "1" } });
    await waitFor(() => expect(mockPisos).toHaveBeenCalledWith(1));

    fireEvent.change(torreSelect, { target: { value: "2" } });
    await waitFor(() => expect(mockPisos).toHaveBeenCalledWith(2));
  });
});
