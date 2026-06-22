/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("@/lib/api/expedientes", () => ({
  fetchCommercialStepper: vi.fn(),
  createCommercialHito: vi.fn(),
  updateCommercialHitoEstado: vi.fn(),
  fetchEtapasExpediente: vi.fn(),
  fetchTodosLosContratos: vi.fn(),
}));

vi.mock("@/lib/api/requisitos", () => ({
  fetchStageDocuments: vi.fn(),
  createRequisito: vi.fn(),
}));

import {
  fetchCommercialStepper,
  createCommercialHito,
  updateCommercialHitoEstado,
  fetchEtapasExpediente,
  fetchTodosLosContratos,
} from "@/lib/api/expedientes";
import { fetchStageDocuments } from "@/lib/api/requisitos";
import {
  useCommercialStepper,
  useStageDocuments,
  useExpediente,
} from '@/modules/legal/components/hooks';
import type { UsuarioActivoResponseDTO, StepperResponseDTO } from "@/lib/api/expedientes";

const mockFetchStepper = vi.mocked(fetchCommercialStepper);
const mockCreateHito = vi.mocked(createCommercialHito);
const mockUpdateHitoEstado = vi.mocked(updateCommercialHitoEstado);
const mockFetchEtapas = vi.mocked(fetchEtapasExpediente);
const mockFetchContratos = vi.mocked(fetchTodosLosContratos);
const mockFetchStageDocuments = vi.mocked(fetchStageDocuments);
// const mockCreateRequisito = vi.mocked(createRequisito);

function makeContrato(uuid = "ua-1"): UsuarioActivoResponseDTO {
  return {
    uuidUsuarioActivo: uuid,
    tipoFinanciamiento: "Crédito Directo",
    clientes: [],
    activos: [],
    fechaAdquisicion: null,
    createdAt: null,
    updatedAt: null,
    vigente: true,
  };
}

function makeStepper(uuid = "ua-1", withHitos = false): StepperResponseDTO {
  return {
    uuidUsuarioActivo: uuid,
    etapas: [
      {
        etapa: "SEPARACION",
        porcentajeAvance: withHitos ? 50 : 0,
        hitos: withHitos
          ? [
              {
                uuidHitoComercial: "h-1",
                uuidEtapaExpediente: "etapa-uuid-1",
                etapaProceso: "SEPARACION",
                nombreHito: "Proforma",
                descripcion: "Envío de proforma",
                orden: 1,
                estado: "COMPLETADO",
                fechaCompletado: "2026-03-01",
                createdAt: "2026-01-01",
              },
            ]
          : [],
      },
    ],
  };
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  vi.stubGlobal('localStorage', localStorageMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe("useCommercialStepper", () => {
  it("no carga datos si contrato es null", async () => {
    const { result } = renderHook(() => useCommercialStepper(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stepper).toBeNull();
    expect(mockFetchStepper).not.toHaveBeenCalled();
  });

  it("carga el stepper cuando el contrato tiene hitos", async () => {
    const stepper = makeStepper("ua-1", true);
    mockFetchStepper.mockResolvedValue(stepper);

    const { result } = renderHook(() => useCommercialStepper(makeContrato("ua-1")));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stepper).toEqual(stepper);
    expect(result.current.error).toBe("");
  });

  it("mapea hitos del backend a etapas de ProcesoEtapa", async () => {
    const stepper = makeStepper("ua-1", true);
    mockFetchStepper.mockResolvedValue(stepper);

    const { result } = renderHook(() => useCommercialStepper(makeContrato("ua-1")));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.etapas).toHaveLength(1);
    expect(result.current.etapas[0].etapaProceso).toBe("SEPARACION");
    expect(result.current.etapas[0].estado).toBe("completado");
    expect(result.current.etapas[0].label).toBe("Proforma");
  });

  it("hace seed de hitos cuando el stepper está vacío", async () => {
    const emptyStepper = makeStepper("ua-1", false);
    const filledStepper = makeStepper("ua-1", true);
    const etapas = [
      {
        uuidEtapaExpediente: "etapa-uuid-1",
        uuidUsuarioActivo: "ua-1",
        etapaProceso: "SEPARACION" as const,
        estado: "PENDIENTE",
      },
    ];

    mockFetchStepper
      .mockResolvedValueOnce(emptyStepper) // primera llamada: vacío
      .mockResolvedValueOnce(emptyStepper) // double-check: aún vacío
      .mockResolvedValue(filledStepper);   // todas las demás: ya con hitos
    mockFetchEtapas.mockResolvedValue(etapas);
    mockCreateHito.mockResolvedValue({} as any);

    const { result } = renderHook(() => useCommercialStepper(makeContrato("ua-1")));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(mockFetchEtapas).toHaveBeenCalledWith("ua-1");
    expect(mockCreateHito).toHaveBeenCalled();
  });

  it("establece error si fetchCommercialStepper falla", async () => {
    mockFetchStepper.mockRejectedValue(new Error("Error de red"));

    const { result } = renderHook(() => useCommercialStepper(makeContrato("ua-1")));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Error de red");
    expect(result.current.stepper).toBeNull();
  });

  it("updateHito llama a updateCommercialHitoEstado y recarga", async () => {
    const stepper = makeStepper("ua-1", true);
    mockFetchStepper.mockResolvedValue(stepper);
    mockUpdateHitoEstado.mockResolvedValue({} as any);

    const { result } = renderHook(() => useCommercialStepper(makeContrato("ua-1")));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateHito("h-1", "COMPLETADO");
    });

    expect(mockUpdateHitoEstado).toHaveBeenCalledWith("h-1", "COMPLETADO");
    expect(mockFetchStepper).toHaveBeenCalledTimes(2);
  });

  it("no actualiza si stepper o uuidUsuarioActivo no están disponibles", async () => {
    const { result } = renderHook(() => useCommercialStepper(null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateHito("h-1", "COMPLETADO");
    });

    expect(mockUpdateHitoEstado).not.toHaveBeenCalled();
  });
});

