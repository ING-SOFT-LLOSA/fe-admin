export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  tipoUsuario: string;
  rol: string | null;
  activo: boolean;
  createdAt?: string;
  funciones: string[];
}

export interface CrearClientePayload {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  documentoIdentidad?: string;
  tipoUsuario: "CLIENTE";
}

export interface ClienteRow {
  id: number;
  initials: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  project: string;
  status: string;
  statusBg: string;
  tipoUsuario: string;
  rol: string | null;
}
