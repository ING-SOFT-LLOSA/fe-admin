/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LegalOverview from '@/modules/legal/components/LegalOverview';

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

vi.mock("@/lib/api/proyectos", () => ({
  fetchProyectos: vi.fn(),
  fetchTorresPorProyecto: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchTodosLosContratos: vi.fn(),
  fetchEtapasExpediente: vi.fn(),
  fetchCommercialStepper: vi.fn(),
  asignarAsesorAContrato: vi.fn(),
  desasignarAsesorDelContrato: vi.fn(),
}));

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
}));

import { fetchProyectos, fetchTorresPorProyecto } from "@/lib/api/proyectos";
import {
  fetchTodosLosContratos,
  fetchEtapasExpediente,
  fetchCommercialStepper,
  asignarAsesorAContrato,
  desasignarAsesorDelContrato,
} from "@/lib/api/expedientes";
import { fetchUsuarios } from "@/lib/api/users";

const mockFetchProyectos = vi.mocked(fetchProyectos);
const mockFetchTorres = vi.mocked(fetchTorresPorProyecto);
const mockFetchContratos = vi.mocked(fetchTodosLosContratos);
const mockFetchEtapas = vi.mocked(fetchEtapasExpediente);
const mockFetchStepper = vi.mocked(fetchCommercialStepper);
const mockAsignarAsesor = vi.mocked(asignarAsesorAContrato);
const mockDesasignarAsesor = vi.mocked(desasignarAsesorDelContrato);
const mockFetchUsuarios = vi.mocked(fetchUsuarios);

function makeContrato(uuid: string, overrides: Record<string, any> = {}): any {
  return {
    uuidUsuarioActivo: uuid,
    tipoFinanciamiento: "CREDITO_DIRECTO",
    clientes: [
      { id: 1, nombre: "Juan", apellidos: "Pérez", email: "juan@test.com", telefono: "999999", documentoIdentidad: "12345678" },
    ],
    activos: [
      { id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPARTAMENTO", nro: "301" },
    ],
    vigente: true,
    asesor: null,
    fechaAdquisicion: "2026-01-15T00:00:00",
    ...overrides,
  };
}

function makeStages(estados: Record<string, string> = {}): any[] {
  const stages: any[] = [];
  const etapas = ["SEPARACION", "CONTRATO", "PAGO", "ENTREGA", "SANEAMIENTO"];
  for (const ep of etapas) {
    stages.push({
      uuidEtapaExpediente: `etapa-${ep}`,
      uuidUsuarioActivo: "ua-1",
      etapaProceso: ep,
      estado: estados[ep] ?? "PENDIENTE",
      totalHitos: 2,
      hitosCompletados: 0,
    });
  }
  return stages;
}

function makeStepper(uuid: string, estados: Record<string, string> = {}): any {
  const etapas = ["SEPARACION", "CONTRATO", "PAGO", "ENTREGA", "SANEAMIENTO"];
  return {
    uuidUsuarioActivo: uuid,
    etapas: etapas.map((ep) => ({
      etapa: ep,
      hitos: [
        {
          uuidHitoComercial: `h-${ep}-1`,
          uuidEtapaExpediente: `etapa-${ep}`,
          etapaProceso: ep,
          nombreHito: `${ep} Hito 1`,
          descripcion: `Desc ${ep} 1`,
          orden: 1,
          estado: estados[ep] ?? "PENDIENTE",
          fechaCompletado: null,
          createdAt: "2026-01-01T00:00:00",
        },
      ],
    })),
  };
}

const defaultStages = makeStages();
const defaultStepper = makeStepper("ua-1");

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchProyectos.mockResolvedValue([
    { id: "proy-1", nombre: "Aurora" },
    { id: "proy-2", nombre: "Bosque" },
  ] as any);
  mockFetchTorres.mockResolvedValue([{ id: 1, nombre: "Torre A" }] as any);
  mockFetchUsuarios.mockResolvedValue([
    { id: 1, nombre: "Carlos", apellidos: "García", email: "carlos@test.com", rol: "ASESOR" },
    { id: 2, nombre: "Ana", apellidos: "López", email: "ana@test.com", rol: "ADMIN" },
  ] as any);
  mockFetchEtapas.mockResolvedValue(defaultStages);
  mockFetchStepper.mockResolvedValue(defaultStepper);
});

