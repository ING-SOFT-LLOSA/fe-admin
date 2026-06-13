import { useState, useEffect, useCallback } from "react";

import {
  fetchCommercialStepper,
  createCommercialHito,
  updateCommercialHitoEstado,
  fetchEtapasExpediente,
  fetchTodosLosContratos,
  type StepperResponseDTO,
  type UsuarioActivoResponseDTO,
  type EtapaExpedienteResponseDTO,
} from "@/lib/api/expedientes";
import {
  fetchStageDocuments,
  createRequisito,
  type DocumentoItem,
} from "@/lib/api/requisitos";

import {
  DEFAULT_HITOS,
  STAGE_META,
  STAGE_ORDER,
  DOCUMENT_STAGES,
  PREDEFINED_REQUISITOS,
  BACKEND_A_ESTADO,
  type ProcesoEtapa,
  type StageId,
} from "./constants";

// ─── useCommercialStepper ─────────────────────────────────────────────────────
// Carga (y hace seed si está vacío) los hitos comerciales de un contrato.
// Ahora soporta N hitos por etapa en lugar de 1.

export function useCommercialStepper(contrato: UsuarioActivoResponseDTO | null) {
  const [stepper, setStepper] = useState<StepperResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

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

      // Cuenta hitos existentes en el backend
      const totalHitos =
        data.etapas?.reduce((acc, e) => acc + (e.hitos?.length ?? 0), 0) ?? 0;

      if (totalHitos === 0) {
        // Fetch the stages to get their uuidEtapaExpediente
        const etapasExp = await fetchEtapasExpediente(uuidUsuarioActivo);
        // Seed: crea todos los hitos definidos en DEFAULT_HITOS en orden
        for (const h of DEFAULT_HITOS) {
          const stage = etapasExp.find((e) => e.etapaProceso === h.etapaProceso);
          if (stage) {
            await createCommercialHito({
              uuidEstapaExpediente: stage.uuidEtapaExpediente,
              nombreHito:           h.nombreHito,
              descripcion:          h.descripcion,
              orden:                h.orden,
            });
          }
        }
        data = await fetchCommercialStepper(uuidUsuarioActivo);
      }

      setStepper(data);
    } catch (err) {
      console.error("useCommercialStepper:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar el proceso legal."
      );
    } finally {
      setLoading(false);
    }
  }, [uuidUsuarioActivo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Actualiza el estado de un hito individual ──────────────────────────────
  // Al marcar COMPLETADO, auto-completa todos los hitos previos (de etapas
  // anteriores) que aún estén pendientes.
  const updateHito = useCallback(
    async (uuidHito: string, nuevoEstado: string) => {
      if (!stepper?.etapas || !uuidUsuarioActivo) return;
      setError("");

      try {
        if (nuevoEstado === "COMPLETADO") {
          // Encuentra la etapa a la que pertenece el hito que se está completando
          const targetEtapa = stepper.etapas.find((et) =>
            et.hitos?.some((h) => h.uuidHitoComercial === uuidHito)
          );

          if (targetEtapa) {
            const targetStageIdx = STAGE_ORDER.indexOf(
              targetEtapa.etapa as StageId
            );

            // Auto-completa todos los hitos de etapas ANTERIORES que no lo estén
            for (let i = 0; i < targetStageIdx; i++) {
              const prevEtapa = stepper.etapas.find(
                (et) => et.etapa === STAGE_ORDER[i]
              );
              if (!prevEtapa?.hitos) continue;

              for (const hito of prevEtapa.hitos) {
                if (hito.estado !== "COMPLETADO") {
                  await updateCommercialHitoEstado(
                    hito.uuidHitoComercial,
                    "COMPLETADO"
                  );
                }
              }
            }
          }
        }

        await updateCommercialHitoEstado(uuidHito, nuevoEstado);
        await refresh();
      } catch (err) {
        console.error("updateHito:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al actualizar el estado del hito."
        );
      }
    },
    [stepper, uuidUsuarioActivo, refresh]
  );

  // ── Mapea el backend a ProcesoEtapa[] plano (un item por hito) ────────────
  // Cada hito individual del backend se convierte en una fila del timeline.
  const etapas: ProcesoEtapa[] = (stepper?.etapas ?? [])
    .flatMap((et) => {
      const stageId  = et.etapa as StageId;
      const stageMeta = STAGE_META[stageId];

      // Hitos definidos localmente para esta etapa (tienen icon e índice)
      const defaultsForStage = DEFAULT_HITOS.filter(
        (d) => d.etapaProceso === stageId
      );

      return (et.hitos ?? []).map((hito, idx): ProcesoEtapa => {
        // Busca el default por orden (backend devuelve en orden de creación)
        const def = defaultsForStage.find((d) => d.orden === (hito.orden ?? idx + 1))
          ?? defaultsForStage[idx];

        const estadoRaw = BACKEND_A_ESTADO[hito.estado] ?? "pendiente";

        return {
          id:           hito.uuidHitoComercial,
          uuidHito:     hito.uuidHitoComercial,
          label:        hito.nombreHito ?? def?.nombreHito ?? stageMeta?.label ?? stageId,
          etapaProceso: stageId,
          orden:        hito.orden ?? idx + 1,
          estado:       estadoRaw,
          icon:         def?.icon ?? stageMeta?.icon ?? "circle",
          fechaInicio:  hito.createdAt
            ? new Date(hito.createdAt).toLocaleDateString("es-PE")
            : undefined,
          fechaFin:     hito.fechaCompletado
            ? new Date(hito.fechaCompletado).toLocaleDateString("es-PE")
            : undefined,
          comentarios:  hito.descripcion ?? "",
        };
      });
    });

  return { stepper, etapas, loading, error, refresh, updateHito };
}

