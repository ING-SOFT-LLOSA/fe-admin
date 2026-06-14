import { apiFetch } from "@/lib/api/http";
// Removed mock imports
import type { ClienteRow, CrearClientePayload, CrearEmpleadoPayload, Rol, Usuario } from "@/types/user";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";

export interface Page<T> {
  content: T[];
  pageable: unknown;
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

export function fetchUsuarioPorId(id: number): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/users/${id}`);
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
    method: "PATCH",
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
  const rolName = u.rol || "Empleado";

  if (!u.activo) {
    return { status: "INACTIVO", statusBg: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/50", rolName };
  }
  return { status: "ACTIVO", statusBg: "bg-[#E8F5E9] text-[#2E7D32]", rolName };
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

export function fetchExpedientesPorUsuario(idUsuario: number): Promise<UsuarioActivoResponseDTO[]> {
  return apiFetch<UsuarioActivoResponseDTO[]>(`/api/expedientes/${idUsuario}`).then((list) =>
    list.map((item) => ({
      ...item,
      activo: item.activo ?? item.activos?.[0],
    }))
  );
}

export function unlinkAssignment(uuid: string): Promise<void> {
  return apiFetch<void>(`/api/expedientes/delete/${uuid}`, { method: "DELETE" });
}
