import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import { createProject, createInventory, generateEstructura } from "./api-client";
import type { ProjectFormData, InventoryConfig } from "./wizard-logic";

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
});

describe("createProject", () => {
  it("hace POST a /api/proyectos con el payload", async () => {
    mockApiFetch.mockResolvedValue({ id: "p-new" });
    const data: ProjectFormData = {
      nombre: "Edificio Sur",
      descripcion: "Proyecto residencial",
      precertificacionEdgeLeed: false,
      departamento: "Lima",
      distrito: "San Isidro",
      direccion: "Av. Arequipa 100",
      fechaInicio: "2026-01-01",
      fechaFin: "2027-12-31",
    };

    const result = await createProject(data);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe("/api/proyectos");
    expect((init as RequestInit).method).toBe("POST");
    expect(result).toEqual({ id: "p-new" });
  });

  it("convierte fechaInicio y fechaFin vacíos a null", async () => {
    mockApiFetch.mockResolvedValue({ id: "p-2" });
    const data: ProjectFormData = {
      nombre: "Proyecto",
      descripcion: "",
      precertificacionEdgeLeed: false,
      departamento: "Lima",
      distrito: "Miraflores",
      direccion: "Calle 1",
      fechaInicio: "",
      fechaFin: "",
    };

    await createProject(data);
    const [, init] = mockApiFetch.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.fechaInicio).toBeNull();
    expect(body.fechaFin).toBeNull();
  });
});

describe("createInventory", () => {
  it("hace POST a /api/proyectos/{id}/estructura-fisica con la estructura correcta", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    const config: InventoryConfig = {
      numTorres: 1,
      pisosPorTorre: 2,
      depasPorPiso: 2,
      cocherasPorPiso: 1,
      depositosPorPiso: 1,
    };

    const torres = generateEstructura(config);
    await createInventory("p-1", torres);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe("/api/proyectos/p-1/estructura-fisica");
    expect((init as RequestInit).method).toBe("POST");

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.torres).toHaveLength(1);
    expect(body.torres[0].nombre).toBe("Torre 1");
    expect(body.torres[0].pisos).toHaveLength(2);
  });

  it("genera la cantidad correcta de departamentos, cocheras y depósitos por piso", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    const config: InventoryConfig = {
      numTorres: 1,
      pisosPorTorre: 1,
      depasPorPiso: 3,
      cocherasPorPiso: 2,
      depositosPorPiso: 1,
    };

    const torres = generateEstructura(config);
    await createInventory("p-1", torres);
    const [, init] = mockApiFetch.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    const activos = body.torres[0].pisos[0].activos;

    const depas = activos.filter((a: any) => a.tipo === "DEPARTAMENTO");
    const cocheras = activos.filter((a: any) => a.tipo === "COCHERA");
    const depositos = activos.filter((a: any) => a.tipo === "DEPOSITO");

    expect(depas).toHaveLength(3);
    expect(cocheras).toHaveLength(2);
    expect(depositos).toHaveLength(1);
    expect(activos).toHaveLength(6);
  });

  it("genera múltiples torres cuando numTorres > 1", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    const config: InventoryConfig = {
      numTorres: 3,
      pisosPorTorre: 1,
      depasPorPiso: 1,
      cocherasPorPiso: 0,
      depositosPorPiso: 0,
    };

    const torres = generateEstructura(config);
    await createInventory("p-2", torres);
    const [, init] = mockApiFetch.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.torres).toHaveLength(3);
    expect(body.torres[1].nombre).toBe("Torre 2");
    expect(body.torres[2].nombre).toBe("Torre 3");
  });

  it("asigna tipo DISPONIBLE a todos los activos generados", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    const config: InventoryConfig = {
      numTorres: 1,
      pisosPorTorre: 1,
      depasPorPiso: 2,
      cocherasPorPiso: 0,
      depositosPorPiso: 0,
    };

    const torres = generateEstructura(config);
    await createInventory("p-1", torres);
    const [, init] = mockApiFetch.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    const activos = body.torres[0].pisos[0].activos;
    activos.forEach((a: any) => {
      expect(a.estadoComercial).toBe("DISPONIBLE");
    });
  });
});
