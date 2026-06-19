/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TabDocumentos } from "./TabDocumentos";
import type { StageSection } from "./hooks";

vi.mock("@/lib/api/requisitos", () => ({
  uploadRequisitoArchivo: vi.fn(),
  deleteRequisitoArchivo: vi.fn(),
  updateRequisito: vi.fn(),
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen }: any) => (isOpen ? <div data-testid="dialog-modal">Dialog</div> : null),
}));

const mockSection: StageSection = {
  id: "SEPARACION",
  label: "Separación",
  icon: "handshake",
  docs: [
    {
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
    },
    {
      id: "doc-2",
      title: "Proforma firmada",
      description: "",
      status: "pendiente",
      emissionDate: null,
      hasDownload: false,
      downloadUrl: null,
      hasPreview: false,
      notaCorporativa: null,
      icon: "description",
    },
  ],
};

const mockContrato = { uuidUsuarioActivo: "ua-1" } as any;

describe("TabDocumentos", () => {
  it("muestra mensaje cuando no hay contrato seleccionado", () => {
    render(
      <TabDocumentos
        contrato={null}
        sections={[]}
        loading={false}
        loadError={null}
        canUploadDocs={false}
        canEditNotes={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Selecciona una unidad para ver y gestionar sus documentos.")).toBeDefined();
  });

  it("muestra secciones con documentos", () => {
    render(
      <TabDocumentos
        contrato={mockContrato}
        sections={[mockSection]}
        loading={false}
        loadError={null}
        canUploadDocs={true}
        canEditNotes={true}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Separación")).toBeDefined();
    expect(screen.getByText("DNI del cliente")).toBeDefined();
    expect(screen.getByText("Proforma firmada")).toBeDefined();
  });

  it("muestra loading cuando está cargando y no hay sections", () => {
    render(
      <TabDocumentos
        contrato={mockContrato}
        sections={[]}
        loading={true}
        loadError={null}
        canUploadDocs={false}
        canEditNotes={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Cargando documentos y requisitos...")).toBeDefined();
  });

  it("muestra error cuando hay loadError", () => {
    render(
      <TabDocumentos
        contrato={mockContrato}
        sections={[]}
        loading={false}
        loadError="Error al cargar documentos"
        canUploadDocs={false}
        canEditNotes={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Error al cargar documentos")).toBeDefined();
  });

  it("muestra nota corporativa cuando el documento la tiene", () => {
    render(
      <TabDocumentos
        contrato={mockContrato}
        sections={[mockSection]}
        loading={false}
        loadError={null}
        canUploadDocs={false}
        canEditNotes={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Verificado por el área legal")).toBeDefined();
  });
});
