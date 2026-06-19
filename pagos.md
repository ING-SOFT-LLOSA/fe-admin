# API de Pagos

## Conceptos

| Concepto | Significado | nroCuota |
|---|---|---|
| `SEPARACION` | Pago de separación de unidad | -1 |
| `INICIAL` | Cuota inicial | 0 |
| `CUOTA` | Cuota regular del cronograma (solo crédito directo) | 1..N |
| `COMPLETO` | Pago completo / desembolso (solo crédito hipotecario) | 1 |

## Flujo típico

**Admin:**
1. Crear cronograma → se generan Pagos automáticos según tipo de crédito
2. Opcional: agregar / editar / eliminar cuotas manualmente
3. Cambiar estado de un pago (PENDIENTE → PAGADO / VENCIDO)

**Cliente:**
1. Ver cronograma + resumen de pagos
2. Ver lista de cuotas con estados
3. Subir comprobante (baucher) para pagar una cuota

---

## Endpoints — Configuración (Admin)

### Crear cronograma de pagos

```
POST /api/cronogramas
Auth: CONTRATO_EDITAR
```

**Request body:**
```json
{
  "uuidUsuarioActivo": "uuid-del-expediente",
  "totalPactado": 150000.00,
  "numeroCuotas": 12,
  "pagoSeparacion": 1000.00,
  "pagoIncial": 15000.00
}
```

**Generación automática de pagos:**

| tipoFinanciamiento | Pagos creados |
|---|---|
| `Crédito Directo` | `SEPARACION(-1)`, `INICIAL(0)`, `CUOTA(1..N)` |
| `Crédito Hipotecario` | `SEPARACION(-1)`, `INICIAL(0)`, `COMPLETO(1)` |

`Pago(SEPARACION)` se vincula al requisito **"Comprobante de separación"** de la etapa **SEPARACION**.
`Pago(INICIAL)` se vincula al requisito **"Pago Inicial"** de la etapa **CONTRATO**.

**Response `201 Created`:**
```json
{
  "uuidCronograma": "uuid",
  "uuidUsuarioActivo": "uuid",
  "totalPactado": 150000.00,
  "numeroCuotas": 12,
  "estado": "ACTIVO",
  "pagoSeparacion": 1000.00,
  "pagoInicial": 15000.00
}
```

---

### Obtener cronograma por expediente

```
GET /api/cronogramas/{uuidUsuarioActivo}
Auth: CONTRATO_VER
```

Response: `CronogramaPagoResponse`

---

### Actualizar cronograma

```
PUT /api/cronogramas/{uuidCronograma}
Auth: CONTRATO_EDITAR
```

Body: mismo que POST. **No regenera los pagos automáticos.**

---

### Eliminar cronograma

```
DELETE /api/cronogramas/{uuidCronograma}
Auth: CONTRATO_EDITAR
```

Response: `204 No Content`

---

### Agregar cuota manual

```
POST /api/cronogramas/{uuidCronograma}/pagos
Auth: CONTRATO_EDITAR
```

**Request body:**
```json
{
  "nroCuota": 5,
  "montoProgramado": 2500.00,
  "fechaVencimiento": "2026-07-15",
  "concepto": "CUOTA",
  "comentario": null
}
```

Response: `PagoResponse`

---

### Editar cuota

```
PUT /api/pagos/{uuidPago}
Auth: CONTRATO_EDITAR
```

Body: mismo que POST.

---

### Eliminar cuota

```
DELETE /api/pagos/{uuidPago}
Auth: CONTRATO_EDITAR
```

Response: `204 No Content`

---

### Cambiar estado de cuota

```
PATCH /api/pagos/{uuidPago}/estado?estado=PAGADO
Auth: CONTRATO_EDITAR
```

| QueryParam | Valores |
|---|---|
| `estado` | `PENDIENTE`, `PAGADO`, `VENCIDO` |

- Al marcar `PAGADO` se setea `fechaPago = now` y `montoPagado = montoProgramado` (si no tenía).
- Al marcar `VENCIDO` se limpia `fechaPago`.

