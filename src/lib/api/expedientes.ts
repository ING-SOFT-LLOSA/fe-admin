import { apiFetch } from "@/lib/api/http";

export interface AsignarActivoPayload {
  idUsuario: number;
  idActivo: string;
  tipoFinanciamiento: string;
  faseComercial: string;
  estadoTramiteLegal: string;
  fechaAdquisicion: string; // ISO String
}

export function asignarActivo(payload: AsignarActivoPayload): Promise<void> {
  return apiFetch<void>("/api/expedientes/asignar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchMisActivos(): Promise<import("@/lib/api/proyectos").ActivoResponseDTO[]> {
  return apiFetch<import("@/lib/api/proyectos").ActivoResponseDTO[]>("/api/expedientes/mis-activos");
}

export interface UsuarioActivoResponseDTO {
  id: string; // UUID of UsuarioActivo
  tipoFinanciamiento: string;
  faseComercial: string;
  estadoTramiteLegal: string;
  fechaAdquisicion: string;
  activo: import("@/lib/api/proyectos").ActivoResponseDTO;
  // It might also have copropietarios or similar based on the backend
}

export function fetchContratoActivo(uuidActivo: string): Promise<UsuarioActivoResponseDTO> {
  return apiFetch<UsuarioActivoResponseDTO>(`/api/expedientes/${uuidActivo}/contrato`);
}
