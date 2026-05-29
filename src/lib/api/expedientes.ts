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
