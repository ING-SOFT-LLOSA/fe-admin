import { describe, it, expect } from "vitest";
import { isSpecialConcepto, getConceptoLabel, getPagoStatusInfo } from '@/modules/finanzas/utils/paymentHelpers';
import type { PagoResponse } from "@/modules/finanzas/types";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

describe("paymentHelpers", () => {
  describe("isSpecialConcepto", () => {
    it("retorna true para conceptos especiales", () => {
      const mockPago = (concepto: string) => ({ concepto } as PagoResponse);
      expect(isSpecialConcepto(mockPago("SEPARACION"))).toBe(true);
      expect(isSpecialConcepto(mockPago("INICIAL"))).toBe(true);
      expect(isSpecialConcepto(mockPago("COMPLETO"))).toBe(true);
      expect(isSpecialConcepto(mockPago("CUOTA"))).toBe(false);
    });
  });

  describe("getConceptoLabel", () => {
    it("retorna el concepto si existe", () => {
      expect(getConceptoLabel({ concepto: "CUOTA" } as PagoResponse)).toBe("CUOTA");
    });

    it("retorna SEPARACION si nroCuota es -1 y concepto está vacío", () => {
      expect(getConceptoLabel({ nroCuota: -1 } as PagoResponse)).toBe("SEPARACION");
    });

    it("retorna INICIAL si nroCuota es 0 y concepto está vacío", () => {
      expect(getConceptoLabel({ nroCuota: 0 } as PagoResponse)).toBe("INICIAL");
    });

    it("retorna COMPLETO si nroCuota es mayor que 0 y concepto está vacío", () => {
      expect(getConceptoLabel({ nroCuota: 1 } as PagoResponse)).toBe("COMPLETO");
    });
  });

  describe("getPagoStatusInfo", () => {
    const formatLocalDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    it("retorna info para PAGADO", () => {
      const info = getPagoStatusInfo({ estado: "PAGADO" } as PagoResponse);
      expect(info.label).toBe("Pagado");
      expect(info.moraDays).toBe(0);
    });

    it("retorna info para Vencido con días de mora", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const yyyymmdd = formatLocalDate(pastDate);

      const info = getPagoStatusInfo({ estado: "PENDIENTE", fechaVencimiento: yyyymmdd } as PagoResponse);
      expect(info.label).toBe("Vencido");
      expect(info.moraDays).toBeGreaterThan(0);
      expect(info.moraText).toBeDefined();
    });

    it("retorna info para Vencido con exactamente 1 día de mora", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const yyyymmdd = formatLocalDate(pastDate);

      const info = getPagoStatusInfo({ estado: "PENDIENTE", fechaVencimiento: yyyymmdd } as PagoResponse);
      expect(info.label).toBe("Vencido");
      expect(info.moraDays).toBe(1);
      expect(info.moraText).toBe("1 día de mora");
    });

    it("retorna info para Vence hoy/pronto", () => {
      const today = new Date();
      const yyyymmdd = formatLocalDate(today);

      const info = getPagoStatusInfo({ estado: "PENDIENTE", fechaVencimiento: yyyymmdd } as PagoResponse);
      expect(info.label).toBe("Vence hoy");
      expect(info.moraDays).toBe(0);
    });

    it("retorna info para Vence en N días", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const yyyymmdd = formatLocalDate(futureDate);

      const info = getPagoStatusInfo({ estado: "PENDIENTE", fechaVencimiento: yyyymmdd } as PagoResponse);
      expect(info.label).toBe("Vence en 2 d");
      expect(info.moraDays).toBe(0);
    });

    it("retorna info para Pendiente lejano", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const yyyymmdd = formatLocalDate(futureDate);

      const info = getPagoStatusInfo({ estado: "PENDIENTE", fechaVencimiento: yyyymmdd } as PagoResponse);
      expect(info.label).toBe("Pendiente");
      expect(info.moraDays).toBe(0);
    });
  });
});
