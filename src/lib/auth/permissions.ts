import type { PerfilConPermisos } from "@/types/auth";
import type { ClienteRow } from "@/types/user";

/** Admin o quien tenga USER_GESTIONAR (según módulo de seguridad). */
export function canGestionarUsuarios(perfil: PerfilConPermisos | null): boolean {
  if (!perfil) return false;
  return perfil.rol === "ADMIN" || perfil.funciones.includes("USER_GESTIONAR");
}

export function canEliminarUsuario(
  perfil: PerfilConPermisos | null,
  target: ClienteRow,
): boolean {
  // Alineado con el endpoint DELETE /api/users/:id/hard del backend.
  if (!perfil || perfil.rol !== "ADMIN") return false;
  if (perfil!.id === target.id) return false;
  if (target.rol === "ADMIN") return false;
  return true;
}
