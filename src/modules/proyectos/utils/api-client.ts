import { ProjectFormData, InventoryConfig, TorreData } from "./wizard-logic";
import { apiFetch } from "@/lib/api/http";

export async function createProject(data: ProjectFormData): Promise<{ id: string }> {
  const payload = {
    ...data,
    fechaInicio: data.fechaInicio || null,
    fechaFin: data.fechaFin || null,
  };

  return await apiFetch<{ id: string }>("/api/proyectos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function generateEstructura(config: InventoryConfig): TorreData[] {
  const torres: TorreData[] = [];
  for (let t = 1; t <= config.numTorres; t++) {
    const pisos = [];
    for (let p = 1; p <= config.pisosPorTorre; p++) {
      const activos = [];
      for (let d = 1; d <= config.depasPorPiso; d++) {
        activos.push({
          nro: `${p}${d.toString().padStart(2, '0')}`,
          tipo: "DEPARTAMENTO" as const,
          areaM2: 70,
          areaTechada: 0,
          estadoComercial: "DISPONIBLE",
          precio: 200000,
          descripcion: `Dpto en Torre ${t}, Piso ${p}`
        });
      }
      for (let c = 1; c <= config.cocherasPorPiso; c++) {
        activos.push({
          nro: `E-${p}${c.toString().padStart(2, '0')}`,
          tipo: "COCHERA" as const,
          areaM2: 12,
          areaTechada: 0,
          estadoComercial: "DISPONIBLE",
          precio: 15000,
          descripcion: `Estacionamiento en Torre ${t}, Piso ${p}`
        });
      }
      for (let dep = 1; dep <= config.depositosPorPiso; dep++) {
        activos.push({
          nro: `D-${p}${dep.toString().padStart(2, '0')}`,
          tipo: "DEPOSITO" as const,
          areaM2: 5,
          areaTechada: 0,
          estadoComercial: "DISPONIBLE",
          precio: 5000,
          descripcion: `Depósito en Torre ${t}, Piso ${p}`
        });
      }
      pisos.push({ nroPiso: p, activos });
    }
    torres.push({ nombre: `Torre ${t}`, pisos });
  }
  return torres;
}

export async function createInventory(projectId: string, torres: TorreData[]) {
  return await apiFetch<void>(`/api/proyectos/${projectId}/estructura-fisica`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ torres }),
  });
}
