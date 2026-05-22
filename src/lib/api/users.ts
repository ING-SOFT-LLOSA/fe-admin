import { apiFetch } from "@/lib/api/http";
import type { ClienteRow, CrearClientePayload, CrearEmpleadoPayload, Usuario, Rol } from "@/types/user";

export function fetchUsuarios(): Promise<Usuario[]> {
  return apiFetch<Usuario[]>("/api/users");
}

export function registerCliente(payload: CrearClientePayload): Promise<Usuario> {
  return apiFetch<Usuario>("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateCliente(id: number, payload: Partial<CrearClientePayload>): Promise<Usuario> {
  // Simulación temporal ya que el endpoint PUT /api/users/{id} aún no existe
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        nombre: payload.nombre ?? "",
        apellidos: payload.apellidos ?? "",
        email: payload.email ?? "",
        telefono: payload.telefono,
        documentoIdentidad: payload.documentoIdentidad,
        tipoUsuario: "CLIENTE",
        rol: null,
        activo: true,
        funciones: [],
      });
    }, 1200);
  });
}

export function registerEmpleado(payload: CrearEmpleadoPayload): Promise<Usuario> {
  return apiFetch<Usuario>("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function asignarRol(idUsuario: number, idRol: number): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/users/${idUsuario}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idRol }),
  });
}

export function fetchRoles(): Promise<Rol[]> {
  return apiFetch<Rol[]>("/api/roles");
}

/** Desactiva usuario (revoca acceso Firebase, mantiene registro en BD). */
export function desactivarUsuario(id: number): Promise<void> {
  return apiFetch<void>(`/api/users/${id}`, { method: "DELETE" });
}

/** Elimina usuario en Firebase y PostgreSQL (irreversible). */
export function eliminarUsuarioCompleto(id: number): Promise<void> {
  return apiFetch<void>(`/api/users/${id}/hard`, { method: "DELETE" });
}

function getInitials(nombre: string, apellidos?: string | null): string {
  const first = nombre.trim().charAt(0);
  const second = (apellidos?.trim().charAt(0) ?? nombre.trim().charAt(1)) || "";
  return `${first}${second}`.toUpperCase();
}

function statusForUsuario(u: Usuario): { status: string; statusBg: string } {
  if (!u.activo) {
    return { status: "Inactivo", statusBg: "bg-[#eeeeef] text-[#41484c]" };
  }
  if (u.tipoUsuario === "CLIENTE") {
    return { status: "Registrado", statusBg: "bg-[#E8F5E9] text-[#2E7D32]" };
  }
  return {
    status: u.rol ?? "Empleado",
    statusBg: "bg-[#c2e8ff] text-[#001e2b]",
  };
}

export function mapUsuarioToClienteRow(u: Usuario): ClienteRow {
  const { status, statusBg } = statusForUsuario(u);
  return {
    id: u.id,
    initials: getInitials(u.nombre, u.apellidos),
    name: [u.nombre, u.apellidos].filter(Boolean).join(" "),
    dni: u.documentoIdentidad || "—",
    email: u.email,
    phone: u.telefono || "—",
    project: "Sin asignar",
    status,
    statusBg,
    tipoUsuario: u.tipoUsuario,
    rol: u.rol,
  };
}
