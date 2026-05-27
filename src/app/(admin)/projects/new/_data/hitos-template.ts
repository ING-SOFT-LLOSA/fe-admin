export const HITOS_TEMPLATE = [
  {
    orden: 1,
    nombre: "Separación",
    descripcion: "Proceso inicial de reserva de la propiedad",
    hitos: [
      { orden: 1, titulo: "Proforma emitida", tipo: "SANEAMIENTO" },
      { orden: 2, titulo: "Pago de separación realizado", tipo: "SANEAMIENTO" },
      { orden: 3, titulo: "Ficha del cliente completada", tipo: "SANEAMIENTO" },
    ]
  },
  {
    orden: 2,
    nombre: "Contrato",
    descripcion: "Firma y formalización del contrato",
    hitos: [
      { orden: 1, titulo: "Contrato enviado", tipo: "SANEAMIENTO" },
      { orden: 2, titulo: "Contrato aprobado", tipo: "SANEAMIENTO" },
      { orden: 3, titulo: "Carta bancaria aprobada", tipo: "SANEAMIENTO" },
      { orden: 4, titulo: "Cuota inicial pagada", tipo: "SANEAMIENTO" },
      { orden: 5, titulo: "Contrato firmado", tipo: "SANEAMIENTO" },
    ]
  },
  {
    orden: 3,
    nombre: "Pagos y Financiamiento",
    descripcion: "Seguimiento de cuotas y desembolso",
    hitos: [
      { orden: 1, titulo: "Cuotas pagadas", tipo: "SANEAMIENTO" },
      { orden: 2, titulo: "Inicio de desembolso", tipo: "SANEAMIENTO" },
      { orden: 3, titulo: "Escritura pública firmada", tipo: "SANEAMIENTO" },
      { orden: 4, titulo: "Desembolso completado", tipo: "SANEAMIENTO" },
    ]
  },
  {
    orden: 4,
    nombre: "Avance del Proyecto",
    descripcion: "Construcción física y licencias",
    hitos: [
      { orden: 1, titulo: "Anteproyecto aprobado", tipo: "SANEAMIENTO" },
      { orden: 2, titulo: "Licencia obtenida", tipo: "SANEAMIENTO" },
      { orden: 3, titulo: "Inicio de obra", tipo: "OBRA" },
      { orden: 4, titulo: "Excavación terminada", tipo: "OBRA" },
      { orden: 5, titulo: "Casco terminado", tipo: "OBRA" },
      { orden: 6, titulo: "Acabados terminados", tipo: "OBRA" },
      { orden: 7, titulo: "Inmueble terminado", tipo: "OBRA" },
    ]
  },
  {
    orden: 5,
    nombre: "Entrega",
    descripcion: "Coordinación y entrega física",
    hitos: [
      { orden: 1, titulo: "Fecha coordinada", tipo: "SANEAMIENTO" },
      { orden: 2, titulo: "Entrega realizada", tipo: "OBRA" },
      { orden: 3, titulo: "Acta firmada", tipo: "SANEAMIENTO" },
    ]
  },
  {
    orden: 6,
    nombre: "Saneamiento",
    descripcion: "Trámites legales finales",
    hitos: [
      { orden: 1, titulo: "Conformidad de obra", tipo: "SANEAMIENTO" },
      { orden: 2, titulo: "Declaratoria de fábrica", tipo: "SANEAMIENTO" },
      { orden: 3, titulo: "Independización", tipo: "SANEAMIENTO" },
      { orden: 4, titulo: "Registro en SUNARP", tipo: "SANEAMIENTO" },
      { orden: 5, titulo: "Transferencia registral completada", tipo: "SANEAMIENTO" },
    ]
  }
];
