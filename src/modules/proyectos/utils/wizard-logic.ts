export interface ProjectFormData {
  nombre: string;
  descripcion: string;
  precertificacionEdgeLeed: boolean;
  linkRecorridoVirtual: string;
  departamento: string;
  distrito: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface InventoryConfig {
  numTorres: number;
  pisosPorTorre: number;
  depasPorPiso: number;
  cocherasPorPiso: number;
  depositosPorPiso: number;
}

export function generateStructurePayload(config: InventoryConfig) {
  const torres = [];

  for (let t = 1; t <= config.numTorres; t++) {
    const pisos = [];
    
    for (let p = 1; p <= config.pisosPorTorre; p++) {
      const activos = [];

      // Generate Departamentos
      for (let d = 1; d <= config.depasPorPiso; d++) {
        activos.push({
          nro: `Dpto ${p}0${d}`,
          tipo: "DEPARTAMENTO",
          areaM2: 75.0, // Default mock values to be edited later
          estadoComercial: "DISPONIBLE",
          precio: 150000.00,
          descripcion: "Departamento generado automáticamente",
        });
      }

      // Generate Cocheras
      for (let c = 1; c <= config.cocherasPorPiso; c++) {
        activos.push({
          nro: `Cochera S${p}0${c}`,
          tipo: "COCHERA",
          areaM2: 12.5,
          estadoComercial: "DISPONIBLE",
          precio: 15000.00,
          descripcion: "Cochera generada automáticamente",
        });
      }

      // Generate Depositos
      for (let d = 1; d <= config.depositosPorPiso; d++) {
        activos.push({
          nro: `Depósito S${p}0${d}`,
          tipo: "DEPOSITO",
          areaM2: 5.0,
          estadoComercial: "DISPONIBLE",
          precio: 5000.00,
          descripcion: "Depósito generado automáticamente",
        });
      }

      pisos.push({
        nroPiso: p,
        activos,
      });
    }

    torres.push({
      nombre: `Torre ${String.fromCharCode(64 + t)}`, // Torre A, Torre B, etc.
      pisos,
    });
  }

  return { torres };
}
