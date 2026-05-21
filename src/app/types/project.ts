import { UUID } from "crypto";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";


import { Role } from "./roles";

export type Usuario = {
  id: number;
  firebase_uuid: string;
  name: string;
  last_name: string;
  address?: string;
  DNI: string;
  birth?: Date;
  gender?: string;
  phone?: string;
  email: string;
  created_at: Date;
  rol: Role;

  
};
export type Etapa = {
  id_etapa: number;
  uuid_project: UUID;
  name:string;
  description: string;
  state:string;

  
}
export type Unit = {
  id: number;
  name: string;
  tipo: string;
  meters : number;
};

export type Tower = {
  id: number;
  name: string;
  floors: number;
  units: Unit[];
};
export type Project = {
  uuid_proyecto: UUID;
  name: string;
  district: string;
  direction: string;

  date_init: Date;
  created_at: Timestamp;
  towers: Tower[];
};