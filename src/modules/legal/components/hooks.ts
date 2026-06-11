import { useState, useEffect, useCallback, useRef } from "react";

import {
  fetchCommercialStepper,
  createCommercialHito,
  updateCommercialHitoEstado,
  type StepperResponseDTO,
  type UsuarioActivoResponseDTO,
} from "@/lib/api/expedientes";
import {
  fetchStageDocuments,
  createRequisito,
  type DocumentoItem,
} from "@/lib/api/requisitos";
import { ApiError } from "@/lib/api/http";

import {
  DEFAULT_HITOS,
  STAGE_META,
  STAGE_ORDER,
  DOCUMENT_STAGES,
  PREDEFINED_REQUISITOS,
  type ProcesoEtapa,
  type HitoItem,
  type StageId,
} from "./constants";

// ─── useCommercialStepper ─────────────────────────────────────────────────────
// Loads (and seeds if empty) the commercial milestones for a given contrato.

export function useCommercialStepper(contrato: UsuarioActivoResponseDTO | null) {
  const [stepper, setStepper]     = useState<StepperResponseDTO | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const uuidUsuarioActivo = contrato?.uuidUsuarioActivo ?? null;

  const refresh = useCallback(async () => {
    if (!uuidUsuarioActivo) {
      setStepper(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let data = await fetchCommercialStepper(uuidUsuarioActivo);

      const totalHitos = data.etapas?.reduce((acc, e) => acc + (e.hitos?.length ?? 0), 0) ?? 0;

      if (totalHitos === 0) {
        await Promise.all(
          DEFAULT_HITOS.map((h) =>
            createCommercialHito({
              uuidUsuarioActivo,
              etapaProceso: h.etapaProceso,
              nombreHito:   h.nombreHito,
              descripcion:  h.descripcion,
              orden:        h.orden,
            })
          )
        );
        data = await fetchCommercialStepper(uuidUsuarioActivo);
      }

      setStepper(data);
    } catch (err) {
      console.error("useCommercialStepper:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el proceso legal.");
    } finally {
      setLoading(false);
    }
  }, [uuidUsuarioActivo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Update a single hito, auto-completing all predecessors ──
  const updateHito = useCallback(
    async (uuidHito: string, nuevoEstado: string) => {
      if (!stepper?.etapas || !uuidUsuarioActivo) return;
      setError("");

      try {
        if (nuevoEstado === "COMPLETADO") {
          const targetEtapa = stepper.etapas.find((et) =>
            et.hitos?.some((h) => h.uuidHitoComercial === uuidHito)
          );
          if (targetEtapa) {
            const targetHito = targetEtapa.hitos?.find((h) => h.uuidHitoComercial === uuidHito);
            const targetIndex = STAGE_ORDER.indexOf(targetEtapa.etapa);

            // Auto-complete ALL hitos of previous stages
            for (let i = 0; i < targetIndex; i++) {
              const prevEtapa = stepper.etapas.find((et) => et.etapa === STAGE_ORDER[i]);
              for (const h of prevEtapa?.hitos ?? []) {
                if (h.estado !== "COMPLETADO") {
                  await updateCommercialHitoEstado(h.uuidHitoComercial, "COMPLETADO");
                }
              }
            }

            // Auto-complete hitos within same stage that come before target
            if (targetHito) {
              for (const h of targetEtapa.hitos ?? []) {
                if (h.uuidHitoComercial === uuidHito) break;
                if (h.estado !== "COMPLETADO") {
                  await updateCommercialHitoEstado(h.uuidHitoComercial, "COMPLETADO");
                }
              }
            }
          }
        }

        await updateCommercialHitoEstado(uuidHito, nuevoEstado);
        await refresh();
      } catch (err) {
        console.error("updateHito:", err);
        setError(err instanceof Error ? err.message : "Error al actualizar el estado del hito.");
      }
    },
    [stepper, uuidUsuarioActivo, refresh]
  );

  // ── Map raw backend stages to UI-ready etapas ──
  const etapas: ProcesoEtapa[] = (stepper?.etapas ?? [])
    .filter((et) => et.etapa !== "PAGO")
    .map((et) => {
      const meta = STAGE_META[et.etapa as keyof typeof STAGE_META];
      const hitos: HitoItem[] = (et.hitos ?? []).map((h) => ({
        uuidHito: h.uuidHitoComercial,
        nombre: h.nombreHito,
        descripcion: h.descripcion,
        orden: h.orden,
        estado: h.estado,
        fechaCompletado: h.fechaCompletado,
        createdAt: h.createdAt,
      }));

      let estado: ProcesoEtapa["estado"] = "pendiente";
      if (et.porcentajeAvance === 100) {
        estado = "completado";
      } else if (et.porcentajeAvance > 0 || hitos.some((h) => h.estado === "EN_PROGRESO")) {
        estado = "en_proceso";
      }

      return {
        id: et.etapa,
        label: meta?.label ?? et.etapa,
        icon: meta?.icon ?? "circle",
        estado,
        hitos,
        porcentajeAvance: et.porcentajeAvance,
      };
    });

  return { stepper, etapas, loading, error, refresh, updateHito };
}

// ─── useStageDocuments ────────────────────────────────────────────────────────
// Loads (and seeds if empty) documents for all 4 document stages.

export interface StageSection {
  id: StageId;
  label: string;
  icon: string;
  docs: DocumentoItem[];
}

// Module-level lock to avoid concurrent seeding for the same stage
const seedingInProgress: Record<string, Promise<void> | undefined> = {};

export function useStageDocuments(
  contrato: UsuarioActivoResponseDTO | null,
  stepper:  StepperResponseDTO | null
) {
  const [sections, setSections] = useState<StageSection[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const uuidUsuarioActivo = contrato?.uuidUsuarioActivo ?? null;

  const load = useCallback(async () => {
    if (!uuidUsuarioActivo || !stepper) return;

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        DOCUMENT_STAGES.map((stageId) =>
          loadStageSection(stageId, uuidUsuarioActivo, stepper)
        )
      );
      setSections(results);
    } catch (err) {
      console.error("useStageDocuments:", err);
      setError(err instanceof Error ? err.message : "Error al cargar documentos del expediente.");
    } finally {
      setLoading(false);
    }
  }, [uuidUsuarioActivo, stepper]);

  useEffect(() => {
    void load();
  }, [load]);

  return { sections, loading, error, refresh: load };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

const STAGE_DISPLAY: Record<StageId, { label: string; icon: string }> = {
  SEPARACION:  { label: "Separación", icon: "handshake"       },
  CONTRATO:    { label: "Contrato",   icon: "description"     },
  ENTREGA:     { label: "Entrega",    icon: "key"             },
  SANEAMIENTO: { label: "Saneamiento",icon: "domain_verified" },
};

async function loadStageSection(
  stageId: StageId,
  uuidUsuarioActivo: string,
  stepper: StepperResponseDTO
): Promise<StageSection> {
  const display = STAGE_DISPLAY[stageId];
  const hitoId  = stepper.etapas
    ?.find((e) => e.etapa === stageId)
    ?.hitos?.[0]?.uuidHitoComercial;

  let res = await fetchStageDocuments(stageId, uuidUsuarioActivo);

  const predefs = PREDEFINED_REQUISITOS[stageId];
  const missing = predefs.filter(
    (p) => !res.documents?.some(
      (doc) => doc.title.toLowerCase().trim() === p.titulo.toLowerCase().trim()
    )
  );

  if (missing.length > 0 && hitoId) {
    const lockKey = `${uuidUsuarioActivo}_${stageId}`;

    if (seedingInProgress[lockKey]) {
      await seedingInProgress[lockKey];
    } else {
      const seedPromise = (async () => {
        for (const req of missing) {
          try {
            await createRequisito({
              hitoProcesoCompraId: hitoId,
              titulo:      req.titulo,
              descripcion: req.descripcion,
              icono:       req.icono,
            });
          } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
              console.warn(`Sin permisos para crear requisito "${req.titulo}" — se omite el seeding automático`);
              return;
            }
            throw err;
          }
        }
      })();
      seedingInProgress[lockKey] = seedPromise;
      await seedPromise;
      delete seedingInProgress[lockKey];
    }

    res = await fetchStageDocuments(stageId, uuidUsuarioActivo);
  }

  // Deduplicate by title (guards against pre-existing duplicates in DB)
  const seen  = new Set<string>();
  const docs  = (res.documents ?? []).filter((doc) => {
    const norm = doc.title.toLowerCase().trim();
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });

  return { id: stageId, ...display, docs };
}
