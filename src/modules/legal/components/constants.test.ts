import { describe, it, expect } from "vitest";
import {
  TABS,
  ESTADO_BADGE,
  BACKEND_A_ESTADO,
  ESTADO_A_BACKEND,
  STAGE_ORDER,
  STAGE_META,
  DOCUMENT_STAGES,
  DEFAULT_HITOS,
  PREDEFINED_REQUISITOS,
  OPCIONES_ESTADO,
} from "./constants";
import type { EstadoHito, StageId } from "./constants";

describe("constants — Legal module", () => {
  describe("TABS", () => {
    it("contiene exactamente 3 tabs", () => {
      expect(TABS).toHaveLength(3);
    });

    it("tiene los ids esperados", () => {
      const ids = TABS.map((t) => t.id);
      expect(ids).toContain("resumen");
      expect(ids).toContain("proceso");
      expect(ids).toContain("documentos");
    });

    it("cada tab tiene id, label e icon", () => {
      TABS.forEach((tab) => {
        expect(tab).toHaveProperty("id");
        expect(tab).toHaveProperty("label");
        expect(tab).toHaveProperty("icon");
      });
    });
  });

  describe("ESTADO_BADGE", () => {
    const estados: EstadoHito[] = ["completado", "en_proceso", "pendiente", "observado"];

    it("tiene un badge para cada estado posible", () => {
      estados.forEach((e) => {
        expect(ESTADO_BADGE).toHaveProperty(e);
        expect(ESTADO_BADGE[e]).toHaveProperty("label");
        expect(ESTADO_BADGE[e]).toHaveProperty("cls");
      });
    });

    it("el estado 'completado' tiene la etiqueta correcta", () => {
      expect(ESTADO_BADGE.completado.label).toBe("Completado");
    });

    it("el estado 'pendiente' tiene la etiqueta correcta", () => {
      expect(ESTADO_BADGE.pendiente.label).toBe("Pendiente");
    });
  });

  describe("BACKEND_A_ESTADO", () => {
    it("mapea COMPLETADO a completado", () => {
      expect(BACKEND_A_ESTADO["COMPLETADO"]).toBe("completado");
    });

    it("mapea EN_PROGRESO a en_proceso", () => {
      expect(BACKEND_A_ESTADO["EN_PROGRESO"]).toBe("en_proceso");
    });

    it("mapea PENDIENTE a pendiente", () => {
      expect(BACKEND_A_ESTADO["PENDIENTE"]).toBe("pendiente");
    });
  });

  describe("ESTADO_A_BACKEND", () => {
    it("mapea completado a COMPLETADO", () => {
      expect(ESTADO_A_BACKEND.completado).toBe("COMPLETADO");
    });

    it("mapea en_proceso a EN_PROGRESO", () => {
      expect(ESTADO_A_BACKEND.en_proceso).toBe("EN_PROGRESO");
    });

    it("mapea observado a PENDIENTE (sin estado equivalente en backend)", () => {
      expect(ESTADO_A_BACKEND.observado).toBe("PENDIENTE");
    });
  });

  describe("STAGE_ORDER", () => {
    it("contiene 5 etapas en el orden correcto", () => {
      expect(STAGE_ORDER).toEqual([
        "SEPARACION",
        "CONTRATO",
        "PAGO",
        "ENTREGA",
        "SANEAMIENTO",
      ]);
    });
  });

  describe("STAGE_META", () => {
    const stages: StageId[] = ["SEPARACION", "CONTRATO", "PAGO", "ENTREGA", "SANEAMIENTO", "OTRO"];

    it("tiene metadata para todas las etapas", () => {
      stages.forEach((s) => {
        expect(STAGE_META).toHaveProperty(s);
        expect(STAGE_META[s]).toHaveProperty("label");
        expect(STAGE_META[s]).toHaveProperty("icon");
      });
    });

    it("SEPARACION tiene la etiqueta 'Separación'", () => {
      expect(STAGE_META.SEPARACION.label).toBe("Separación");
    });
  });

  describe("DOCUMENT_STAGES", () => {
    it("incluye OTRO además de las 5 etapas principales", () => {
      expect(DOCUMENT_STAGES).toContain("OTRO");
      expect(DOCUMENT_STAGES).toHaveLength(6);
    });
  });

  describe("DEFAULT_HITOS", () => {
    it("tiene hitos para las etapas principales", () => {
      const etapas = new Set(DEFAULT_HITOS.map((h) => h.etapaProceso));
      expect(etapas.has("SEPARACION")).toBe(true);
      expect(etapas.has("CONTRATO")).toBe(true);
      expect(etapas.has("ENTREGA")).toBe(true);
      expect(etapas.has("SANEAMIENTO")).toBe(true);
    });

    it("cada hito tiene los campos requeridos", () => {
      DEFAULT_HITOS.forEach((hito) => {
        expect(hito).toHaveProperty("etapaProceso");
        expect(hito).toHaveProperty("nombreHito");
        expect(hito).toHaveProperty("descripcion");
        expect(hito).toHaveProperty("orden");
        expect(hito).toHaveProperty("icon");
      });
    });

    it("tiene exactamente 4 hitos en SEPARACION", () => {
      const sep = DEFAULT_HITOS.filter((h) => h.etapaProceso === "SEPARACION");
      expect(sep).toHaveLength(4);
    });

    it("tiene exactamente 7 hitos en SANEAMIENTO", () => {
      const san = DEFAULT_HITOS.filter((h) => h.etapaProceso === "SANEAMIENTO");
      expect(san).toHaveLength(7);
    });
  });

  describe("PREDEFINED_REQUISITOS", () => {
    it("tiene requisitos para las etapas con documentos", () => {
      expect(PREDEFINED_REQUISITOS.SEPARACION.length).toBeGreaterThan(0);
      expect(PREDEFINED_REQUISITOS.CONTRATO.length).toBeGreaterThan(0);
      expect(PREDEFINED_REQUISITOS.ENTREGA.length).toBeGreaterThan(0);
      expect(PREDEFINED_REQUISITOS.SANEAMIENTO.length).toBeGreaterThan(0);
    });

    it("PAGO y OTRO tienen arrays vacíos", () => {
      expect(PREDEFINED_REQUISITOS.PAGO).toEqual([]);
      expect(PREDEFINED_REQUISITOS.OTRO).toEqual([]);
    });

    it("cada requisito tiene titulo, descripcion e icono", () => {
      const todosLosRequisitos = Object.values(PREDEFINED_REQUISITOS).flat();
      todosLosRequisitos.forEach((req) => {
        expect(req).toHaveProperty("titulo");
        expect(req).toHaveProperty("descripcion");
        expect(req).toHaveProperty("icono");
      });
    });
  });

  describe("OPCIONES_ESTADO", () => {
    it("tiene exactamente 3 opciones", () => {
      expect(OPCIONES_ESTADO).toHaveLength(3);
    });

    it("incluye PENDIENTE, EN_PROGRESO y COMPLETADO", () => {
      const values = OPCIONES_ESTADO.map((o) => o.value);
      expect(values).toContain("PENDIENTE");
      expect(values).toContain("EN_PROGRESO");
      expect(values).toContain("COMPLETADO");
    });
  });
});
