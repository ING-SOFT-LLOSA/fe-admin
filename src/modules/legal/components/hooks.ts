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

// ─── Seed helpers ──────────────────────────────────────────────────────────────

async function esperarLock(lockKey: string): Promise<void> {
  let attempts = 0;
  while (localStorage.getItem(lockKey) === "true" && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    attempts++;
  }
}

async function crearHitosFaltantes(uuidUsuarioActivo: string): Promise<void> {
  const etapasExp = await fetchEtapasExpediente(uuidUsuarioActivo);
  for (const h of DEFAULT_HITOS) {
    const stage = etapasExp.find((e) => e.etapaProceso === h.etapaProceso);
    if (!stage) continue;
    const freshStepper = await fetchCommercialStepper(uuidUsuarioActivo);
    const hitoExists = freshStepper.etapas?.some(e =>
      e.etapa === h.etapaProceso && e.hitos?.some(existH => existH.nombreHito === h.nombreHito)
    );
    if (hitoExists) continue;
    await createCommercialHito({
      uuidEstapaExpediente: stage.uuidEtapaExpediente,
      nombreHito:           h.nombreHito,
      descripcion:          h.descripcion,
      orden:                h.orden,
    });
  }
}

async function asegurarHitos(uuidUsuarioActivo: string): Promise<StepperResponseDTO> {
  const lockKey = `seeding_hitos_${uuidUsuarioActivo}`;
  await esperarLock(lockKey);

  const doubleCheck = await fetchCommercialStepper(uuidUsuarioActivo);
  const checkTotal = doubleCheck.etapas?.reduce((acc, e) => acc + (e.hitos?.length ?? 0), 0) ?? 0;
  if (checkTotal > 0) return doubleCheck;

  localStorage.setItem(lockKey, "true");
  try {
    await crearHitosFaltantes(uuidUsuarioActivo);
  } finally {
    localStorage.removeItem(lockKey);
  }
  return await fetchCommercialStepper(uuidUsuarioActivo);
}

// ─── useCommercialStepper ─────────────────────────────────────────────────────

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

      const totalHitos =
        data.etapas?.reduce((acc, e) => acc + (e.hitos?.length ?? 0), 0) ?? 0;

      if (totalHitos === 0) {
        data = await asegurarHitos(uuidUsuarioActivo);
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
  const updateHito = useCallback(
    async (uuidHito: string, nuevoEstado: string) => {
      if (!stepper?.etapas || !uuidUsuarioActivo) return;
      setError("");

      try {
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
      const activeStages = DOCUMENT_STAGES.filter((stageId) =>
        stepper.etapas?.some((e) => e.etapa === stageId)
      );

      const results = await Promise.all(
        activeStages.map((stageId) =>
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
    const storageLockKey = `seeding_req_${uuidUsuarioActivo}_${stageId}`;

    // Espera si otra pestaña está sembrando los requerimientos de esta etapa
    let attempts = 0;
    while (localStorage.getItem(storageLockKey) === "true" && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    // Recargar documentos después de la espera
    const doubleCheckRes = await fetchStageDocuments(stageId, uuidUsuarioActivo);
    const doubleCheckExisting = doubleCheckRes.documents ?? [];
    const stillMissing = predefs.filter(
      (p) =>
        !doubleCheckExisting.some(
          (doc) =>
            doc.title.toLowerCase().trim() === p.titulo.toLowerCase().trim()
        )
    );

    if (stillMissing.length > 0) {
      localStorage.setItem(storageLockKey, "true");

      if (seedingInProgress[lockKey]) {
        try {
          await seedingInProgress[lockKey];
        } finally {
          localStorage.removeItem(storageLockKey);
        }
      } else {
        const seedPromise = (async () => {
          try {
            for (const req of stillMissing) {
              // Doble chequeo contra el backend antes de crear este requisito específico
              const freshRes = await fetchStageDocuments(stageId, uuidUsuarioActivo);
              const freshDocs = freshRes.documents ?? [];
              const exists = freshDocs.some(
                (d) => d.title.toLowerCase().trim() === req.titulo.toLowerCase().trim()
              );

              if (!exists) {
                await createRequisito({
                  etapaProcesoCompraId: etapaId,
                  titulo:               req.titulo,
                  descripcion:          req.descripcion,
                  icono:                req.icono,
                });
              }
            }
          } finally {
            localStorage.removeItem(storageLockKey);
          }
        })();
        seedingInProgress[lockKey] = seedPromise;
        await seedPromise;
        delete seedingInProgress[lockKey];
      }
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
            hitosCompletados: completedHitos,
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

  return { expediente, stages, loading, error, refresh, setExpediente };
}