export type ClienteFormData = {
  readonly nombre: string;
  readonly apellidos: string;
  readonly email?: string;
  readonly telefono?: string;
  readonly documentoIdentidad?: string;
};

export const validateClienteForm = (
  data: ClienteFormData,
  validateEmail = false
): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  if (!data.nombre?.trim()) {
    newErrors.nombre = "El nombre es obligatorio.";
  }

  if (!data.apellidos?.trim()) {
    newErrors.apellidos = "Los apellidos son obligatorios.";
  }

  if (validateEmail && !data.email?.trim()) {
    newErrors.email = "El correo electrónico es obligatorio.";
  }

  if (data.telefono && data.telefono.trim() !== "") {
    const phoneClean = data.telefono.replaceAll(/\s+/g, "");
    const phoneRegex = /^\+519\d{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      newErrors.telefono = "El teléfono debe iniciar con '+51' y tener 9 números (ej. +51 999 888 777).";
    }
  }

  if (data.documentoIdentidad && data.documentoIdentidad.trim() !== "") {
    const docTrimmed = data.documentoIdentidad.trim();
    if (!/^\d+$/.test(docTrimmed)) {
      newErrors.documentoIdentidad = "El documento debe contener solo números.";
    } else if (docTrimmed.length !== 8 && docTrimmed.length !== 11) {
      newErrors.documentoIdentidad = "Debe ser un DNI (8 dígitos) o RUC (11 dígitos).";
    }
  }

  return newErrors;
};
