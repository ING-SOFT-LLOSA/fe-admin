export interface Funcion {
  idFuncion: number;
  nombreCodigo: string;
  descripcion: string;
}

export interface Rol {
  idRol: number;
  nombre: string;
  descripcion: string;
  funciones?: Funcion[];
}

export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  tipoUsuario: string;
  rol: string | null;
  activo: boolean;
  telefono?: string;
  documentoIdentidad?: string;
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

export interface CrearEmpleadoPayload {
  nombre: string;
  apellidos: string;
  email: string;
  tipoUsuario: "EMPLEADO";
  idRol: number;
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
