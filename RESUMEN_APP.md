# Resumen actual de la app

## Stack y estructura general

- App construida con `Next.js 16`, `React 19`, `TypeScript` y `Tailwind CSS 4`.
- La ruta raíz `/` redirige a `/login-empresa`.
- El `layout` global monta `AuthProvider` y `AuthGuard`, por lo que casi toda la app queda protegida por sesión.
- Existen dos shells visuales principales:
  - `AdminLayout` para backoffice administrativo.
  - `EmployeeLayout` para portal de empleado.

## Autenticación y sesión

### Implementado de forma real

- Login por correo/contraseña usando Firebase Auth.
- Login con Google usando popup de Firebase.
- Obtención de perfil del usuario desde backend en `GET /api/auth/me`.
- Persistencia de token y perfil en `localStorage`.
- Restauración de sesión al recargar.
- Logout limpiando sesión local y cerrando sesión de Firebase.
- Protección de rutas no públicas con redirección a `/login-empresa`.

### Limitaciones actuales

- El guard solo exceptúa `/login` y `/login-empresa`.
- No hay recuperación real de contraseña; el link existe solo visualmente.
- La UI mezcla textos/etiquetas con problemas de encoding en varios archivos.

## Integraciones reales detectadas

- Firebase configurado vía `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` y `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
- Backend HTTP configurado vía `NEXT_PUBLIC_API_URL` con fallback a `http://localhost:8080`.
- API real de usuarios:
  - `GET /api/users`
  - `POST /api/users/register`
  - `DELETE /api/users/:id`
  - `DELETE /api/users/:id/hard`

## Módulos administrativos

### `/projects`

Estado actual: mock funcional local.

- Lista proyectos usando dataset local `MOCK_PROJECTS`.
- Muestra KPIs básicos: total de proyectos y aviso de que son datos mock.
- Skeleton de carga simulado.
- Estado vacío contemplado.
- Cada tarjeta permite navegar al detalle del proyecto.

### `/projects/[id]`

Estado actual: mock funcional local.

- Genera rutas estáticas con slugs de los proyectos mock.
- Muestra detalle del proyecto, distrito, torres y unidades.
- Permite editar nombre, distrito, dirección y fecha de inicio.
- El guardado solo actualiza estado local en pantalla.
- No persiste a backend.

### `/clientes`

Estado actual: híbrido entre API real y flujos mock.

#### Conectado de forma real

- Carga usuarios desde backend.
- Mapea usuarios a filas de tabla.
- Crear cliente desde modal usando `POST /api/users/register`.
- Eliminar usuario definitivamente usando `DELETE /api/users/:id/hard`.
- Control de permiso para eliminar:
  - Admin o usuario con `USER_GESTIONAR`.
  - No se puede autoeliminar.
  - No se puede eliminar otro `ADMIN`.

#### Simulado / no persistente

- Asistente de asignación de propiedad en 3 pasos.
- Inventario de unidades completamente mock.
- Búsqueda del cliente dentro de la lista ya cargada en frontend.
- Reserva de unidades cambiando estado local a `Reservado`.
- Simulación de conflicto de concurrencia.
- Flujo de resolución/desvinculación contractual.
- Supuesta revocación de acceso a S3 solo como mensaje/UI.
- Cambio de estados del cliente y de unidades solo en memoria.

### `/finanzas`

Estado actual: mock funcional local.

- Selección de cliente financiero mock.
- Edición de cronograma de cuotas.
- Validación de integridad:
  - La suma de cuotas debe coincidir con el valor total.
  - No permite guardar cuotas pendientes con fechas pasadas.
- Simulación de sincronización con Google Calendar al guardar cronograma.
- Conciliación de pagos:
  - pago completo
  - pago parcial con generación de saldo residual
  - validación de tipo y tamaño de voucher
- Simulación de subida de voucher a S3.
- Actualización de estados `Pendiente`, `Mora`, `Pago Parcial`, `Pagado` solo en estado local.
- Bloqueo de edición cuando el cliente mock tiene acta final firmada.

### `/agenda`

Estado actual: mock funcional local.

- Vista calendario mensual mock.
- Panel de próximos eventos.
- Modal para crear cita con:
  - cliente
  - tipo de evento
  - fecha
  - hora inicio/fin
  - ubicación
