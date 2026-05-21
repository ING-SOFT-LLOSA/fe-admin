import type { UUID } from "crypto";
import type { Timestamp } from "next/dist/server/lib/cache-handlers/types";

import type { Project } from "@/app/types/project";

export type ProjectFormValues = {
  name: string;
  district: string;
  direction: string;
  date_init: string;
};

export type ProjectMock = Project & {
  slug: string;
};

const createTimestamp = (date: string) => new Date(date) as unknown as Timestamp;

export const MOCK_PROJECTS: ProjectMock[] = [
  {
    slug: "altos-del-valle",
    uuid_proyecto: "6b1d4d98-9f38-46e6-9b7b-70fc6a11b301" as UUID,
    name: "Altos del Valle",
    district: "Santiago de Surco",
    direction: "Av. Primavera 1840",
    date_init: new Date("2025-02-10"),
    created_at: createTimestamp("2025-01-12"),
    towers: [
      {
        id: 1,
        name: "Torre A",
        floors: 18,
        units: [
          { id: 1, name: "A-101", tipo: "Departamento", meters: 78 },
          { id: 2, name: "A-102", tipo: "Departamento", meters: 82 },
          { id: 3, name: "A-201", tipo: "Departamento", meters: 80 },
        ],
      },
      {
        id: 2,
        name: "Torre B",
        floors: 20,
        units: [
          { id: 4, name: "B-101", tipo: "Departamento", meters: 76 },
          { id: 5, name: "B-102", tipo: "Departamento", meters: 81 },
        ],
      },
    ],
  },
  {
    slug: "bosques-de-cayetano",
    uuid_proyecto: "ff3293c1-e760-41e1-81aa-0c9c4b1b4402" as UUID,
    name: "Bosques de Cayetano",
    district: "San Borja",
    direction: "Jr. Velasco Astete 520",
    date_init: new Date("2024-11-04"),
    created_at: createTimestamp("2024-10-01"),
    towers: [
      {
        id: 3,
        name: "Torre Central",
        floors: 14,
        units: [
          { id: 6, name: "C-201", tipo: "Departamento", meters: 69 },
          { id: 7, name: "C-202", tipo: "Departamento", meters: 72 },
          { id: 8, name: "C-301", tipo: "Departamento", meters: 70 },
          { id: 9, name: "C-302", tipo: "Departamento", meters: 74 },
        ],
      },
    ],
  },
  {
    slug: "mirador-de-la-ciudad",
    uuid_proyecto: "24431a40-82b4-4334-b27e-c70db2c6f503" as UUID,
    name: "Mirador de la Ciudad",
    district: "Miraflores",
    direction: "Calle Alcanfores 245",
    date_init: new Date("2026-01-20"),
    created_at: createTimestamp("2025-12-08"),
    towers: [
      {
        id: 4,
        name: "Torre Norte",
        floors: 22,
        units: [
          { id: 10, name: "N-401", tipo: "Departamento", meters: 88 },
          { id: 11, name: "N-402", tipo: "Departamento", meters: 91 },
          { id: 12, name: "N-501", tipo: "Penthouse", meters: 126 },
        ],
      },
      {
        id: 5,
        name: "Torre Sur",
        floors: 16,
        units: [
          { id: 13, name: "S-101", tipo: "Departamento", meters: 67 },
          { id: 14, name: "S-201", tipo: "Departamento", meters: 71 },
        ],
      },
      {
        id: 6,
        name: "Torre Club",
        floors: 8,
        units: [
          { id: 15, name: "CL-01", tipo: "Oficina", meters: 54 },
          { id: 16, name: "CL-02", tipo: "Oficina", meters: 58 },
        ],
      },
    ],
  },
];

export function getMockProjects() {
  return MOCK_PROJECTS;
}

export function getProjectBySlug(slug: string) {
  return MOCK_PROJECTS.find((project) => project.slug === slug) ?? null;
}

export function getProjectFormValues(project: ProjectMock): ProjectFormValues {
  return {
    name: project.name,
    district: project.district,
    direction: project.direction,
    date_init: project.date_init.toISOString().split("T")[0] ?? "",
  };
}

export function getProjectStats(project: ProjectMock) {
  return {
    towersCount: project.towers.length,
    unitsCount: project.towers.reduce((total, tower) => total + tower.units.length, 0),
  };
}

export function formatProjectDate(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