Response: `PagoResponse`

---

## Endpoints — Cliente

### Listar cuotas del cronograma

```
GET /api/cronogramas/{uuidCronograma}/pagos
Auth: CONTRATO_VER
```

**Response:**
```json
[
  {
    "uuidPago": "uuid",
    "uuidCronograma": "uuid",
    "nroCuota": -1,
    "montoProgramado": 1000.00,
    "fechaVencimiento": "2026-07-15",
    "estado": "PAGADO",
    "montoPagado": 1000.00,
    "fechaPago": "2026-06-18T10:30:00",
    "uuidComprobante": "uuid-del-documento",
    "actualizadoPor": 1,
    "concepto": "SEPARACION",
    "comentario": "Pago realizado por transferencia",
    "uuidRequisitoDocumental": "uuid-del-requisito",
    "createdAt": "2026-06-18T10:30:00",
    "updatedAt": "2026-06-18T10:30:00"
  }
]
```

**Para crédito directo**, los pagos devueltos serán:
```
SEPARACION(-1) → nroCuota = -1
INICIAL(0)     → nroCuota = 0
CUOTA(1)       → nroCuota = 1
CUOTA(2)       → nroCuota = 2
...
CUOTA(N)       → nroCuota = N
```

**Para crédito hipotecario:**
```
SEPARACION(-1) → nroCuota = -1
INICIAL(0)     → nroCuota = 0
COMPLETO(1)    → nroCuota = 1
```

---

### Subir comprobante (baucher)

```
POST /api/pagos/{uuidPago}/comprobante
Content-Type: multipart/form-data
Auth: CONTRATO_EDITAR
```

| Campo | Tipo | Requerido |
|---|---|---|
| `file` | Archivo (pdf, jpg, png) | Sí |
| `comentario` | String | No |

**Efectos al subir:**
1. Marca el pago como `PAGADO` (con `fechaPago = now`)
2. Guarda el `comentario` en el pago
3. Si el pago tiene `uuidRequisitoDocumental` vinculado:
   - Crea un segundo `Documento(entidadReferencia="REQUISITO")` apuntando al mismo archivo en GCS
   - Marca el `RequisitoDocumental` como `COMPLETADO` con `fechaEmision = today`
   - Copia el comentario a `notaCorporativa` del requisito
   - El documento aparece automáticamente en la etapa correspondiente (SEPARACION o CONTRATO)

**Response:** `PagoResponse`

---

### Resumen de pagos (crédito directo)

```
GET /api/cronogramas/{uuidCronograma}/resumen
Auth: CONTRATO_VER
```

**Response:**
```json
{
  "totalPactado": 150000.00,
  "totalPagado": 16000.00,
  "totalPendiente": 134000.00,
  "estadoGlobal": "AL_DIA",
  "cuotasPagadas": 2,
  "cuotasPendientes": 10,
  "cuotasVencidas": 0,
  "proximoVencimiento": "2026-07-15"
}
```

| estadoGlobal | Significado |
|---|---|
| `ACTIVO` | Sin cuotas registradas |
| `AL_DIA` | Al día con todos los pagos |
| `EN_MORA` | Con cuotas vencidas |
| `EN_RIESGO` | Cuotas próximas a vencer (≤ 7 días) |
| `LIQUIDADO` | Todas las cuotas pagadas |

---

### Resumen de pagos (crédito hipotecario)

```
GET /api/cronogramas/{uuidCronograma}/resumen/credito-hipo
Auth: CONTRATO_VER
```

**Response:**
```json
{
  "montoTotal": 150000.00,
  "totalPagado": 16000.00,
  "saldoPendiente": 134000.00,
  "estadoGlobal": "RETRASADO"
}
```

| estadoGlobal | Significado |
|---|---|
| `AL_DIA` | Separación e inicial pagados |
| `RETRASADO` | Falta pago de separación o inicial |

---

## Tipos de respuesta

### `PagoResponse`

