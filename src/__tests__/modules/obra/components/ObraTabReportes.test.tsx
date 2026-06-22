/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ObraTabReportes from '@/modules/obra/components/ObraTabReportes';

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/reportes", () => ({
  fetchReportesProyecto: vi.fn(),
  createReporte: vi.fn(),
  deleteReporte: vi.fn(),
}));

vi.mock("@/lib/api/documents", () => ({
  uploadDocument: vi.fn(),
}));

vi.mock("@/lib/api/obra", () => ({
  getEtapasByProyecto: vi.fn(),
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen, title, message, onConfirm, onClose }: any) =>
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

import { useAuth } from "@/contexts/AuthContext";
import {
  fetchReportesProyecto,
  createReporte,
  deleteReporte,
} from "@/lib/api/reportes";
import { uploadDocument } from "@/lib/api/documents";
import { getEtapasByProyecto } from "@/lib/api/obra";

const mockUseAuth = vi.mocked(useAuth);
const mockFetchReportes = vi.mocked(fetchReportesProyecto);
const mockCreateReporte = vi.mocked(createReporte);
const mockDeleteReporte = vi.mocked(deleteReporte);
const mockUpload = vi.mocked(uploadDocument);
const mockGetEtapas = vi.mocked(getEtapasByProyecto);

const sampleReport = {
  id: "r-1",
  uuidProyecto: "p-1",
  nombreProyecto: "Aurora",
  tituloPeriodo: "Reporte Mayo 2026",
  porcentajeAvance: 45,
  descripcion: "Avance de obra del mes",
  hitosConsolidados: ["Cimentación", "Estructura"],
  createdAt: "2026-05-15T00:00:00Z",
  multimedia: [],
};

describe("ObraTabReportes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ perfil: { rol: "ADMIN", funciones: [] } } as any);
    mockFetchReportes.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 } as any);
    mockCreateReporte.mockResolvedValue(sampleReport);
    mockDeleteReporte.mockResolvedValue(undefined);
    mockUpload.mockResolvedValue({} as any);
    mockGetEtapas.mockResolvedValue([]);
  });

  it("muestra KPIs y el título del panel", async () => {
    render(<ObraTabReportes projectId="p-1" avance={50} project={null} />);
    expect(screen.getByText("Total reportes")).toBeDefined();
    expect(screen.getByText("Publicados")).toBeDefined();
    expect(screen.getByText("Borradores")).toBeDefined();
    expect(screen.getByText("Avance actual")).toBeDefined();
    expect(await screen.findByText("Reportes de avance")).toBeDefined();
  });

  it("muestra estado vacío si no hay reportes", async () => {
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    expect(await screen.findByText("No hay reportes registrados")).toBeDefined();
  });

  it("muestra el botón Nuevo reporte para usuarios con rol ADMIN", async () => {
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    expect(await screen.findByText("Nuevo reporte")).toBeDefined();
  });

  it("muestra el botón Nuevo reporte para usuarios con permiso OBRA_EDITAR", async () => {
    mockUseAuth.mockReturnValue({
      perfil: { rol: "TECNICO", funciones: ["OBRA_EDITAR"] },
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    expect(await screen.findByText("Nuevo reporte")).toBeDefined();
  });

  it("oculta el botón Nuevo reporte para usuarios sin permisos", async () => {
    mockUseAuth.mockReturnValue({
      perfil: { rol: "ASESOR", funciones: [] },
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    // se espera a que termine de cargar
    await screen.findByText("Reportes de avance");
    expect(screen.queryByText("Nuevo reporte")).toBeNull();
  });

  it("muestra lista de reportes ordenada", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [
        sampleReport,
        { ...sampleReport, id: "r-2", tituloPeriodo: "Reporte Junio", createdAt: "2026-06-15T00:00:00Z" },
      ],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={20} project={{ id: "p-1", nombre: "Aurora" } as any} />);

    expect(await screen.findByText("Reporte Mayo 2026")).toBeDefined();
    expect(screen.getByText("Reporte Junio")).toBeDefined();
    expect(screen.getByText(/2 reportes encontrados/)).toBeDefined();
    expect(screen.getByText(/· Aurora/)).toBeDefined();
  });

  it("muestra singular cuando hay un solo reporte", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [sampleReport],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={20} project={null} />);

    expect(await screen.findByText(/1 reporte encontrado/)).toBeDefined();
  });

  it("abre el detalle al pulsar un reporte y vuelve atrás", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [sampleReport],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={20} project={null} />);

    const row = await screen.findByText("Reporte Mayo 2026");
    await act(async () => {
      fireEvent.click(row);
    });

    expect(screen.getByText("Avance general del proyecto")).toBeDefined();
    expect(screen.getByText("Volver a reportes")).toBeDefined();

    fireEvent.click(screen.getByText("Volver a reportes"));
    expect(await screen.findByText("Reportes de avance")).toBeDefined();
  });

  it("muestra multimedia cuando hay archivos en el reporte", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [
        {
          ...sampleReport,
          multimedia: [
            {
              id: "m-1",
              nombreOriginal: "foto.jpg",
              tipoMime: "image/jpeg",
              idReferencia: "r-1",
              entidadReferencia: "REPORTE",
              urlAcceso: "https://signed/foto.jpg",
            },
            {
              id: "m-2",
              nombreOriginal: "video.mp4",
              tipoMime: "video/mp4",
              idReferencia: "r-1",
              entidadReferencia: "REPORTE",
              urlAcceso: "https://signed/video.mp4",
            },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    window.open = vi.fn();

    render(<ObraTabReportes projectId="p-1" avance={20} project={null} />);
    const row = await screen.findByText("Reporte Mayo 2026");
    await act(async () => {
      fireEvent.click(row);
    });

    expect(screen.getByText("Fotos y videos del período")).toBeDefined();
    const img = document.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://signed/foto.jpg");

    const mediaBox = screen.getAllByRole("button").find((b) =>
      b.className.includes("aspect-video"),
    );
    expect(mediaBox).toBeDefined();
    if (mediaBox) {
      fireEvent.click(mediaBox);
      expect(window.open).toHaveBeenCalled();
    }
  });

  it("muestra mensaje de error al fallar la carga de reportes", async () => {
    mockFetchReportes.mockRejectedValue(new Error("No se pudo cargar"));
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    expect(await screen.findByText("No se pudo cargar")).toBeDefined();
  });

  it("permite crear un reporte desde el formulario", async () => {
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);

    fireEvent.click(await screen.findByText("Nuevo reporte"));

    expect(screen.getByText("Nuevo reporte de obra")).toBeDefined();

    // Esperar a que el useEffect del título haya corrido
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText(
        "Ej. Reporte Junio 2026",
      ) as HTMLInputElement;
      expect(titleInput.value).not.toBe("");
    });

    const submitBtn = screen.getByText("Crear reporte");
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockCreateReporte).toHaveBeenCalled();
    });
  });

  it("permite cancelar el formulario", async () => {
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    fireEvent.click(await screen.findByText("Nuevo reporte"));

    // el formulario tiene su propio botón "Cancelar"
    const cancelBtns = screen.getAllByText("Cancelar");
    const formCancelBtn = cancelBtns.find((b) =>
      b.className.includes("px-5 py-2.5"),
    );
    expect(formCancelBtn).toBeDefined();
    if (formCancelBtn) fireEvent.click(formCancelBtn);

    await waitFor(() => {
      expect(screen.queryByText("Nuevo reporte de obra")).toBeNull();
    });
  });

  it("sube archivos al crear el reporte y reporta fallos parciales", async () => {
    mockUpload
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error("fallo archivo"));

    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    fireEvent.click(await screen.findByText("Nuevo reporte"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(["x"], "foto1.jpg", { type: "image/jpeg" });
    const file2 = new File(["y"], "video.mp4", { type: "video/mp4" });
    Object.defineProperty(fileInput, "files", { value: [file1, file2] });
    fireEvent.change(fileInput);

    // Esperar a que el useEffect del título haya corrido
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText(
        "Ej. Reporte Junio 2026",
      ) as HTMLInputElement;
      expect(titleInput.value).not.toBe("");
    });

    const submitBtn = screen.getByText("Crear reporte");
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockCreateReporte).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Advertencia de Subida")).toBeDefined();
  });

  it("abre diálogo de confirmación para eliminar y elimina al confirmar", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [sampleReport],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);

    const row = await screen.findByText("Reporte Mayo 2026");
    await act(async () => {
      fireEvent.click(row);
    });

    fireEvent.click(screen.getByText("Eliminar reporte"));
    expect(await screen.findByText("Eliminar Reporte de Avance")).toBeDefined();

    fireEvent.click(screen.getByTestId("dialog-confirm"));

    await waitFor(() => {
      expect(mockDeleteReporte).toHaveBeenCalledWith("r-1");
    });
  });

  it("muestra error si falla la eliminación", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [sampleReport],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    mockDeleteReporte.mockRejectedValue(new Error("No se pudo borrar"));

    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    const row = await screen.findByText("Reporte Mayo 2026");
    await act(async () => {
      fireEvent.click(row);
    });

    fireEvent.click(screen.getByText("Eliminar reporte"));
    fireEvent.click(await screen.findByTestId("dialog-confirm"));

    expect(await screen.findByText("Error al Eliminar")).toBeDefined();
  });

  it("oculta botón eliminar si el usuario no tiene permisos", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [sampleReport],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    mockUseAuth.mockReturnValue({ perfil: { rol: "ASESOR", funciones: [] } } as any);

    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    const row = await screen.findByText("Reporte Mayo 2026");
    await act(async () => {
      fireEvent.click(row);
    });

    expect(screen.queryByText("Eliminar reporte")).toBeNull();
  });

  it("renderiza hitos consolidados y descripción en el detalle", async () => {
    mockFetchReportes.mockResolvedValue({
      content: [sampleReport],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);

    const row = await screen.findByText("Reporte Mayo 2026");
    await act(async () => {
      fireEvent.click(row);
    });

    expect(screen.getByText("Hitos consolidados")).toBeDefined();
    expect(screen.getByText("Cimentación")).toBeDefined();
    expect(screen.getByText("Estructura")).toBeDefined();
    expect(screen.getByText("Avance de obra del mes")).toBeDefined();
  });

  it("muestra mensaje cuando el detalle no tiene descripción", async () => {
    const reportSinDesc = { ...sampleReport, descripcion: "" };
    mockFetchReportes.mockResolvedValue({
      content: [reportSinDesc],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    } as any);
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);

    const row = await screen.findByText("Reporte Mayo 2026");
    await act(async () => {
      fireEvent.click(row);
    });

    expect(screen.queryByText(/Comentarios del residente/)).toBeDefined();
  });

  it("carga hitos disponibles para el formulario desde el backend", async () => {
    mockGetEtapas.mockResolvedValue([
      {
        id: 1,
        nombre: "Cimentación",
        descripcion: "",
        orden: 1,
        estado: "COMPLETADO",
        hitos: [],
      },
    ] as any);

    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    fireEvent.click(await screen.findByText("Nuevo reporte"));

    await waitFor(() => {
      expect(mockGetEtapas).toHaveBeenCalledWith("p-1");
    });

    expect(await screen.findByText("Cimentación")).toBeDefined();
  });

  it("permite seleccionar y deseleccionar hitos en el formulario", async () => {
    mockGetEtapas.mockResolvedValue([
      {
        id: 1,
        nombre: "Cimentación",
        descripcion: "",
        orden: 1,
        estado: "COMPLETADO",
        hitos: [],
      },
    ] as any);

    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    fireEvent.click(await screen.findByText("Nuevo reporte"));

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(true);
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });

  it("muestra error en el formulario si onSubmit lanza", async () => {
    mockCreateReporte.mockRejectedValue(new Error("submit fail"));
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    fireEvent.click(await screen.findByText("Nuevo reporte"));

    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText(
        "Ej. Reporte Junio 2026",
      ) as HTMLInputElement;
      expect(titleInput.value).not.toBe("");
    });

    const submitBtn = screen.getByText("Crear reporte");
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText("submit fail")).toBeDefined();
  });

  it("muestra estado de carga inicial mientras se cargan los reportes", async () => {
    mockFetchReportes.mockReturnValue(new Promise(() => {}));
    render(<ObraTabReportes projectId="p-1" avance={0} project={null} />);
    expect(await screen.findByText("Cargando reportes...")).toBeDefined();
  });
});
