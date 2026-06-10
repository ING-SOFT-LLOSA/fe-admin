# Llosa Edificaciones — Backoffice Admin

Frontend administrativo para la gestión de proyectos, clientes, finanzas, obra y expedientes de Llosa Edificaciones.

**Rama:** `test` — entorno de pruebas y QA

---

## Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS 4
- **Auth:** Firebase Auth (email/password + Google OAuth)
- **Backend:** REST API en `NEXT_PUBLIC_API_URL_LLOSA`
- **Testing:** Vitest (unit) + Playwright (E2E)

---

## Requisitos previos

- Node.js via NVM
- Variables de entorno en `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA=
NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA=
NEXT_PUBLIC_API_URL_LLOSA=
```

---

## Comandos

```bash
# Desarrollo
npm run dev       # Servidor 
npm run build     # Build de producción
npm run lint      # ESLint

# Tests unitarios (Vitest)
npm run test      # Modo watch
npm run test:run  # Ejecución única (CI)
npm run test:ui   # UI interactiva en el browser

# Tests E2E (Playwright) — requiere `npm run dev` corriendo
npx playwright test                        # Todos los tests E2E
npx playwright test src/__tests__/e2e/auth.e2e.test.ts     # Un archivo
npx playwright test --headed               # Con browser visible
npx playwright show-report                 # Ver reporte HTML
```

---

## Estructura de tests

```
src/__tests__/
├── auth/                          # Tests unitarios (Vitest + jsdom)
│   ├── login.unit.test.ts
│   ├── permissions.unit.test.ts
│   └── session.unit.test.ts
└── e2e/                           # Tests E2E (Playwright)
    ├── auth.e2e.test.ts           # CP01–CP05, CP09–CP11 — autenticación
    ├── rbac.e2e.test.ts           # CP06–CP08 — permisos y roles
    ├── clientes-crud.e2e.test.ts  # CRUD del módulo de clientes
    ├── proyectos-crud.e2e.test.ts # Listado y detalle de proyectos
    ├── portal-auth.e2e.test.ts    # Portal del cliente (CP09–CP11)
    ├── security.e2e.test.ts       # Vulnerabilidades de seguridad documentadas
    └── integration/
        └── api-http.e2e.test.ts   # Comportamiento del cliente HTTP (apiFetch)
```
---

## Módulos y estado de integración

| Módulo | Ruta | Backend conectado |
|---|---|---|
| Autenticación | `/login`, `/login-empresa` | Sí (Firebase + `/api/auth/me`) |
| Clientes | `/clientes` | Sí (`/api/users`) |
| Proyectos | `/proyectos` | Sí (`/api/proyectos`) |
| Obra | `/obra`, `/proyectos/[id]/obra` | Sí (`/api/activos`, `/api/torres`) |
| Finanzas | `/finanzas` | Mock |
| Agenda | `/agenda` | Mock |
| Expedientes | `/clientes/[id]/expediente` | Parcial (mock de documentos) |
| Configuración | `/configuracion` | Parcial (roles via `/api/roles`) |
| Portal cliente | `/portal/mis-activos` | Parcial (`/api/expedientes/mis-activos`) |
| Portal empleado | `/employee/*` | Mock |