- Validación para no agendar en fecha/hora pasada.
- Inserción del evento en la grilla visible si coincide con un día representado.
- Toggle para simular fallo de Google Calendar.
- Mensajería de éxito o warning de reintento.
- No hay persistencia real ni integración real con Google Calendar.

### /clientes/[id]/expediente

Estado actual: mock funcional local integrado con store de backoffice.

- Ruta dinámica basada en el `id` del cliente.
- Carga el cliente desde el backend (`fetchUsuarios`) y busca sus unidades asignadas en el workspace local.
- Maneja la visualización administrativa de:
  - Resumen contractual editable (área techada, precio total, fechas de entrega/desembolso).
  - Pipeline de procesos (estado de venta a crédito, firmas, etc.).
  - Documentos heredados del proyecto.
  - Gestión de documentos agrupados por módulo/etapa (Separación, Contrato, Pagos y Financiamiento, etc.).
- Validación y carga simulada de archivos (PDF/Imágenes) con persistencia local en estado.
- No hay integración real con S3 o un backend de documentos.

### `/configuracion`

Estado actual: mock funcional local.

- Gestión de empleados internos desde dataset local.
- Crear usuario interno.
- Editar usuario interno.
- Desactivar usuario.
- Validación de correo corporativo `@llosaedificaciones.com`.
- Ajuste mock de permisos por módulo.
- Regla mock para impedir desactivar al único superadmin activo.
- No hay conexión real con backend, directorio de empleados ni sistema de permisos persistente.

## Portal empleado

Estado actual general: vistas mock/estáticas.

### `/employee/dashboard`

- Dashboard con KPIs mock.
- Lista de próximas acciones mock.
- Botón visual para nuevo seguimiento.

### `/employee/clients`

- Tabla de clientes asignados mock.
- Buscador visual sin lógica real aplicada.
- Botón visual para ver detalle.

### `/employee/contracts`

- Lista de contratos mock.
- Acciones visuales para ver, subir documento y marcar avance.
- Sin persistencia.

### `/employee/schedule`

- Mini calendario lateral mock.
- Lista de eventos/tareas del día.
- Permite marcar/desmarcar algunas tareas como completadas en estado local.
- Botón visual para agendar reunión.

### `/employee/progress`

- Formulario visual para registrar avances de obra.
- Área visual de subida de archivos.
- Historial mock de avances.
- Acciones visuales para editar, enviar a clientes o ver detalle.
- No hay subida real ni persistencia.

### `/employee/tracking`

- Centro de alertas mock.
- Alertas con prioridad y acción sugerida.
- Botones visuales para actuar o descartar.
- Sin lógica persistente.

## Navegación y UX común

- Sidebar admin con acceso a:
  - proyectos
  - clientes
  - finanzas
  - agenda
  - configuración
- Sidebar empleado con acceso a dashboard, clientes, contratos, cronograma, avances y seguimiento.
- Topbar compartida con breadcrumb, buscador visual, notificaciones y avatar.
- Footer común con links visuales de privacidad, términos y soporte.

## Estado real vs mock

### Hoy sí está conectado

- Autenticación Firebase.
- Carga de perfil autenticado desde backend.
- Listado real de usuarios.
- Registro real de cliente.
- Eliminación real de usuario.
- Validación de permisos frontend para ciertas acciones de usuarios.

### Hoy está implementado solo como mock/simulación

- Gestión de proyectos.
- Asignación de propiedades a clientes.
- Inventario de unidades.
- Resolución contractual.
- Finanzas y cronogramas.
- Conciliación y vouchers.
- Agenda/calendario.
- Expedientes de clientes y gestión documental.
- Gestión de empleados internos.
- Todo el portal de empleado.

## Observaciones técnicas

- Hay mezcla de naming en rutas:
  - `/projects` convive con `/proyectos` como redirección.
  - `/login` y `/login-empresa` muestran el mismo formulario.
- Parte importante de la lógica de negocio vive solo en estado React local.
- No encontré pruebas automatizadas ni validaciones de integración.
- Varias acciones muestran mensajes de integración con S3, Google Calendar o correo, pero hoy son simulaciones de UI.
