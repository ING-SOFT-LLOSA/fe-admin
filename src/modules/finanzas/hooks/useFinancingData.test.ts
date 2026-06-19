/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/lib/api/expedientes", () => ({
  fetchContratoPorId: vi.fn(),
  fetchCommercialStepper: vi.fn(),
}));

vi.mock("@/lib/api/finanzas", () => ({
  fetchCronograma: vi.fn(),
  fetchPagos: vi.fn(),
  fetchResumenPagos: vi.fn(),
  fetchCartaAprobacion: vi.fn(),
}));

import {
  fetchContratoPorId,
  fetchCommercialStepper,
} from "@/lib/api/expedientes";
import {
  fetchCronograma,
  fetchPagos,
  fetchResumenPagos,
  fetchCartaAprobacion,
} from "@/lib/api/finanzas";
import { useFinancingData } from "./useFinancingData";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";

const mockFetchContrato = vi.mocked(fetchContratoPorId);
const mockFetchStepper = vi.mocked(fetchCommercialStepper);
const mockFetchCronograma = vi.mocked(fetchCronograma);
const mockFetchPagos = vi.mocked(fetchPagos);
const mockFetchResumen = vi.mocked(fetchResumenPagos);
const mockFetchCarta = vi.mocked(fetchCartaAprobacion);

function makeExpediente(tipo = "Crédito Directo", uuid = "ua-1"): UsuarioActivoResponseDTO {
  return {
    uuidUsuarioActivo: uuid,
    tipoFinanciamiento: tipo,
    clientes: [],
    activos: [],
    fechaAdquisicion: null,
    createdAt: null,
    updatedAt: null,
    vigente: true,
  };
}

const mockCronograma = {
  uuidCronograma: "crono-1",
  uuidUsuarioActivo: "ua-1",
  totalPactado: 100000,
  cuotaInicial: 10000,
  numeroCuotas: 12,
  cuotas: [],
};

const mockResumen = {
  estadoGlobal: "AL_DIA",
  totalPagado: 10000,
  totalPendiente: 90000,
  cuotasAlDia: 1,
  cuotasMorosas: 0,
};

const mockPagos = [
  { uuidPago: "pago-1", nroCuota: 1, montoProgramado: 5000, fechaVencimiento: "2026-07-01", estado: "PAGADO", montoPagado: 5000 },
];

