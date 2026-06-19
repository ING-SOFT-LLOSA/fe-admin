import { fetchEtapasExpediente } from "@/lib/api/expedientes";
import { fetchStageDocuments, createRequisito, uploadRequisitoArchivo } from "@/lib/api/requisitos";

const REQUISITOS_CONFIG: Record<string, { etapa: "SEPARACION" | "CONTRATO"; titulo: string; descripcion: string }> = {
  SEPARACION: {
    etapa: "SEPARACION",
    titulo: "Comprobante de separación",
    descripcion: "Comprobante de pago de la separación.",
  },
  INICIAL: {
    etapa: "CONTRATO",
    titulo: "Pago Inicial",
    descripcion: "Comprobante del pago de la cuota inicial para formalizar la compra.",
  },
};

export async function linkComprobanteToLegal(
  uuidUsuarioActivo: string,
  concepto: string,
  file: File
): Promise<void> {
  const config = REQUISITOS_CONFIG[concepto];
  if (!config) return;

  const etapas = await fetchEtapasExpediente(uuidUsuarioActivo);
  const stage = etapas.find((e) => e.etapaProceso === config.etapa);
  if (!stage) return;

  const stageDocs = await fetchStageDocuments(config.etapa, uuidUsuarioActivo);
  let requisitoId = stageDocs.documents.find(
    (d) => d.title.toLowerCase().trim() === config.titulo.toLowerCase().trim()
  )?.id;

  if (!requisitoId) {
    const created = await createRequisito({
      etapaProcesoCompraId: stage.uuidEtapaExpediente,
      titulo: config.titulo,
      descripcion: config.descripcion,
      icono: "payments",
    });
    requisitoId = created.id;
  }

  await uploadRequisitoArchivo(requisitoId, file);
}
