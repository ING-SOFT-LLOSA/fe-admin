/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import {
  crearContrato,
  asignarActivo,
  fetchMisActivos,
  unlinkAssignment,
  fetchTodosLosContratos,
  fetchExpedientesPorUsuario,
  fetchContratoPorId,
  fetchContratoActivo,
  fetchCommercialStepper,
  createCommercialHito,
  updateCommercialHitoEstado,
  deleteCommercialHito,
  updateCommercialHito,
  fetchEtapasExpediente,
  fetchActivosPorUsuario,
  asignarAsesorAContrato,
  desasignarAsesorDelContrato,
} from "./expedientes";

const mockApiFetch = vi.mocked(apiFetch);

function makeExpediente(uuid = "ua-1") {
  return {
    uuidUsuarioActivo: uuid,
    tipoFinanciamiento: "Crédito Directo",
    clientes: [],
    activos: [{ id: "act-1", nro: "101", pisoId: 1, tipo: "DEPARTAMENTO", areaM2: 80, estadoComercial: "DISPONIBLE", precio: 200000, descripcion: "" }],
    fechaAdquisicion: null,
    createdAt: null,
    updatedAt: null,
    vigente: true,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
});

describe("expedientes API", () => {
  describe("crearContrato", () => {
    it("hace POST a /api/expedientes/crear", async () => {
      mockApiFetch.mockResolvedValue(makeExpediente());
      await crearContrato({ idsUsuarios: [1], tipoFinanciamiento: "Directo", faseComercial: "SEPARACION" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/expedientes/crear");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("asignarActivo", () => {
    it("hace POST a /api/expedientes/asignar", async () => {
      mockApiFetch.mockResolvedValue(makeExpediente());
      await asignarActivo({ uuidUsuarioActivo: "ua-1", idsActivo: ["act-1"] });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/expedientes/asignar");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("fetchMisActivos", () => {
    it("llama a /api/expedientes/mis-activos", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchMisActivos();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/expedientes/mis-activos");
    });
  });

  describe("unlinkAssignment", () => {
    it("hace DELETE a /api/expedientes/delete/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await unlinkAssignment("ua-uuid");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/expedientes/delete/ua-uuid", { method: "DELETE" });
    });
  });

  describe("fetchTodosLosContratos", () => {
    it("llama a /api/expedientes?size=1000", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchTodosLosContratos();
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/expedientes");
      expect(url).toContain("size=1000");
    });

    it("maneja respuesta paginada extrayendo content", async () => {
      const raw = { content: [makeExpediente()], totalElements: 1 };
      mockApiFetch.mockResolvedValue(raw);
      const result = await fetchTodosLosContratos();
      expect(result).toHaveLength(1);
      expect(result[0].uuidUsuarioActivo).toBe("ua-1");
    });

    it("maneja respuesta como array directamente", async () => {
      mockApiFetch.mockResolvedValue([makeExpediente("ua-2")]);
      const result = await fetchTodosLosContratos();
      expect(result).toHaveLength(1);
      expect(result[0].uuidUsuarioActivo).toBe("ua-2");
    });

    it("maneja respuesta paginada sin content", async () => {
      mockApiFetch.mockResolvedValue({ totalElements: 0, otherField: "value" });
      const result = await fetchTodosLosContratos();
      expect(result).toEqual([]);
    });

    it("mapea activo desde activos[0] si activo es null", async () => {
      const item = { ...makeExpediente(), activo: undefined };
      mockApiFetch.mockResolvedValue([item]);
      const result = await fetchTodosLosContratos();
      expect(result[0].activo?.id).toBe("act-1");
    });
  });

  describe("fetchExpedientesPorUsuario", () => {
    it("llama a /api/expedientes/{idUsuario}", async () => {
      mockApiFetch.mockResolvedValue([makeExpediente()]);
      await fetchExpedientesPorUsuario(5);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/expedientes/5");
    });

    it("mapea activo desde activos[0] cuando activo no existe", async () => {
      const item = { ...makeExpediente(), activo: undefined };
      mockApiFetch.mockResolvedValue([item]);
      const result = await fetchExpedientesPorUsuario(5);
      expect(result[0].activo?.id).toBe("act-1");
    });
  });

  describe("fetchContratoPorId", () => {
    it("llama a /api/expedientes/contrato/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(makeExpediente());
      await fetchContratoPorId("ua-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/expedientes/contrato/ua-1");
    });

    it("mapea activo desde activos[0]", async () => {
      const item = { ...makeExpediente(), activo: undefined };
      mockApiFetch.mockResolvedValue(item);
      const result = await fetchContratoPorId("ua-1");
      expect(result.activo?.id).toBe("act-1");
    });
  });

  describe("fetchContratoActivo", () => {
    it("llama a /api/expedientes/{uuidActivo}/contrato", async () => {
      mockApiFetch.mockResolvedValue(makeExpediente());
      await fetchContratoActivo("activo-uuid");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/expedientes/activo-uuid/contrato");
    });
  });

  describe("fetchCommercialStepper", () => {
    it("llama a /api/comercial/stepper/{uuid}", async () => {
      mockApiFetch.mockResolvedValue({ uuidUsuarioActivo: "ua-1", etapas: [] });
      await fetchCommercialStepper("ua-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/comercial/stepper/ua-1");
    });
  });

  describe("createCommercialHito", () => {
    it("hace POST a /api/comercial/hitos", async () => {
      mockApiFetch.mockResolvedValue({ uuidHitoComercial: "h-1" });
      await createCommercialHito({ nombreHito: "Proforma", descripcion: "Enviar proforma", orden: 1 });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/comercial/hitos");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("updateCommercialHitoEstado", () => {
    it("hace PATCH a /api/comercial/hitos/{uuid}/estado", async () => {
      mockApiFetch.mockResolvedValue({ uuidHitoComercial: "h-1" });
      await updateCommercialHitoEstado("h-1", "COMPLETADO");
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/comercial/hitos/h-1/estado");
      expect(url).toContain("estado=COMPLETADO");
      expect((init as RequestInit).method).toBe("PATCH");
    });
  });

  describe("deleteCommercialHito", () => {
    it("hace DELETE a /api/comercial/hitos/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteCommercialHito("h-2");
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/comercial/hitos/h-2");
      expect((init as RequestInit).method).toBe("DELETE");
    });
  });

  describe("updateCommercialHito", () => {
    it("hace PATCH a /api/comercial/hitos/{uuid} con el payload", async () => {
      mockApiFetch.mockResolvedValue({ uuidHitoComercial: "h-3" });
      await updateCommercialHito("h-3", { nombreHito: "Hito editado", descripcion: "Nueva desc" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/comercial/hitos/h-3");
      expect((init as RequestInit).method).toBe("PATCH");
    });
  });

  describe("fetchEtapasExpediente", () => {
    it("llama al endpoint de etapas del expediente", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchEtapasExpediente("ua-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/etapa-expediente/expediente/ua-1");
    });
  });

  describe("fetchActivosPorUsuario", () => {
    it("llama a /api/expedientes/usuario/{id}/activos", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchActivosPorUsuario(10);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/expedientes/usuario/10/activos");
    });
  });

  describe("asignarAsesorAContrato", () => {
    it("hace POST al endpoint con uuid e idAsesor", async () => {
      mockApiFetch.mockResolvedValue(makeExpediente());
      await asignarAsesorAContrato("ua-1", 3);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/expedientes/usuarioActivo/ua-1/asesor/3");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("desasignarAsesorDelContrato", () => {
    it("hace PUT al endpoint con uuid e idAsesor", async () => {
      mockApiFetch.mockResolvedValue(makeExpediente());
      await desasignarAsesorDelContrato("ua-1", 3);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/expedientes/usuarioActivo/ua-1/asesor/3");
      expect((init as RequestInit).method).toBe("PUT");
    });
  });
});