// ─── useStageDocuments ────────────────────────────────────────────────────────
// Carga (y hace seed si está vacío) los documentos de las 4 etapas.

export interface StageSection {
  id:    StageId;
  label: string;
  icon:  string;
  docs:  DocumentoItem[];
}

// Lock por etapa para evitar seeds concurrentes duplicados
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
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar documentos del expediente."
      );
    } finally {
      setLoading(false);
    }
  }, [uuidUsuarioActivo, stepper]);

  useEffect(() => {
    void load();
  }, [load]);

  return { sections, loading, error, refresh: load };
}

// ─── Helper privado ───────────────────────────────────────────────────────────

const STAGE_DISPLAY: Record<StageId, { label: string; icon: string }> = {
  SEPARACION:  { label: "Separación",  icon: "handshake"       },
  CONTRATO:    { label: "Contrato",    icon: "description"     },
  PAGO:        { label: "Pagos",       icon: "payments"        },
  ENTREGA:     { label: "Entrega",     icon: "key"             },
  SANEAMIENTO: { label: "Saneamiento", icon: "domain_verified" },
  OTRO:        { label: "Otro",        icon: "folder"          },
};

async function loadStageSection(
  stageId:           StageId,
  uuidUsuarioActivo: string,
  stepper:           StepperResponseDTO
): Promise<StageSection> {
  const display = STAGE_DISPLAY[stageId];

  let res = await fetchStageDocuments(stageId, uuidUsuarioActivo);

  const predefs  = PREDEFINED_REQUISITOS[stageId];
  const existing = res.documents ?? [];

  const missing = predefs.filter(
    (p) =>
      !existing.some(
        (doc) =>
          doc.title.toLowerCase().trim() === p.titulo.toLowerCase().trim()
      )
  );

  const etapaId = stepper.etapas
    ?.find((e) => e.etapa === stageId)
    ?.hitos?.[0]?.uuidEtapaExpediente;

  if (missing.length > 0 && etapaId) {
    const lockKey = `${uuidUsuarioActivo}_${stageId}`;

    if (seedingInProgress[lockKey]) {
      await seedingInProgress[lockKey];
    } else {
      const seedPromise = (async () => {
        for (const req of missing) {
          await createRequisito({
            etapaProcesoCompraId: etapaId,
            titulo:               req.titulo,
            descripcion:          req.descripcion,
            icono:                req.icono,
          });
        }
      })();
      seedingInProgress[lockKey] = seedPromise;
      await seedPromise;
      delete seedingInProgress[lockKey];
    }

    res = await fetchStageDocuments(stageId, uuidUsuarioActivo);
  }

  // Deduplica por título (protección ante duplicados previos en DB)
  const seen = new Set<string>();
  const docs  = (res.documents ?? []).filter((doc) => {
    const norm = doc.title.toLowerCase().trim();
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });

  return { id: stageId, ...display, docs };
}

// ─── useExpediente ───────────────────────────────────────────────────────────
// Carga los datos del expediente y el resumen de etapas en paralelo.
export function useExpediente(uuidUsuarioActivo: string | null) {
  const [expediente, setExpediente] = useState<UsuarioActivoResponseDTO | null>(null);
  const [stages, setStages] = useState<EtapaExpedienteResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!uuidUsuarioActivo) {
      setExpediente(null);
      setStages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [allContracts, stagesData, stepperData] = await Promise.all([
        fetchTodosLosContratos(),
        fetchEtapasExpediente(uuidUsuarioActivo),
        fetchCommercialStepper(uuidUsuarioActivo),
      ]);
      const found = allContracts.find((c) => c.uuidUsuarioActivo === uuidUsuarioActivo);
      if (!found) {
        throw new Error("Expediente no encontrado en el sistema.");
      }
      setExpediente(found);

      const correctedStages = stagesData.map((stage) => {
        const stepperStage = stepperData.etapas?.find((e) => e.etapa === stage.etapaProceso);
        if (stepperStage) {
          const totalHitos = stepperStage.hitos?.length ?? 0;
          const completedHitos = stepperStage.hitos?.filter(h => h.estado === "COMPLETADO").length ?? 0;
          const inProgressHitos = stepperStage.hitos?.filter(h => h.estado === "EN_PROGRESO").length ?? 0;

          let estado = "PENDIENTE";
          if (completedHitos === totalHitos && totalHitos > 0) {
            estado = "COMPLETADO";
          } else if (completedHitos > 0 || inProgressHitos > 0) {
            estado = "EN_PROGRESO";
          }
          return {
            ...stage,
            estado,
            totalHitos,
          };
        }
        return stage;
      });

      setStages(correctedStages);
    } catch (err) {
      console.error("useExpediente error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el expediente");
    } finally {
      setLoading(false);
    }
  }, [uuidUsuarioActivo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { expediente, stages, loading, error, refresh };
}