| Campo | Tipo | Descripción |
|---|---|---|
| `uuidPago` | `UUID` | ID del pago |
| `uuidCronograma` | `UUID` | ID del cronograma al que pertenece |
| `nroCuota` | `Integer` | -1=separación, 0=inicial, 1..N=cuotas |
| `montoProgramado` | `BigDecimal` | Monto programado |
| `fechaVencimiento` | `LocalDate` | Fecha de vencimiento |
| `estado` | `String` | `PENDIENTE` / `PAGADO` / `VENCIDO` |
| `montoPagado` | `BigDecimal` | Monto realmente pagado |
| `fechaPago` | `LocalDateTime` | Fecha en que se pagó (null si no pagado) |
| `uuidComprobante` | `UUID` | ID del Documento comprobante (null si no subido) |
| `actualizadoPor` | `Integer` | ID del usuario que actualizó |
| `concepto` | `ConceptoPago` | `SEPARACION` / `INICIAL` / `CUOTA` / `COMPLETO` |
| `comentario` | `String` | Comentario opcional del pago |
| `uuidRequisitoDocumental` | `UUID` | Requisito documental vinculado (null si no aplica) |
| `createdAt` | `LocalDateTime` | Fecha de creación |
| `updatedAt` | `LocalDateTime` | Fecha de última actualización |

### `CronogramaPagoResponse`

| Campo | Tipo | Descripción |
|---|---|---|
| `uuidCronograma` | `UUID` | ID del cronograma |
| `uuidUsuarioActivo` | `UUID` | ID del expediente asociado |
| `totalPactado` | `BigDecimal` | Monto total a pagar |
| `numeroCuotas` | `Integer` | Número de cuotas regulares |
| `estado` | `String` | `ACTIVO` |
| `pagoSeparacion` | `BigDecimal` | Monto de pago de separación |
| `pagoInicial` | `BigDecimal` | Monto de pago inicial / cuota inicial |
| `createdAt` | `LocalDateTime` | Fecha de creación |
| `updatedAt` | `LocalDateTime` | Fecha de última actualización |

### `ResumenResponse`

| Campo | Tipo |
|---|---|
| `totalPactado` | `BigDecimal` |
| `totalPagado` | `BigDecimal` |
| `totalPendiente` | `BigDecimal` |
| `estadoGlobal` | `String` (`ACTIVO`/`AL_DIA`/`EN_MORA`/`EN_RIESGO`/`LIQUIDADO`) |
| `cuotasPagadas` | `long` |
| `cuotasPendientes` | `long` |
| `cuotasVencidas` | `long` |
| `proximoVencimiento` | `LocalDate` |

### `ResumenResponseHipotecarioDTO`

| Campo | Tipo |
|---|---|
| `montoTotal` | `BigDecimal` |
| `totalPagado` | `BigDecimal` |
| `saldoPendiente` | `BigDecimal` |
| `estadoGlobal` | `EstadoGlobalPago` (`AL_DIA` / `RETRASADO`) |

---

## Enums

### `ConceptoPago`

```java
SEPARACION  // Pago de separación
INICIAL     // Cuota inicial
CUOTA       // Cuota regular del cronograma
COMPLETO    // Pago completo (solo hipotecario)
```

### `EstadoGlobalPago`

```java
AL_DIA     // Pagos al día
RETRASADO  // Pagos atrasados (usado en resumen hipotecario)
```

---

## Notas importantes

1. **Los pagos de `SEPARACION` e `INICIAL` se crean automáticamente** al crear el cronograma y se vinculan a los requisitos documentales de las etapas SEPARACION y CONTRATO respectivamente.
2. **Cuando se sube un comprobante**, si el pago tiene `uuidRequisitoDocumental`, automáticamente se completa el requisito y el documento es visible desde la etapa correspondiente (sin necesidad de subirlo dos veces).
3. **Los pagos regulares (`CUOTA`)** aparecen solo en la sección de pagos, no tienen requisito vinculado.
4. **Las cuotas regulares comienzan desde `nroCuota = 1`** (el 0 es para INICIAL, -1 para SEPARACION).
