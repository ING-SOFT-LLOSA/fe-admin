# Diferencia entre ETAPAS e HITOS en un Proyecto Inmobiliario

## ¿Un proyecto tiene hitos y etapas?

Sí. Un proyecto normalmente tiene ambos:

- **Etapas** → grandes fases del proceso.
- **Hitos** → eventos importantes dentro de una etapa.

La diferencia principal es que:

| Concepto | Qué representa | Duración |
|---|---|---|
| Etapa | Un conjunto de actividades | Tiene duración |
| Hito | Un punto clave o logro específico | No tiene duración |

---

# Ejemplo aplicado al Portal Llosa

## ETAPAS del proceso

Las etapas representan el flujo macro del proyecto y del proceso de compra del cliente.

```text
1. Separación
2. Contrato
3. Pagos y Financiamiento
4. Avance del Proyecto
5. Entrega
6. Saneamiento
```

Cada etapa agrupa múltiples actividades y documentos.

Por ejemplo:

## Etapa: Contrato

Incluye:

- Revisión del contrato
- Aprobación bancaria
- Pago de cuota inicial
- Firma del contrato

Todo eso pertenece a la misma etapa.

---

# ¿Qué son los HITOS?

Los hitos son momentos clave que indican que algo importante ocurrió.

Un hito:

- marca progreso
- cambia el estado del proceso
- desbloquea la siguiente actividad
- suele tener una fecha importante

No es una fase completa.

---

# Ejemplos de HITOS en el Portal Llosa

## En la etapa de Contrato

| Hito | Por qué es importante |
|---|---|
| Contrato aprobado | El cliente aceptó las condiciones |
| Carta bancaria aprobada | El banco validó el crédito |
| Firma del contrato | La compra quedó formalizada |

---

## En la etapa de Avance del Proyecto

| Hito | Qué indica |
|---|---|
| Licencia de construcción aprobada | Ya se puede construir legalmente |
| Inicio de obra | Comenzó la construcción |
| Casco terminado | Estructura principal completada |
| Inmueble terminado | El departamento ya está listo |

---

# Diferencia práctica

## ETAPA

Piensa en una etapa como:

> "Estamos en la fase de construcción"

Tiene duración:
- semanas
- meses
- tareas internas

---

## HITO

Piensa en un hito como:

> "Hoy se aprobó la licencia"

Es un evento puntual.

---

# Cómo debería modelarse en software

## Recomendación

La mejor estructura sería:

```text
Proyecto
└── Etapas
    └── Hitos
```

Ejemplo:

```text
ETAPA: Avance del Proyecto
    - Hito: Anteproyecto aprobado
    - Hito: Licencia aprobada
    - Hito: Inicio de obra
    - Hito: Casco terminado
```

---

# Qué NO debería pasar

Muchos sistemas mezclan hitos con etapas.

Por ejemplo:

❌ Incorrecto:

```text
Etapa: Firma de contrato
Etapa: Pago inicial
Etapa: Carta bancaria
```

Eso realmente son hitos o subprocesos.

---

# Propuesta mejor organizada para el Portal Llosa

## ETAPA 1 · Separación

### Hitos
- Proforma emitida
- Pago de separación realizado
- Ficha del cliente completada

---

## ETAPA 2 · Contrato

### Hitos
- Contrato enviado
- Contrato aprobado
- Carta bancaria aprobada
- Cuota inicial pagada
- Contrato firmado

---

## ETAPA 3 · Pagos y Financiamiento

### Hitos
- Cuotas pagadas
- Inicio de desembolso
- Escritura pública firmada
- Desembolso completado

---

## ETAPA 4 · Avance del Proyecto

### Hitos
- Anteproyecto aprobado
- Licencia obtenida
- Inicio de obra
- Excavación terminada
- Casco terminado
- Acabados terminados
- Inmueble terminado

---

## ETAPA 5 · Entrega

### Hitos
- Fecha coordinada
- Entrega realizada
- Acta firmada

---

## ETAPA 6 · Saneamiento

### Hitos
- Conformidad de obra
- Declaratoria de fábrica
- Independización
- Registro en SUNARP
- Transferencia registral completada
