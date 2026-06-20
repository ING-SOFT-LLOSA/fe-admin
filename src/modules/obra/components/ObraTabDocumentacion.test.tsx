/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ObraTabDocumentacion from "./ObraTabDocumentacion";

vi.mock("@/lib/api/documents", () => ({
  fetchDocumentosByReferencia: vi.fn(),
  fetchSignedUrl: vi.fn(),
  deleteDocumento: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({
    isOpen,
    title,
    message,
    onConfirm,
    onClose,
  }: any) =>
    isOpen ? (
      <div data-testid="dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        {onConfirm && (
          <button type="button" onClick={onConfirm} data-testid="dialog-confirm">
            Confirmar
          </button>
        )}
        <button type="button" onClick={onClose} data-testid="dialog-close">
          Cerrar
        </button>
      </div>
    ) : null,
}));

import {
  fetchDocumentosByReferencia,
  fetchSignedUrl,
  deleteDocumento,
  uploadDocument,
} from "@/lib/api/documents";

const mockFetchDocs = vi.mocked(fetchDocumentosByReferencia);
const mockFetchSignedUrl = vi.mocked(fetchSignedUrl);
const mockDeleteDoc = vi.mocked(deleteDocumento);
const mockUploadDoc = vi.mocked(uploadDocument);