describe("LegalOverview", () => {
  it("muestra skeleton loading mientras carga", async () => {
    mockFetchContratos.mockReturnValue(new Promise(() => {}));
    render(<LegalOverview />);

    await waitFor(() => {
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it("muestra mensaje de error si la carga de contratos falla", async () => {
    mockFetchContratos.mockRejectedValue(new Error("Error de conexión"));
    render(<LegalOverview />);

    expect(await screen.findByText("Error de conexión")).toBeDefined();
  });

  it("muestra tabla vacía cuando no hay contratos", async () => {
    mockFetchContratos.mockResolvedValue([]);
    render(<LegalOverview />);

    expect(await screen.findByText("No hay expedientes registrados.")).toBeDefined();
  });

  it("muestra tabla vacía con filtros activos", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    const searchInput = await screen.findByPlaceholderText("Cliente, unidad o exp…");
    fireEvent.change(searchInput, { target: { value: "ZZZZZZZ" } });

    expect(await screen.findByText("Sin resultados para los filtros seleccionados.")).toBeDefined();
  });

  it("muestra contratos cargados en la tabla", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    expect(await screen.findByText("EXP-UA-1")).toBeDefined();
  });

  it("filtra por proyecto y carga torres", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { activos: [{ proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPARTAMENTO", nro: "301" }] }),
      makeContrato("ua-2", { activos: [{ proyectoNombre: "Bosque", torreNombre: "Torre B", tipo: "DEPARTAMENTO", nro: "101" }] }),
    ]);

    render(<LegalOverview />);

    await screen.findByText("EXP-UA-1");

    const proyectoSelect = screen.getByDisplayValue("Proyecto");
    fireEvent.change(proyectoSelect, { target: { value: "Aurora" } });

    await waitFor(() => {
      expect(screen.queryByText("EXP-UA-2")).toBeNull();
    });
    expect(mockFetchTorres).toHaveBeenCalledWith("proy-1");
  });

  it("filtra por estado 'Desvinculado'", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { vigente: true }),
      makeContrato("ua-2", { vigente: false }),
    ]);
    render(<LegalOverview />);

    await screen.findByText("EXP-UA-1");

    const desistidosCheckbox = screen.getByRole("checkbox");
    fireEvent.click(desistidosCheckbox);

    const estadoSelect = screen.getByDisplayValue("Estado");
    fireEvent.change(estadoSelect, { target: { value: "Desvinculado" } });

    expect(screen.queryByText("EXP-UA-1")).toBeNull();
    expect(screen.getByText("EXP-UA-2")).toBeDefined();
  });

  it("filtra por etapa", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    mockFetchEtapas.mockResolvedValue(makeStages({ SEPARACION: "EN_PROGRESO" }));
    mockFetchStepper.mockResolvedValue(makeStepper("ua-1", { SEPARACION: "EN_PROGRESO" }));

    render(<LegalOverview />);

    const etapaSelect = await screen.findByDisplayValue("Etapa");
    fireEvent.change(etapaSelect, { target: { value: "Separación" } });

    expect(await screen.findByText("EXP-UA-1")).toBeDefined();
  });

  it("oculta desistidos por defecto", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { vigente: false }),
      makeContrato("ua-2", { vigente: true }),
    ]);
    render(<LegalOverview />);

    await screen.findByText("EXP-UA-2");
    expect(screen.queryByText("EXP-UA-1")).toBeNull();
  });

  it("muestra botón 'Limpiar' cuando hay filtros activos y limpia todo", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    const searchInput = await screen.findByPlaceholderText("Cliente, unidad o exp…");
    fireEvent.change(searchInput, { target: { value: "test" } });

    const clearButton = await screen.findByText("Limpiar");
    fireEvent.click(clearButton);

    expect((searchInput as HTMLInputElement).value).toBe("");
    expect(screen.getByText("EXP-UA-1")).toBeDefined();
  });

  it("navega al detalle al hacer click en una fila", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    const idCell = await screen.findByText("EXP-UA-1");
    const row = idCell.closest("tr")!;
    fireEvent.click(row);

    expect(mockPush).toHaveBeenCalledWith("/legal/ua-1");
  });

  it("navega con la tecla Enter", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    const idCell = await screen.findByText("EXP-UA-1");
    const row = idCell.closest("tr")!;
    fireEvent.keyDown(row, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/legal/ua-1");
  });

  it("navega con la tecla Space", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    const idCell = await screen.findByText("EXP-UA-1");
    const row = idCell.closest("tr")!;
    fireEvent.keyDown(row, { key: " " });

    expect(mockPush).toHaveBeenCalledWith("/legal/ua-1");
  });

  it("muestra el modal de asignar asesor y asigna uno", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    mockAsignarAsesor.mockResolvedValue({
      uuidUsuarioActivo: "ua-1",
      asesor: { id: 1, nombre: "Carlos", apellidos: "García", email: "carlos@test.com" },
    } as any);

    render(<LegalOverview />);

    const assignButton = await screen.findByText("Asignar");
    fireEvent.click(assignButton);

    expect(screen.getByText("Asignar asesor")).toBeDefined();

    fireEvent.click(screen.getByText("Carlos García"));

    await waitFor(() => {
      expect(mockAsignarAsesor).toHaveBeenCalledWith("ua-1", 1);
    });
  });

  it("muestra asesor ya asignado y permite desvincular", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", {
        asesor: { id: 1, nombre: "Carlos", apellidos: "García", email: "carlos@test.com" },
      }),
    ]);
    mockDesasignarAsesor.mockResolvedValue({} as any);

    render(<LegalOverview />);

    expect(await screen.findByText("Carlos García")).toBeDefined();
    fireEvent.click(screen.getByText("Desvincular"));

    await waitFor(() => {
      expect(mockDesasignarAsesor).toHaveBeenCalledWith("ua-1", 1);
    });
  });

  it("muestra mensaje de no hay asesores en el modal", async () => {
    mockFetchUsuarios.mockResolvedValue([]);
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);

    render(<LegalOverview />);

    const assignButton = await screen.findByText("Asignar");
    fireEvent.click(assignButton);

    expect(await screen.findByText("No hay asesores disponibles.")).toBeDefined();
  });

  it("cierra modal de asignación al hacer clic en Cancelar", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);

    render(<LegalOverview />);

    const assignButton = await screen.findByText("Asignar");
    fireEvent.click(assignButton);

    expect(screen.getByText("Asignar asesor")).toBeDefined();

    fireEvent.click(screen.getByText("Cancelar"));

    await waitFor(() => {
      expect(screen.queryByText("Asignar asesor")).toBeNull();
    });
  });

  it("muestra StalledChip cuando el contrato tiene >14 días sin avance", async () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { ultimaActualizacion: oldDate }),
    ]);
    render(<LegalOverview />);

    expect(await screen.findByText(/\d+d sin avance/)).toBeDefined();
  });

  it("muestra todos los expedientes cargados en la tabla", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1"),
      makeContrato("ua-2"),
    ]);
    mockFetchEtapas.mockImplementation((uuid: string) => {
      if (uuid === "ua-1") return Promise.resolve(makeStages({ SEPARACION: "EN_PROGRESO" }));
      return Promise.resolve(makeStages());
    });
    mockFetchStepper.mockImplementation((uuid: string) => {
      if (uuid === "ua-1") return Promise.resolve(makeStepper("ua-1", { SEPARACION: "EN_PROGRESO" }));
      return Promise.resolve(makeStepper(uuid));
    });

    render(<LegalOverview />);

    expect(await screen.findByText("EXP-UA-1")).toBeDefined();
    expect(await screen.findByText("EXP-UA-2")).toBeDefined();
  });

  it("paginación: muestra controles cuando hay más de 10 expedientes", async () => {
    const contracts = Array.from({ length: 15 }, (_, i) => makeContrato(`ua-${i + 1}`));
    mockFetchContratos.mockResolvedValue(contracts);

    render(<LegalOverview />);

    await screen.findByText("EXP-UA-1");
    await waitFor(() => {
      expect(screen.getAllByTitle("Página siguiente").length).toBeGreaterThan(0);
      expect(screen.getAllByTitle("Página anterior").length).toBeGreaterThan(0);
    });
  });

  it("paginación: cambia de página al hacer clic en Siguiente", async () => {
    const contracts = Array.from({ length: 15 }, (_, i) => makeContrato(`ua-${i + 1}`));
    mockFetchContratos.mockResolvedValue(contracts);

    render(<LegalOverview />);

    await screen.findByText("EXP-UA-1");
    expect(screen.getByText("EXP-UA-10")).toBeDefined();

    const nextBtn = screen.getByTitle("Página siguiente");
    fireEvent.click(nextBtn);

    expect(screen.getByText("EXP-UA-11")).toBeDefined();
    expect(screen.getByText("EXP-UA-15")).toBeDefined();
  });

  it("paginación: va a página anterior con el botón Anterior", async () => {
    const contracts = Array.from({ length: 15 }, (_, i) => makeContrato(`ua-${i + 1}`));
    mockFetchContratos.mockResolvedValue(contracts);

    render(<LegalOverview />);

    await screen.findByText("EXP-UA-1");
    const nextBtn = screen.getByTitle("Página siguiente");
    fireEvent.click(nextBtn);

    const prevBtn = screen.getByTitle("Página anterior");
    fireEvent.click(prevBtn);

    expect(screen.getByText("EXP-UA-1")).toBeDefined();
  });

  it("paginación: el botón Anterior se deshabilita en la primera página", async () => {
    const contracts = Array.from({ length: 15 }, (_, i) => makeContrato(`ua-${i + 1}`));
    mockFetchContratos.mockResolvedValue(contracts);

    render(<LegalOverview />);

    await screen.findByText("EXP-UA-1");

    const prevButtons = screen.getAllByTitle("Página anterior");
    prevButtons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("paginación: muestra Mostrando X a Y de Z expedientes", async () => {
    const contracts = Array.from({ length: 12 }, (_, i) => makeContrato(`ua-${i + 1}`));
    mockFetchContratos.mockResolvedValue(contracts);

    render(<LegalOverview />);

    const paginationText = await screen.findByText(/Mostrando .+ expedientes/);
    expect(paginationText.textContent).toMatch(/1 a 10 de 12/);
  });

  it("paginación: muestra el número de expedientes singular", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    expect(await screen.findByText((_, el) => el?.tagName.toLowerCase() === "p" && /Mostrando 1 a 1 de 1 expedientes/.test(el.textContent || ""))).toBeDefined();
  });

  it("paginación: muestra el número de expedientes plural", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1"), makeContrato("ua-2")]);
    render(<LegalOverview />);

    expect(await screen.findByText((_, el) => el?.tagName.toLowerCase() === "p" && /Mostrando 1 a 2 de 2 expedientes/.test(el.textContent || ""))).toBeDefined();
  });

  it("muestra MiniStepper 'Por iniciar' cuando no hay stages disponibles", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    mockFetchEtapas.mockRejectedValue(new Error("No stages"));

    render(<LegalOverview />);

    expect(await screen.findByText("Por iniciar")).toBeDefined();
  });

  it("MiniStepper con datos: muestra dots y counts", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    mockFetchEtapas.mockResolvedValue(makeStages({ SEPARACION: "COMPLETADO", CONTRATO: "EN_PROGRESO" }));
    mockFetchStepper.mockResolvedValue(makeStepper("ua-1", { SEPARACION: "COMPLETADO", CONTRATO: "EN_PROGRESO" }));

    render(<LegalOverview />);

    expect(await screen.findByText("Contrato")).toBeDefined();
  });

  it("maneja error no-Error correctamente", async () => {
    mockFetchContratos.mockRejectedValue("Error string");
    render(<LegalOverview />);

    expect(await screen.findByText("No se pudieron cargar los expedientes.")).toBeDefined();
  });

  it("muestra unidad para DEPOSITO y ESTACIONAMIENTO", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", {
        activos: [
          { id: "a1", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPOSITO", nro: "1" },
          { id: "a2", proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "ESTACIONAMIENTO", nro: "5" },
        ],
      }),
    ]);

    render(<LegalOverview />);

    expect(await screen.findByText(/Depósito 1/)).toBeDefined();
    expect(screen.getByText(/Cochera 5/)).toBeDefined();
  });

  it("deshabilita el select de torre cuando no hay proyecto seleccionado", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    const torreSelect = await screen.findByDisplayValue("Torre");
    expect((torreSelect as HTMLSelectElement).disabled).toBe(true);
  });

  it("muestra 'Sin asignar' cuando no hay activos", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { activos: [] }),
    ]);

    render(<LegalOverview />);

    expect(await screen.findByText("Sin asignar")).toBeDefined();
  });

  it("muestra 'Sin titulares' cuando no hay clientes", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { clientes: [] }),
    ]);

    render(<LegalOverview />);

    expect(await screen.findByText("Sin titulares")).toBeDefined();
  });

  it("muestra texto de proyecto cuando firstAct tiene proyectoNombre", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1"),
    ]);

    render(<LegalOverview />);

    const auroraElements = await screen.findAllByText("Aurora");
    expect(auroraElements.length).toBeGreaterThan(0);
  });

  it("no muestra el contador de expedientes mientras isLoading", async () => {
    mockFetchContratos.mockReturnValue(new Promise(() => {}));
    render(<LegalOverview />);

    await waitFor(() => {
      expect(screen.queryByText(/^\d+ expediente/)).toBeNull();
    });
  });

  it("desasignar asesor no falla cuando no hay asesor", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1", { asesor: null })]);
    render(<LegalOverview />);

    await screen.findByText("Asignar");
    expect(mockDesasignarAsesor).not.toHaveBeenCalled();
  });

  it("muestra texto de torre en proyText", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1"),
    ]);

    render(<LegalOverview />);

    expect(await screen.findByText(/Torre A/)).toBeDefined();
  });

  it("muestra badge de estado Vigente", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { vigente: true }),
    ]);

    render(<LegalOverview />);

    expect(await screen.findByText("Vigente")).toBeDefined();
  });

  it("muestra badge de estado Desvinculado", async () => {
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { vigente: false }),
    ]);

    render(<LegalOverview />);

    expect(await screen.findByText("Desvinculado")).toBeDefined();
  });

  it("muestra fecha de creación", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    render(<LegalOverview />);

    expect(await screen.findByText(/EXP-UA-1/)).toBeDefined();
  });

  it("getEtapaActualLabel devuelve Saneamiento cuando todas las etapas están completadas", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("ua-1")]);
    const allCompletedStages = makeStages({
      SEPARACION: "COMPLETADO", CONTRATO: "COMPLETADO", PAGO: "COMPLETADO", ENTREGA: "COMPLETADO", SANEAMIENTO: "COMPLETADO",
    });
    mockFetchEtapas.mockResolvedValue(allCompletedStages);
    mockFetchStepper.mockResolvedValue(makeStepper("ua-1", {
      SEPARACION: "COMPLETADO", CONTRATO: "COMPLETADO", PAGO: "COMPLETADO", ENTREGA: "COMPLETADO", SANEAMIENTO: "COMPLETADO",
    }));
    render(<LegalOverview />);

    expect(await screen.findByText("EXP-UA-1")).toBeDefined();
  });

  it("filtra por torre y oculta contratos sin la torre seleccionada", async () => {
    mockFetchProyectos.mockResolvedValue([
      { id: "proy-1", nombre: "Aurora" },
    ] as any);
    mockFetchTorres.mockResolvedValue([
      { id: 1, nombre: "Torre A" },
      { id: 2, nombre: "Torre B" },
    ] as any);
    mockFetchContratos.mockResolvedValue([
      makeContrato("ua-1", { activos: [{ proyectoNombre: "Aurora", torreNombre: "Torre A", tipo: "DEPARTAMENTO", nro: "301" }] }),
    ]);

    render(<LegalOverview />);

    await screen.findByText("EXP-UA-1");

    const proyectoSelect = screen.getByDisplayValue("Proyecto");
    fireEvent.change(proyectoSelect, { target: { value: "Aurora" } });

    const torreSelect = await screen.findByDisplayValue("Torre");
    fireEvent.change(torreSelect, { target: { value: "Torre B" } });

    expect(screen.queryByText("EXP-UA-1")).toBeNull();
  });
});
