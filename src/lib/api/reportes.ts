import { apiFetch } from "@/lib/api/http";
import type { DocumentoResponse } from "@/lib/api/documents";

export interface ReporteResponse {
  id: string;
  uuidProyecto: string;
  nombreProyecto: string;
  tituloPeriodo: string;
  porcentajeAvance: number;
  descripcion: string;
  hitosConsolidados: string[];
  createdAt: string;
  multimedia: DocumentoResponse[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ReporteCreatePayload {
  uuidProyecto: string;
  tituloPeriodo: string;
  descripcion?: string;
  fecha?: string; // LocalDate format: "YYYY-MM-DD"
  hitosConsolidados?: string[];
}

export interface ReporteUpdatePayload {
  tituloPeriodo: string;
  descripcion?: string;
  fecha?: string;
  hitosConsolidados?: string[];
}

/**
 * List all progress reports of a project with pagination support.
 * GET /api/reportes/proyecto/{uuidProyecto}
 */
export function fetchReportesProyecto(
  uuidProyecto: string,
  page = 0,
  size = 10
): Promise<PageResponse<ReporteResponse>> {
  return apiFetch<PageResponse<ReporteResponse>>(
    `/api/reportes/proyecto/${uuidProyecto}?page=${page}&size=${size}&sort=fecha,desc`
  );
}

/**
 * List all progress reports of a project for a specific active unit asset.
 * GET /api/reportes/proyecto/{uuidActivo}/activo
 */
export function fetchReportesActivo(
  uuidActivo: string,
  page = 0,
  size = 10
): Promise<PageResponse<ReporteResponse>> {
  return apiFetch<PageResponse<ReporteResponse>>(
    `/api/reportes/proyecto/${uuidActivo}/activo?page=${page}&size=${size}&sort=fecha,desc`
  );
}

/**
 * Create a new physical progress report for a project.
 * POST /api/reportes  (multipart/form-data)
 *
 * The backend accepts:
 *  - part "reporte"  → JSON blob with the report metadata
 *  - part "archivos" → optional list of image/pdf/video files
 *
 * Do NOT set the Content-Type header manually — the browser sets the
 * correct multipart boundary automatically when using FormData.
 */
export function createReporte(
  payload: ReporteCreatePayload,
  files?: File[]
): Promise<ReporteResponse> {
  const formData = new FormData();

  // The backend uses @RequestPart("reporte") which expects a JSON blob
  formData.append(
    "reporte",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  // Attach each file as the "archivos" multi-value part
  if (files && files.length > 0) {
    for (const file of files) {
      formData.append("archivos", file);
    }
  }

  return apiFetch<ReporteResponse>("/api/reportes", {
    method: "POST",
    // Do NOT set Content-Type — browser sets it with the correct boundary
    body: formData,
  });
}

/**
 * Update an existing physical progress report.
 * PUT /api/reportes/{id}
 */
export function updateReporte(reporteId: string, payload: ReporteUpdatePayload): Promise<ReporteResponse> {
  return apiFetch<ReporteResponse>(`/api/reportes/${reporteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a progress report.
 * DELETE /api/reportes/{id}
 */
export function deleteReporte(reporteId: string): Promise<void> {
  return apiFetch<void>(`/api/reportes/${reporteId}`, {
    method: "DELETE",
  });
}
