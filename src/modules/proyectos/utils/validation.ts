export type ProjectValidationData = {
  readonly nombre?: string;
  readonly direccion?: string;
  readonly departamento?: string;
  readonly distrito?: string;
  readonly fechaInicio?: string;
  readonly fechaFin?: string;
};

export const validateProjectForm = (
  data: ProjectValidationData
): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  if (!data.nombre?.trim()) {
    newErrors.nombre = "El nombre del proyecto es obligatorio.";
  } else if (data.nombre.trim().length < 3) {
    newErrors.nombre = "El nombre debe tener al menos 3 caracteres.";
  }

  if (!data.direccion?.trim()) {
    newErrors.direccion = "La dirección es obligatoria.";
  }

  if (!data.departamento?.trim()) {
    newErrors.departamento = "El departamento es obligatorio.";
  }

  if (!data.distrito?.trim()) {
    newErrors.distrito = "El distrito es obligatorio.";
  }

  if (data.fechaInicio && data.fechaFin) {
    const start = new Date(data.fechaInicio);
    const end = new Date(data.fechaFin);
    if (end < start) {
      newErrors.fechaFin = "La fecha de fin no puede ser anterior a la fecha de inicio.";
    }
  }

  return newErrors;
};
