import { describe, it, expect } from "vitest";
import type { ProjectFormData, InventoryConfig } from "./wizard-logic";

describe("wizard-logic types", () => {
  describe("ProjectFormData", () => {
    it("acepta todos los campos requeridos", () => {
      const formData: ProjectFormData = {
        nombre: "Edificio Norte",
        descripcion: "Proyecto residencial",
        precertificacionEdgeLeed: true,
        departamento: "Lima",
        distrito: "Miraflores",
        direccion: "Av. Principal 123",
        fechaInicio: "2026-01-01",
        fechaFin: "2027-12-31",
      };
      expect(formData.nombre).toBe("Edificio Norte");
      expect(formData.precertificacionEdgeLeed).toBe(true);
    });

    it("permite precertificacionEdgeLeed en false", () => {
      const formData: ProjectFormData = {
        nombre: "Torre Sur",
        descripcion: "Otro proyecto",
        precertificacionEdgeLeed: false,
        departamento: "Arequipa",
        distrito: "Cayma",
        direccion: "Calle 456",
        fechaInicio: "2026-03-01",
        fechaFin: "2028-03-01",
      };
      expect(formData.precertificacionEdgeLeed).toBe(false);
    });
  });

  describe("InventoryConfig", () => {
    it("acepta la configuración de inventario válida", () => {
      const config: InventoryConfig = {
        numTorres: 2,
        pisosPorTorre: 10,
        depasPorPiso: 4,
        cocherasPorPiso: 2,
        depositosPorPiso: 1,
      };
      expect(config.numTorres).toBe(2);
      expect(config.pisosPorTorre).toBe(10);
      expect(config.depasPorPiso).toBe(4);
      expect(config.cocherasPorPiso).toBe(2);
      expect(config.depositosPorPiso).toBe(1);
    });

    it("permite valores en cero para los campos numéricos", () => {
      const config: InventoryConfig = {
        numTorres: 1,
        pisosPorTorre: 5,
        depasPorPiso: 2,
        cocherasPorPiso: 0,
        depositosPorPiso: 0,
      };
      expect(config.cocherasPorPiso).toBe(0);
      expect(config.depositosPorPiso).toBe(0);
    });
  });
});