describe("ObraTabDocumentacion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchDocs.mockResolvedValue([]);
    mockFetchSignedUrl.mockResolvedValue({ url: "https://signed.url/file", expiracion: "" });
    mockDeleteDoc.mockResolvedValue(undefined);
    mockUploadDoc.mockResolvedValue({} as any);
    window.open = vi.fn();
  });

  it("renderiza el título del panel", async () => {
    render(<ObraTabDocumentacion projectId="p-1" />);
    expect(screen.getByText("Documentación del Proyecto")).toBeDefined();
  });

  it("muestra estado de carga inicial mientras se obtienen los documentos", async () => {
    mockFetchDocs.mockReturnValue(new Promise(() => {}));
    render(<ObraTabDocumentacion projectId="p-1" />);
    expect(await screen.findByText("Cargando documentos...")).toBeDefined();
  });

  it("muestra todas las categorías en estado pendiente cuando no hay documentos", async () => {
    render(<ObraTabDocumentacion projectId="p-1" />);
    expect(await screen.findByText("Anteproyecto Aprobado")).toBeDefined();
    expect(screen.getByText("Licencia de Construcción")).toBeDefined();
    expect(screen.getByText("Planos")).toBeDefined();
    expect(screen.getByText("Cuadro de Acabados")).toBeDefined();
    expect(screen.getByText("Certificación EDGE / LEED")).toBeDefined();
    const pendientes = screen.getAllByText("Pendiente");
    expect(pendientes.length).toBe(5);
  });

  it("muestra mensaje de error si la carga falla", async () => {
    mockFetchDocs.mockRejectedValue(new Error("boom"));
    render(<ObraTabDocumentacion projectId="p-1" />);
    expect(await screen.findByText("boom")).toBeDefined();
  });

  it("mapea documentos que comienzan con prefijo [categoria]", async () => {
    mockFetchDocs.mockResolvedValue([
      {
        id: "d-1",
        nombreOriginal: "[planos] plano-arq.pdf",
        tipoDocumento: "PDF_LEGAL",
        tipoMime: "application/pdf",
        idReferencia: "p-1",
        entidadReferencia: "PROYECTO",
        createdAt: "2026-05-10T00:00:00Z",
      },
      {
        id: "d-2",
        nombreOriginal: "[licencia] resolucion.pdf",
        tipoDocumento: "PDF_LEGAL",
        tipoMime: "application/pdf",
        idReferencia: "p-1",
        entidadReferencia: "PROYECTO",
        createdAt: "2026-04-01T00:00:00Z",
      },
    ] as any);

    render(<ObraTabDocumentacion projectId="p-1" />);

    expect(await screen.findByText(/Archivo:.*plano-arq\.pdf/)).toBeDefined();
    expect(screen.getByText(/Archivo:.*resolucion\.pdf/)).toBeDefined();
    const completados = screen.getAllByText("Completado");
    expect(completados.length).toBe(2);
  });

  it("mapea documento sin prefijo como categoría planos por defecto", async () => {
    mockFetchDocs.mockResolvedValue([
      {
        id: "d-x",
        nombreOriginal: "documento-sin-prefijo.pdf",
        tipoDocumento: "PDF_LEGAL",
        tipoMime: "application/pdf",
        idReferencia: "p-1",
        entidadReferencia: "PROYECTO",
      },
    ] as any);

    render(<ObraTabDocumentacion projectId="p-1" />);
    expect(await screen.findByText(/Archivo:.*documento-sin-prefijo\.pdf/)).toBeDefined();
  });

  it("abre el archivo al hacer click en el botón de descarga", async () => {
    mockFetchDocs.mockResolvedValue([
      {
        id: "d-1",
        nombreOriginal: "[planos] a.pdf",
        tipoDocumento: "PDF_LEGAL",
        tipoMime: "application/pdf",
        idReferencia: "p-1",
        entidadReferencia: "PROYECTO",
      },
    ] as any);

    render(<ObraTabDocumentacion projectId="p-1" />);

    const downloadBtn = await screen.findByTitle("Descargar / Ver archivo");
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(mockFetchSignedUrl).toHaveBeenCalledWith("d-1");
    });
    expect(window.open).toHaveBeenCalled();
  });

  it("muestra diálogo de error si falla la descarga", async () => {
    mockFetchDocs.mockResolvedValue([
      {
        id: "d-1",
        nombreOriginal: "[planos] a.pdf",
        tipoDocumento: "PDF_LEGAL",
        tipoMime: "application/pdf",
        idReferencia: "p-1",
        entidadReferencia: "PROYECTO",
      },
    ] as any);
    mockFetchSignedUrl.mockRejectedValue(new Error("No se pudo"));

    render(<ObraTabDocumentacion projectId="p-1" />);

    const downloadBtn = await screen.findByTitle("Descargar / Ver archivo");
    fireEvent.click(downloadBtn);

    expect(await screen.findByText("Error de Descarga")).toBeDefined();
  });

  it("abre diálogo de confirmación al eliminar y elimina al confirmar", async () => {
    mockFetchDocs.mockResolvedValue([
      {
        id: "d-1",
        nombreOriginal: "[planos] a.pdf",
        tipoDocumento: "PDF_LEGAL",
        tipoMime: "application/pdf",
        idReferencia: "p-1",
        entidadReferencia: "PROYECTO",
      },
    ] as any);

    render(<ObraTabDocumentacion projectId="p-1" />);

    const deleteBtn = await screen.findByTitle("Eliminar archivo");
    fireEvent.click(deleteBtn);

    expect(await screen.findByText("Eliminar Documento")).toBeDefined();

    fireEvent.click(screen.getByTestId("dialog-confirm"));

    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledWith("d-1");
    });
  });

  it("rechaza archivos que no son PDF al subir", async () => {
    render(<ObraTabDocumentacion projectId="p-1" />);

    const nonPdfFile = new File(["x"], "foto.png", { type: "image/png" });
    let capturedHandler: ((e: any) => void) | undefined;

    // Capturamos el handler onchange antes de que el componente lo setee
    const origSet = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "onchange",
    )?.set;
    Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
      configurable: true,
      set(handler: any) {
        capturedHandler = handler;
      },
      get() {
        return null;
      },
    });

    // Evitar que el file picker se abra
    const origClick = window.HTMLInputElement.prototype.click;
    window.HTMLInputElement.prototype.click = vi.fn();

    const uploadBtn = (await screen.findAllByTitle("Subir archivo"))[0];
    fireEvent.click(uploadBtn);

    expect(capturedHandler).toBeDefined();
    if (capturedHandler) {
      await capturedHandler({ target: { files: [nonPdfFile] } } as any);
    }

    expect(await screen.findByText("Formato no válido")).toBeDefined();
    expect(mockUploadDoc).not.toHaveBeenCalled();

    // Restaurar
    if (origSet) {
      Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
        configurable: true,
        set: origSet,
        get() {
          return null;
        },
      });
    } else {
      delete (window.HTMLInputElement.prototype as any).onchange;
    }
    window.HTMLInputElement.prototype.click = origClick;
  });

  it("rechaza archivos PDF mayores a 5 MB", async () => {
    render(<ObraTabDocumentacion projectId="p-1" />);

    const bigPdf = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.pdf", {
      type: "application/pdf",
    });
    let capturedHandler: ((e: any) => void) | undefined;

    const origSet = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "onchange",
    )?.set;
    Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
      configurable: true,
      set(handler: any) {
        capturedHandler = handler;
      },
      get() {
        return null;
      },
    });

    const origClick = window.HTMLInputElement.prototype.click;
    window.HTMLInputElement.prototype.click = vi.fn();

    const uploadBtn = (await screen.findAllByTitle("Subir archivo"))[0];
    fireEvent.click(uploadBtn);

    if (capturedHandler) {
      await capturedHandler({ target: { files: [bigPdf] } } as any);
    }

    expect(await screen.findByText("Archivo demasiado grande")).toBeDefined();
    expect(mockUploadDoc).not.toHaveBeenCalled();

    if (origSet) {
      Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
        configurable: true,
        set: origSet,
        get() {
          return null;
        },
      });
    } else {
      delete (window.HTMLInputElement.prototype as any).onchange;
    }
    window.HTMLInputElement.prototype.click = origClick;
  });

  it("permite subir un PDF válido y llama a uploadDocument", async () => {
    render(<ObraTabDocumentacion projectId="p-1" />);

    const pdfFile = new File(["x"], "doc.pdf", { type: "application/pdf" });
    let capturedHandler: ((e: any) => void) | undefined;

    const origSet = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "onchange",
    )?.set;
    Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
      configurable: true,
      set(handler: any) {
        capturedHandler = handler;
      },
      get() {
        return null;
      },
    });

    const origClick = window.HTMLInputElement.prototype.click;
    window.HTMLInputElement.prototype.click = vi.fn();

    const uploadBtn = (await screen.findAllByTitle("Subir archivo"))[0];
    fireEvent.click(uploadBtn);

    if (capturedHandler) {
      await capturedHandler({ target: { files: [pdfFile] } } as any);
    }

    await waitFor(() => {
      expect(mockUploadDoc).toHaveBeenCalled();
    });
    const [projectIdArg, fileArg, tipoArg] = mockUploadDoc.mock.calls[0];
    expect(projectIdArg).toBe("p-1");
    expect(fileArg.name).toMatch(/^\[[a-z]+\] doc\.pdf$/);
    expect(tipoArg).toBe("PDF_LEGAL");

    if (origSet) {
      Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
        configurable: true,
        set: origSet,
        get() {
          return null;
        },
      });
    } else {
      delete (window.HTMLInputElement.prototype as any).onchange;
    }
    window.HTMLInputElement.prototype.click = origClick;
  });

  it("muestra error si la subida falla", async () => {
    mockUploadDoc.mockRejectedValue(new Error("Falla al subir"));

    render(<ObraTabDocumentacion projectId="p-1" />);

    const pdfFile = new File(["x"], "doc.pdf", { type: "application/pdf" });
    let capturedHandler: ((e: any) => void) | undefined;

    const origSet = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "onchange",
    )?.set;
    Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
      configurable: true,
      set(handler: any) {
        capturedHandler = handler;
      },
      get() {
        return null;
      },
    });

    const origClick = window.HTMLInputElement.prototype.click;
    window.HTMLInputElement.prototype.click = vi.fn();

    const uploadBtn = (await screen.findAllByTitle("Subir archivo"))[0];
    fireEvent.click(uploadBtn);

    if (capturedHandler) {
      await capturedHandler({ target: { files: [pdfFile] } } as any);
    }

    expect(await screen.findByText("Falla al subir")).toBeDefined();

    if (origSet) {
      Object.defineProperty(window.HTMLInputElement.prototype, "onchange", {
        configurable: true,
        set: origSet,
        get() {
          return null;
        },
      });
    } else {
      delete (window.HTMLInputElement.prototype as any).onchange;
    }
    window.HTMLInputElement.prototype.click = origClick;
  });

  it("muestra error si falla la eliminación", async () => {
    mockFetchDocs.mockResolvedValue([
      {
        id: "d-1",
        nombreOriginal: "[planos] a.pdf",
        tipoDocumento: "PDF_LEGAL",
        tipoMime: "application/pdf",
        idReferencia: "p-1",
        entidadReferencia: "PROYECTO",
      },
    ] as any);
    mockDeleteDoc.mockRejectedValue(new Error("No se pudo borrar"));

    render(<ObraTabDocumentacion projectId="p-1" />);

    const deleteBtn = await screen.findByTitle("Eliminar archivo");
    fireEvent.click(deleteBtn);

    fireEvent.click(await screen.findByTestId("dialog-confirm"));

    expect(await screen.findByText("No se pudo borrar")).toBeDefined();
  });
});
