/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { linkComprobanteToLegal } from "./linkComprobanteToLegal";

vi.mock("@/lib/api/expedientes", () => ({
  fetchEtapasExpediente: vi.fn(),
}));

vi.mock("@/lib/api/requisitos", () => ({
  fetchStageDocuments: vi.fn(),
  createRequisito: vi.fn(),
  uploadRequisitoArchivo: vi.fn(),
}));

import { fetchEtapasExpediente } from "@/lib/api/expedientes";
import { fetchStageDocuments, createRequisito, uploadRequisitoArchivo } from "@/lib/api/requisitos";

const mockFetchEtapas = vi.mocked(fetchEtapasExpediente);
const mockFetchDocs = vi.mocked(fetchStageDocuments);
const mockCreateReq = vi.mocked(createRequisito);
const mockUploadArchivo = vi.mocked(uploadRequisitoArchivo);

describe("linkComprobanteToLegal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no hace nada si el concepto no está en la configuración", async () => {
    await linkComprobanteToLegal("ua-1", "DESCONOCIDO", new File([], "test.pdf"));
    expect(mockFetchEtapas).not.toHaveBeenCalled();
  });

  it("no hace nada si no encuentra la etapa", async () => {
    mockFetchEtapas.mockResolvedValue([] as any);
    await linkComprobanteToLegal("ua-1", "SEPARACION", new File([], "test.pdf"));
    expect(mockFetchEtapas).toHaveBeenCalled();
    expect(mockFetchDocs).not.toHaveBeenCalled();
  });

  it("crea requisito si no existe y sube archivo", async () => {
    mockFetchEtapas.mockResolvedValue([
      { etapaProceso: "SEPARACION", uuidEtapaExpediente: "etapa-1" },
    ] as any);
    mockFetchDocs.mockResolvedValue({ documents: [] } as any);
    mockCreateReq.mockResolvedValue({ id: "req-1" } as any);
    mockUploadArchivo.mockResolvedValue(undefined);

    const file = new File(["content"], "comprobante.pdf");
    await linkComprobanteToLegal("ua-1", "SEPARACION", file);

    expect(mockCreateReq).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Comprobante de separación" })
    );
    expect(mockUploadArchivo).toHaveBeenCalledWith("req-1", file);
  });

  it("usa requisito existente si ya fue creado", async () => {
    mockFetchEtapas.mockResolvedValue([
      { etapaProceso: "SEPARACION", uuidEtapaExpediente: "etapa-1" },
    ] as any);
    mockFetchDocs.mockResolvedValue({
      documents: [{ id: "existing-req", title: "Comprobante de separación" }],
    } as any);
    mockUploadArchivo.mockResolvedValue(undefined);

    const file = new File(["content"], "comprobante.pdf");
    await linkComprobanteToLegal("ua-1", "SEPARACION", file);

    expect(mockCreateReq).not.toHaveBeenCalled();
    expect(mockUploadArchivo).toHaveBeenCalledWith("existing-req", file);
  });
});
