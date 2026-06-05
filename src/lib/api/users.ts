import { apiFetch } from "@/lib/api/http";
// Removed mock imports
import type { ClienteRow, CrearClientePayload, CrearEmpleadoPayload, Rol, Usuario } from "@/types/user";

export interface Page<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export function fetchUsuarios(): Promise<Usuario[]> {
  return apiFetch<Usuario[]>("/api/users");
}

export function fetchUsuariosPaginado(page = 0, size = 10, search = ""): Promise<Page<Usuario>> {
  return apiFetch<Page<Usuario>>(`/api/users/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}`);
}

export function registerCliente(payload: CrearClientePayload): Promise<Usuario> {
  return apiFetch<Usuario>("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateCliente(id: number, payload: Partial<CrearClientePayload>): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

export function desactivarUsuario(id: number): Promise<void> {
  return apiFetch<void>(`/api/users/${id}`, { method: "DELETE" });
}

export function eliminarUsuarioCompleto(id: number): Promise<void> {
  return apiFetch<void>(`/api/users/${id}/hard`, { method: "DELETE" });
}

function getInitials(nombre: string, apellidos?: string | null): string {
  const first = nombre.trim().charAt(0);
  const second = (apellidos?.trim().charAt(0) ?? nombre.trim().charAt(1)) || "";
  return `${first}${second}`.toUpperCase();
}

function statusForUsuario(u: Usuario): { status: string; statusBg: string; rolName: string } {
  let rolName = "Empleado";
  if (u.rol) {
    if (typeof u.rol === "string") {
      rolName = u.rol;
    } else if (typeof u.rol === "object" && "nombre" in u.rol) {
      rolName = (u.rol as any).nombre;
    }
  }

  if (!u.activo) {
    return { status: "Inactivo", statusBg: "bg-[#eeeeef] text-[#41484c]", rolName };
  }
  if (u.tipoUsuario === "CLIENTE") {
    return { status: "Registrado", statusBg: "bg-[#E8F5E9] text-[#2E7D32]", rolName };
  }

  return {
    status: rolName,
    statusBg: "bg-[#c2e8ff] text-[#001e2b]",
    rolName,
  };
}

export function mapUsuarioToClienteRow(u: Usuario): ClienteRow {
  const { status, statusBg, rolName } = statusForUsuario(u);
  
  // Como ya no hay MOCK_MODE ni assignments locales, el proyecto se ve desde el perfil.
  const assignedUnits = "Revisar perfil";

  return {
    id: u.id,
    initials: getInitials(u.nombre, u.apellidos),
    name: [u.nombre, u.apellidos].filter(Boolean).join(" "),
    dni: u.documentoIdentidad || "—",
    email: u.email,
    phone: u.telefono || "—",
    project: assignedUnits,
    status,
    statusBg,
    tipoUsuario: u.tipoUsuario,
    rol: rolName,
    createdAt: u.createdAt,
  };
}

export function fetchExpedientesPorUsuario(idUsuario: number): Promise<any[]> {
  return apiFetch<any[]>(`/api/expedientes/usuario/${idUsuario}`);
}

export function unlinkAssignment(uuid: string): Promise<void> {
  return apiFetch<void>(`/api/expedientes/delete/${uuid}`, { method: "DELETE" });
}
