# Llosa Edificaciones – Portal Administrativo (Backoffice)

Este repositorio contiene el código frontend de la plataforma administrativa (Backoffice) de **Llosa Edificaciones**, diseñada para la gestión de proyectos inmobiliarios, control de inventario de unidades, asignaciones de propiedades, seguimiento de avances de obra, finanzas y control de expedientes legales de clientes.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está construido bajo estándares modernos de desarrollo web móvil y de escritorio:

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) — Renderizado en servidor (SSR), componentes de servidor (RSC) y optimización de rutas.
- **Librería UI:** [React 19](https://react.dev/) — Gestión reactiva de estado y componentes modulares.
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/) — Utilidades y diseño responsivo premium, optimizado para temas claros y oscuros.
- **Autenticación:** [Firebase Authentication SDK](https://firebase.google.com/docs/auth) — Flujo seguro con inicio por correo/contraseña y Google OAuth.
- **API Fetching:** Cliente HTTP personalizado con soporte de refrescado automático de sesión y manejo centralizado de expiración.
- **Testing:** 
  * **Unitario & Integración:** [Vitest](https://vitest.dev/) + React Testing Library (ejecución ultrarrápida de +1300 pruebas).
  * **E2E (End-to-End):** [Playwright](https://playwright.dev/) para flujos críticos de usuario (autenticación, asignaciones, obra y seguridad).

---

## 📘 Resumen Técnico del Repositorio

### 1. Control de Acceso y Sesión (Middleware & Guards)
El portal implementa una seguridad híbrida de tres capas (Servidor, Cliente, Petición HTTP):

- **Capa Servidor (`middleware.ts` / `proxy.ts`):** 
  Intercepta todas las solicitudes del servidor Next.js. Si no encuentra la cookie `llosa_id_token`, redirige inmediatamente al usuario a `/login` antes de renderizar cualquier página. También inyecta las cabeceras de **Content Security Policy (CSP)** con *nonces* criptográficos únicos generados por petición para mitigar ataques XSS.
- **Capa Cliente (`AuthGuard.tsx` & `RoleGuard.tsx`):**
  - `AuthGuard` envuelve a toda la aplicación para manejar el estado de autenticación reactivo usando el estado global de Firebase Auth.
  - `RoleGuard` restringe accesos específicos según el tipo de usuario (`EMPLEADO`, `GERENTE`, `ADMIN`) redirigiendo a los accesos no permitidos.
- **Capa Cliente HTTP (`http.ts`):**
  Toda petición enviada a la API REST del backend mediante `apiFetch` solicita automáticamente un token fresco de Firebase en segundo plano (`getFreshToken`). Si el backend responde con un error de autorización (`401`), el cliente HTTP dispara un evento global `llosa:unauthorized`, lo cual purga la sesión activa y redirige al usuario a `/login` al instante.

### 2. Estructura de Directorios del Código
El código fuente dentro de `src/` se organiza de forma modular y limpia:

```
src/
├── app/                  # Enrutamiento de Next.js (App Router) y layouts de páginas
│   ├── (admin)/          # Rutas protegidas para personal administrativo y de obra
│   ├── login/            # Flujo de login
│   ├── globals.css       # Estilos globales y variables de Tailwind
│   └── layout.tsx        # Layout raíz (proveedores de temas y contexto de auth)
├── components/           # Componentes comunes (Navegadores, Footers, Modales de UI)
│   └── auth/             # Componentes y lógica de control de acceso (Guards, LoginForm)
├── contexts/             # Contexto global de React (AuthContext para persistencia)
├── lib/                  # Librerías auxiliares y clientes externos
│   ├── api/              # Llamadas a endpoints de la API (Http, Users, Obras, Pagos, etc.)
│   ├── auth/             # Manejo auxiliar de tokens, cookies y guardado de sesión
│   └── firebase.ts       # Inicialización del SDK de Firebase Client
├── modules/              # Lógica y componentes especializados agrupados por módulo
│   ├── agenda/           # Reuniones, citas y sincronización con Google Calendar
│   ├── asignaciones/     # Flujo (wizard) de asignación de activos a clientes
│   ├── clientes/         # Listado, creación, KPIs y edición de clientes
│   ├── finanzas/         # Estado de saldos, cuotas e historiales de comprobantes
│   ├── legal/            # Carpetas de clientes y aprobación de requisitos documentales
│   ├── obra/             # Reportes diarios (PDF/img/video hasta 10MB) y avances de etapas
│   └── proyectos/        # Fichas de proyectos, torres y configuradores de inventario
├── types/                # Definiciones globales de tipos e interfaces de TypeScript
└── middleware.ts         # Archivo de Middleware de servidor Next.js
```

---

## 🚀 Cómo Levantar el Frontend Admin (Local)

Sigue estos pasos para instalar dependencias y levantar el servidor en tu máquina local:

### 1. Requisitos Previos
Asegúrate de tener instalado:
- **Node.js** (versión 20 o superior recomendada).
- **npm** (incluido por defecto con Node.js).

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (puedes usar como base el archivo `.env` existente) y define las credenciales de Firebase y la URL del Backend:

```env
NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA=tu_api_key_aquí
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA=tu_auth_domain_aquí
NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA=tu_project_id_aquí
NEXT_PUBLIC_API_URL_LLOSA=http://localhost:8080
```
> [!IMPORTANT]
> Reemplaza los valores con las credenciales correspondientes de Firebase de tu entorno (desarrollo o testing).

### 3. Instalar Dependencias
Instala los paquetes necesarios definidos en `package.json`:

```bash
npm install
```

### 4. Iniciar el Servidor de Desarrollo
Corre el frontend en modo de desarrollo local:

```bash
npm run dev
```
El servidor se levantará por defecto en: **[http://localhost:3000](http://localhost:3000)**. Cualquier cambio en el código se reflejará automáticamente en el navegador gracias al Hot Module Replacement (HMR).

### 5. Compilar para Producción
Para verificar la compilación y generar el bundle optimizado para despliegues:

```bash
# Genera el build estático y standalone bajo .next/
npm run build

# Levanta el servidor simulando el entorno de producción localmente
npm run start
```

---

## 🧪 Pruebas y Aseguramiento de Calidad

El proyecto posee una cobertura de pruebas muy robusta para asegurar la estabilidad:

### Pruebas Unitarias e Integración (Vitest)
Estas pruebas comprueban la lógica interna de helpers, controladores de API y renderizado básico de componentes React sin necesidad de levantar el navegador.

```bash
# Ejecutar todas las pruebas unitarias una sola vez
npm run test:run

# Levantar las pruebas en modo de observación reactiva (watch)
npm run test

# Abrir el panel gráfico interactivo en tu navegador para ver la cobertura
npm run test:ui
```

### Pruebas de Flujo Completo (Playwright E2E)
Verifican el funcionamiento integral simulando interacciones reales del usuario en el navegador contra un entorno local o de pruebas.

Para correr los tests E2E localmente simulando Firebase de forma aislada, puedes usar el emulador de Firebase integrado:

```bash
# Levantar el emulador local de Firebase Auth y levantar el front en modo E2E
# Terminal 1:
npm run emulator

# Terminal 2:
npm run dev:e2e

# Terminal 3 (Ejecutar las pruebas E2E):
npx playwright test
```
