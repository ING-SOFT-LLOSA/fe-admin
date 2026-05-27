import { ProjectFormData } from "./wizard-logic";
import { HITOS_TEMPLATE } from "../_data/hitos-template";
import { apiFetch } from "@/lib/api/http";

export async function createProject(data: ProjectFormData) {
  const payload = {
    ...data,
    fechaInicio: data.fechaInicio || null,
    fechaFin: data.fechaFin || null,
  };

  return await apiFetch<any>("/api/proyectos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createEtapasAndHitos(projectId: string) {
  // We iterate sequentially to ensure ordering is maintained in the DB
  for (const etapa of HITOS_TEMPLATE) {
    // 1. Create Etapa
    const { id: etapaId } = await apiFetch<any>(`/api/proyectos/${projectId}/etapas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: etapa.nombre,
        descripcion: etapa.descripcion,
        orden: etapa.orden,
      }),
    });

    // 2. Create Hitos for this Etapa
    for (const hito of etapa.hitos) {
      await apiFetch<any>(`/api/etapas/${etapaId}/hitos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: hito.titulo,
          orden: hito.orden,
          tipo: hito.tipo,
        }),
      });
    }
  }
}

export async function createPhysicalStructure(projectId: string, structurePayload: any) {
  await apiFetch<any>(`/api/proyectos/${projectId}/estructura-fisica`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(structurePayload),
  });
}
