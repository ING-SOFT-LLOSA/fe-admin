export interface PerfilConPermisos {
  id: number;
  nombre: string;
  email: string;
  tipoUsuario: string;
  rol: string | null;
  activo: boolean;
  funciones: string[];
}
