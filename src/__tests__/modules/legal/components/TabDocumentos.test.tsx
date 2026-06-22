/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TabDocumentos } from '@/modules/legal/components/TabDocumentos';
import type { StageSection } from '@/modules/legal/components/hooks';

vi.mock("@/lib/api/requisitos", () => ({
  uploadRequisitoArchivo: vi.fn(),
  deleteRequisitoArchivo: vi.fn(),
  updateRequisito: vi.fn(),
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen, title, message, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <p>{title}</p>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirmar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
}));

import { deleteRequisitoArchivo, updateRequisito } from "@/lib/api/requisitos";

const mockDelete = vi.mocked(deleteRequisitoArchivo);
const mockUpdate = vi.mocked(updateRequisito);

const mockContrato = { uuidUsuarioActivo: "ua-1" } as any;

function makeDoc(overrides: Record<string, any> = {}): any {
  return {
    id: "doc-1",
    title: "DNI del cliente",
    description: "Copia del DNI vigente",
    status: "COMPLETADA",
    emissionDate: "2026-01-15",
    hasDownload: true,
    downloadUrl: "https://cdn.example.com/doc.pdf",
    hasPreview: false,
    notaCorporativa: "Verificado por el área legal",
    icon: "description",
    ...overrides,
  };
}

function makeSection(overrides: Record<string, any> = {}): StageSection {
  return {
    id: "SEPARACION",
    label: "Separación",
    icon: "handshake",
    docs: [makeDoc()],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("TabDocumentos", () => {
  it("muestra mensaje cuando no hay contrato seleccionado", () => {
    render(
      <TabDocumentos contrato={null} sections={[]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Selecciona una unidad para ver y gestionar sus documentos.")).toBeDefined();
  });

  it("muestra secciones con documentos", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={true} canEditNotes={true} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("DNI del cliente")).toBeDefined();
  });

  it("muestra loading cuando está cargando y no hay sections", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[]} loading={true} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Cargando documentos y requisitos...")).toBeDefined();
  });

  it("muestra error cuando hay loadError", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[]} loading={false} loadError="Error al cargar documentos" canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Error al cargar documentos")).toBeDefined();
  });

  it("muestra nota corporativa cuando el documento la tiene", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Verificado por el área legal")).toBeDefined();
  });

  it("muestra botón de descarga cuando hasDownload es true", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={true} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByTitle("Descargar / Ver archivo")).toBeDefined();
  });

  it("muestra botón de eliminar para documento completado cuando canUploadDocs es true", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={true} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByTitle("Eliminar archivo")).toBeDefined();
  });

  it("NO muestra botones de acciones cuando canUploadDocs es false", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.queryByTitle("Subir archivo")).toBeNull();
    expect(screen.queryByTitle("Eliminar archivo")).toBeNull();
  });

  it("muestra upload button para documento pendiente", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection({ docs: [makeDoc({ status: "pendiente", hasDownload: false, downloadUrl: null, notaCorporativa: null })] })]} loading={false} loadError={null} canUploadDocs={true} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByTitle("Subir archivo")).toBeDefined();
  });

  it("muestra badge 'Completado' para documento completado", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Completado")).toBeDefined();
  });

  it("muestra badge 'Pendiente' para documento pendiente", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection({ docs: [makeDoc({ status: "pendiente", hasDownload: false, downloadUrl: null, notaCorporativa: null })] })]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Pendiente")).toBeDefined();
  });

  it("dispara delete con diálogo de confirmación", async () => {
    mockDelete.mockResolvedValue({} as any);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={true} canEditNotes={false} onRefresh={onRefresh} />
    );

    fireEvent.click(screen.getByTitle("Eliminar archivo"));
    expect(screen.getByText("Eliminar Documento")).toBeDefined();

    fireEvent.click(screen.getByText("Confirmar"));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("doc-1");
    });
  });

  it("maneja error en delete", async () => {
    mockDelete.mockRejectedValue(new Error("Error al eliminar"));
    const onRefresh = vi.fn();

    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={true} canEditNotes={false} onRefresh={onRefresh} />
    );

    fireEvent.click(screen.getByTitle("Eliminar archivo"));
    fireEvent.click(screen.getByText("Confirmar"));

    await waitFor(() => {
      expect(screen.getByText("Error al eliminar")).toBeDefined();
    }, { timeout: 3000 });
  });

  it("inicia edición de nota corporativa", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={true} onRefresh={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Editar Nota"));
    expect(screen.getByPlaceholderText("Escribe una nota interna...")).toBeDefined();
  });

  it("guarda nota corporativa editada", async () => {
    mockUpdate.mockResolvedValue({} as any);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={true} onRefresh={onRefresh} />
    );

    fireEvent.click(screen.getByText("Editar Nota"));
    fireEvent.change(screen.getByPlaceholderText("Escribe una nota interna..."), { target: { value: "Nueva nota" } });
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("doc-1", { titulo: "DNI del cliente", notaCorporativa: "Nueva nota" });
    });
  });

  it("cancela edición de nota corporativa", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={true} onRefresh={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Editar Nota"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByPlaceholderText("Escribe una nota interna...")).toBeNull();
  });

  it("muestra 'Agregar Nota' cuando doc no tiene nota y canEditNotes es true", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection({ docs: [makeDoc({ notaCorporativa: null })] })]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={true} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Agregar Nota")).toBeDefined();
  });

  it("muestra 'Sin notas corporativas' cuando no hay nota y canEditNotes es false", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection({ docs: [makeDoc({ notaCorporativa: null })] })]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Sin notas corporativas.")).toBeDefined();
  });

  it("muestra mensaje 'No se han configurado requisitos' cuando section no tiene docs", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection({ docs: [] })]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("No se han configurado requisitos para esta etapa.")).toBeDefined();
  });

  it("muestra actionError y loadError juntos", () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError="Error de carga" canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );
    expect(screen.getByText("Error de carga")).toBeDefined();
  });

  it("maneja error en guardar nota", async () => {
    mockUpdate.mockRejectedValue(new Error("Error al guardar nota"));
    const onRefresh = vi.fn();

    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={true} onRefresh={onRefresh} />
    );

    fireEvent.click(screen.getByText("Editar Nota"));
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(screen.getByText("Error al guardar nota")).toBeDefined();
    }, { timeout: 3000 });
  });

  it("dispara descarga al hacer clic en botón de descarga", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={false} canEditNotes={false} onRefresh={vi.fn()} />
    );

    fireEvent.click(screen.getByTitle("Descargar / Ver archivo"));
    expect(openSpy).toHaveBeenCalledWith("https://cdn.example.com/doc.pdf", "_blank", "noopener,noreferrer");
  });

  it("cierra diálogo de confirmación al hacer clic en Cancelar", async () => {
    render(
      <TabDocumentos contrato={mockContrato} sections={[makeSection()]} loading={false} loadError={null} canUploadDocs={true} canEditNotes={false} onRefresh={vi.fn()} />
    );

    fireEvent.click(screen.getByTitle("Eliminar archivo"));
    expect(screen.getByText("Eliminar Documento")).toBeDefined();

    fireEvent.click(screen.getByText("Cancelar"));

    await waitFor(() => {
      expect(screen.queryByText("Eliminar Documento")).toBeNull();
    });
  });
});
