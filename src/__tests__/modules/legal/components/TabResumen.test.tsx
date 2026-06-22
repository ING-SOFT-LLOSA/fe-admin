/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TabResumen } from '@/modules/legal/components/TabResumen';
import type { ProcesoEtapa } from '@/modules/legal/components/constants';

function makeEtapa(overrides: Partial<ProcesoEtapa> = {}): ProcesoEtapa {
  return {
    id: "h-1",
    uuidHito: "h-uuid-1",
    label: "Proforma",
    etapaProceso: "SEPARACION",
    orden: 1,
    estado: "completado",
    icon: "description",
    comentarios: "Enviada al cliente",
    fechaInicio: "2026-01-01",
    fechaFin: "2026-01-15",
    ...overrides,
  };
}

const mockClient = { id: 1, nombre: "Juan", apellidos: "Pérez" } as any;
const mockExpediente = {
  uuidUsuarioActivo: "ua-1",
  activo: { proyectoNombre: "Aurora", tipo: "Dpto", nro: "302" },
} as any;
const mockContrato = { tipoFinanciamiento: "Crédito Directo" } as any;

describe("TabResumen", () => {
  it("muestra los KPIs con datos del cliente, proyecto y unidad", () => {
    const etapas = [makeEtapa()];
    render(
      <TabResumen
        client={mockClient}
        expediente={mockExpediente}
        contrato={mockContrato}
        etapas={etapas}
        loadingStepper={false}
      />
    );

    expect(screen.getByText("Juan Pérez")).toBeDefined();
    expect(screen.getByText("Aurora")).toBeDefined();
    expect(screen.getByText("Dpto 302")).toBeDefined();
    expect(screen.getByText("Crédito Directo")).toBeDefined();
  });

  it("muestra '—' cuando no hay datos de cliente", () => {
    const etapas = [makeEtapa()];
    render(
      <TabResumen
        client={null}
        expediente={null}
        contrato={null}
        etapas={etapas}
        loadingStepper={false}
      />
    );

    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Pendiente")).toBeDefined();
  });

  it("muestra etapa actual y progreso", () => {
    const etapas = [
      makeEtapa({ id: "h-1", estado: "completado", label: "Proforma" }),
      makeEtapa({ id: "h-2", estado: "en_proceso", label: "Contrato", icon: "description" }),
      makeEtapa({ id: "h-3", estado: "pendiente", label: "Pago", icon: "payments" }),
    ];

    render(
      <TabResumen
        client={mockClient}
        expediente={mockExpediente}
        contrato={mockContrato}
        etapas={etapas}
        loadingStepper={false}
      />
    );

    expect(screen.getByText("Progreso del proceso legal")).toBeDefined();
    expect(screen.getByText("Etapa actual")).toBeDefined();
    expect(screen.getByText("Enviada al cliente")).toBeDefined();
  });

  it("muestra fecha de última actualización", () => {
    const etapas = [
      makeEtapa({ id: "h-1", estado: "completado", fechaFin: "2026-01-15", fechaInicio: "2026-01-01" }),
    ];

    render(
      <TabResumen
        client={mockClient}
        expediente={mockExpediente}
        contrato={mockContrato}
        etapas={etapas}
        loadingStepper={false}
      />
    );

    expect(screen.getByText("Última actualización")).toBeDefined();
  });
});