const mockCarta = {
  uuidCartaAprobacion: "carta-1",
  uuidUsuarioActivo: "ua-1",
  banco: "BCP",
  montoAprobado: 200000,
  fechaEmision: "2026-01-15",
  fechaVencimiento: "2026-12-31",
  fechaDesembolsoProyectada: "2026-06-30",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useFinancingData", () => {
  describe("cuando no hay uuid ni expedienteBase", () => {
    it("resetea todos los estados y no llama a la API", async () => {
      const { result } = renderHook(() => useFinancingData(null));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.expediente).toBeNull();
      expect(result.current.cronograma).toBeNull();
      expect(result.current.pagos).toEqual([]);
      expect(result.current.resumen).toBeNull();
      expect(result.current.hasExpediente).toBeNull();
      expect(mockFetchContrato).not.toHaveBeenCalled();
    });
  });

  describe("Crédito Directo", () => {
    it("carga expediente, cronograma, resumen y pagos", async () => {
      mockFetchContrato.mockResolvedValue(makeExpediente("Crédito Directo"));
      mockFetchCronograma.mockResolvedValue(mockCronograma as any);
      mockFetchResumen.mockResolvedValue(mockResumen as any);
      mockFetchPagos.mockResolvedValue(mockPagos as any);

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.expediente?.tipoFinanciamiento).toBe("Crédito Directo");
      expect(result.current.cronograma?.uuidCronograma).toBe("crono-1");
      expect(result.current.resumen?.estadoGlobal).toBe("AL_DIA");
      expect(result.current.pagos).toHaveLength(1);
      expect(result.current.hasExpediente).toBe(true);
    });

    it("si fetchCronograma falla, deja cronograma en null y continúa", async () => {
      mockFetchContrato.mockResolvedValue(makeExpediente("Crédito Directo"));
      mockFetchCronograma.mockRejectedValue(new Error("Sin cronograma"));

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.cronograma).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.pagos).toEqual([]);
    });

    it("si fetchResumenPagos falla, deja resumen en null y continúa", async () => {
      mockFetchContrato.mockResolvedValue(makeExpediente("Crédito Directo"));
      mockFetchCronograma.mockResolvedValue(mockCronograma as any);
      mockFetchResumen.mockRejectedValue(new Error("Sin resumen"));
      mockFetchPagos.mockResolvedValue(mockPagos as any);

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.resumen).toBeNull();
      expect(result.current.pagos).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it("usa expedienteBase si se proporciona (no llama a fetchContratoPorId)", async () => {
      const expedienteBase = makeExpediente("Crédito Directo");
      mockFetchCronograma.mockResolvedValue(mockCronograma as any);
      mockFetchResumen.mockResolvedValue(mockResumen as any);
      mockFetchPagos.mockResolvedValue([]);

      const { result } = renderHook(() => useFinancingData(null, expedienteBase));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockFetchContrato).not.toHaveBeenCalled();
      expect(result.current.expediente).toEqual(expedienteBase);
      expect(result.current.hasExpediente).toBe(true);
    });
  });

  describe("Crédito Hipotecario", () => {
    it("carga expediente y carta de aprobación", async () => {
      mockFetchContrato.mockResolvedValue(makeExpediente("Crédito Hipotecario"));
      mockFetchCarta.mockResolvedValue(mockCarta as any);
      mockFetchStepper.mockResolvedValue({
        uuidUsuarioActivo: "ua-1",
        etapas: [],
      });

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.cronograma?.uuidCronograma).toBe("crono-1");
      expect(result.current.hasExpediente).toBe(true);
    });

    it("si fetchCartaAprobacion falla, no hay error global", async () => {
      mockFetchContrato.mockResolvedValue(makeExpediente("Crédito Hipotecario"));
      mockFetchCarta.mockRejectedValue(new Error("Sin carta"));
      mockFetchStepper.mockResolvedValue({ uuidUsuarioActivo: "ua-1", etapas: [] });

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeNull();
    });

    it("usa hitos del stepper para creditoHipotecario cuando la etapa PAGO tiene hitos", async () => {
      mockFetchContrato.mockResolvedValue(makeExpediente("Crédito Hipotecario"));
      mockFetchCarta.mockResolvedValue(mockCarta as any);
      mockFetchStepper.mockResolvedValue({
        uuidUsuarioActivo: "ua-1",
        etapas: [
          {
            etapa: "PAGO",
            porcentajeAvance: 50,
            hitos: [
              {
                uuidHitoComercial: "h-1",
                uuidEtapaExpediente: "etapa-1",
                etapaProceso: "PAGO",
                nombreHito: "Carta de aprobación",
                descripcion: "",
                orden: 1,
                estado: "COMPLETADO",
                fechaCompletado: "2026-02-01",
                createdAt: "2026-01-01",
              },
            ],
          },
        ],
      });

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.creditoHipotecario?.items).toHaveLength(1);
      expect(result.current.creditoHipotecario?.items[0].nombre).toBe("Carta de aprobación");
    });

    it("usa hitos vacíos cuando el stepper no tiene etapa PAGO con hitos", async () => {
      mockFetchContrato.mockResolvedValue(makeExpediente("Crédito Hipotecario"));
      mockFetchCarta.mockResolvedValue(mockCarta as any);
      mockFetchStepper.mockResolvedValue({
        uuidUsuarioActivo: "ua-1",
        etapas: [],
      });

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.creditoHipotecario?.items).toHaveLength(0);
      expect(result.current.creditoHipotecario?.montoTotal).toBe(100000);
    });
  });

  describe("error global", () => {
    it("captura error si fetchContratoPorId falla", async () => {
      mockFetchContrato.mockRejectedValue(new Error("Error de red"));

      const { result } = renderHook(() => useFinancingData("ua-1"));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBe("Error de red");
      expect(result.current.expediente).toBeNull();
    });
  });
});