describe("useStageDocuments", () => {
  const stageDocResponse = {
    title: "Separación",
    totalCount: 1,
    documents: [
      {
        id: "doc-1",
        title: "Proforma firmada",
        description: "Proforma",
        status: "COMPLETADA",
        emissionDate: null,
        hasDownload: false,
        downloadUrl: null,
        hasPreview: false,
        notaCorporativa: null,
        icon: "description",
      },
    ],
  };

  it("no carga datos si contrato o stepper son null", async () => {
    const { result } = renderHook(() => useStageDocuments(null, null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sections).toEqual([]);
    expect(mockFetchStageDocuments).not.toHaveBeenCalled();
  });

  it("carga documentos de las etapas activas del stepper", async () => {
    const stepper = makeStepper("ua-1", true);
    mockFetchStageDocuments.mockResolvedValue(stageDocResponse);

    const { result } = renderHook(() =>
      useStageDocuments(makeContrato("ua-1"), stepper)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].id).toBe("SEPARACION");
    expect(result.current.sections[0].docs).toHaveLength(1);
  });

  it("establece error si fetchStageDocuments falla", async () => {
    const stepper = makeStepper("ua-1", true);
    mockFetchStageDocuments.mockRejectedValue(new Error("Error al cargar docs"));

    const { result } = renderHook(() =>
      useStageDocuments(makeContrato("ua-1"), stepper)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Error al cargar docs");
  });
});

describe("useExpediente", () => {
  const etapasData = [
    {
      uuidEtapaExpediente: "etapa-1",
      uuidUsuarioActivo: "ua-1",
      etapaProceso: "SEPARACION" as const,
      estado: "PENDIENTE",
      totalHitos: 4,
      totalRequisitos: 4,
      hitosCompletados: 0,
    },
  ];

  it("establece loading:false sin cargar datos si uuidUsuarioActivo es null", async () => {
    const { result } = renderHook(() => useExpediente(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.expediente).toBeNull();
    expect(result.current.stages).toEqual([]);
    expect(mockFetchContratos).not.toHaveBeenCalled();
  });

  it("carga el expediente y los stages cuando el contrato existe", async () => {
    const contrato = makeContrato("ua-1");
    const stepper = makeStepper("ua-1", true);
    mockFetchContratos.mockResolvedValue([contrato]);
    mockFetchEtapas.mockResolvedValue(etapasData);
    mockFetchStepper.mockResolvedValue(stepper);

    const { result } = renderHook(() => useExpediente("ua-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.expediente).toEqual(contrato);
    expect(result.current.stages).toHaveLength(1);
    expect(result.current.error).toBe("");
  });

  it("lanza error si el expediente no se encuentra entre los contratos", async () => {
    mockFetchContratos.mockResolvedValue([makeContrato("otro-uuid")]);
    mockFetchEtapas.mockResolvedValue([]);
    mockFetchStepper.mockResolvedValue(makeStepper("otro-uuid"));

    const { result } = renderHook(() => useExpediente("ua-missing"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toContain("Expediente no encontrado");
    expect(result.current.expediente).toBeNull();
  });

  it("establece error si fetchTodosLosContratos falla", async () => {
    mockFetchContratos.mockRejectedValue(new Error("Error de conexión"));
    mockFetchEtapas.mockResolvedValue([]);
    mockFetchStepper.mockResolvedValue(makeStepper("ua-1"));

    const { result } = renderHook(() => useExpediente("ua-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Error de conexión");
  });

  it("calcula estado COMPLETADO cuando todos los hitos están completados", async () => {
    const contrato = makeContrato("ua-1");
    const stepperWithAllComplete: StepperResponseDTO = {
      uuidUsuarioActivo: "ua-1",
      etapas: [
        {
          etapa: "SEPARACION",
          porcentajeAvance: 100,
          hitos: [
            {
              uuidHitoComercial: "h-1",
              uuidEtapaExpediente: "etapa-1",
              etapaProceso: "SEPARACION",
              nombreHito: "Proforma",
              descripcion: "",
              orden: 1,
              estado: "COMPLETADO",
              fechaCompletado: "2026-03-01",
              createdAt: "2026-01-01",
            },
          ],
        },
      ],
    };
    mockFetchContratos.mockResolvedValue([contrato]);
    mockFetchEtapas.mockResolvedValue(etapasData);
    mockFetchStepper.mockResolvedValue(stepperWithAllComplete);

    const { result } = renderHook(() => useExpediente("ua-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const sep = result.current.stages.find((s) => s.etapaProceso === "SEPARACION");
    expect(sep?.estado).toBe("COMPLETADO");
    expect(sep?.hitosCompletados).toBe(1);
  });
});
