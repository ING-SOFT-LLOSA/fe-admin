/**
 * Pruebas E2E — Seguridad Frontend
 * 
 * Metodología:
 *   - Los tests que PASAN confirman que la vulnerabilidad EXISTE (sistema no la detecta)
 *   - Los tests que FALLAN significan que el sistema sí protege contra esa vulnerabilidad
 *   - Los tests marcados [VULN] documentan el riesgo; no implican que el bug esté corregido
 */

import { test, expect, type Page } from '@playwright/test'
import { loginViaEmulator } from './helpers/emulator'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function injectSession(page: Page, perfil: Record<string, unknown>) {
  // El perfil (rol/funciones) llega del backend mockeado; la identidad, del
  // emulador de Firebase Auth mediante un login real.
  await mockAuthMe(page, perfil)
  await loginViaEmulator(page)
}

async function mockAuthMe(page: Page, perfil: Record<string, unknown> | null) {
  await page.route('**/api/auth/me', async (route) => {
    if (!perfil) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    } else {
      await route.fulfill({ status: 200, json: perfil })
    }
  })
}

async function mockUsersApi(page: Page) {
  await page.route('**/api/users**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 10, nombre: 'Carlos', apellidos: 'Pérez', email: 'cperez@llosaedificaciones.com', rol: 'AREA_TECNICA', activo: true, funciones: [], tipoUsuario: 'EMPLEADO', createdAt: '2024-01-01' }],
    })
  })
  await page.route('**/api/roles**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        { idRol: 1, nombre: 'AREA_TECNICA', descripcion: 'Área Técnica', funciones: ['OBRA_VER'] },
      ],
    })
  })
}


test.describe('Escalación de privilegios via manipulación de localStorage', () => {
  test('Empleado puede modificar localStorage para obtener acceso de ADMIN', async ({ page }) => {
   
    const perfilRealTecnico = {
      id: 50,
      email: 'basico@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: [],
    }

    // Backend devuelve el perfil real (técnico sin permisos)
    await mockAuthMe(page, perfilRealTecnico)
    await mockUsersApi(page)
    await injectSession(page, perfilRealTecnico)

    // Simula la manipulación de localStorage via DevTools
    await page.evaluate(() => {
      const perfilFalso = {
        id: 50,
        email: 'basico@llosaedificaciones.com',
        tipoUsuario: 'EMPLEADO',
        rol: 'ADMIN',
        activo: true,
        funciones: ['USER_GESTIONAR', 'ROL_GESTIONAR'],
      }
      localStorage.setItem('llosa_perfil', JSON.stringify(perfilFalso))
    })

    await page.goto('/configuracion')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })

  test('Modificar funciones en localStorage da acceso a módulos protegidos', async ({ page }) => {

    const perfilSinFinanzas = {
      id: 51,
      email: 'sinfinanzas@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: [], // Sin FINANZAS_VER
    }

    await mockAuthMe(page, perfilSinFinanzas)
    await injectSession(page, perfilSinFinanzas)

    // Agregar permiso falso
    await page.evaluate(() => {
      const perfilConFinanzas = {
        id: 51,
        email: 'sinfinanzas@llosaedificaciones.com',
        tipoUsuario: 'EMPLEADO',
        rol: 'AREA_TECNICA',
        activo: true,
        funciones: ['FINANZAS_VER'], // Permiso agregado fraudulentamente
      }
      localStorage.setItem('llosa_perfil', JSON.stringify(perfilConFinanzas))
    })

    await page.goto('/finanzas')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})


test.describe('Token JWT accesible en localStorage', () => {
  test('El token JWT puede ser leído por cualquier script de la página', async ({ page }) => {
  
    await mockAuthMe(page, {
      id: 1,
      email: 'admin@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ADMIN',
      activo: true,
      funciones: [],
    })

    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.setItem('llosa_id_token', 'jwt-sensible-a-xss')
      localStorage.setItem('llosa_perfil', JSON.stringify({ id: 1, rol: 'ADMIN' }))
    })
    await page.goto('/clientes')

    // Un script puede leer el token
    const tokenLeido = await page.evaluate(() => localStorage.getItem('llosa_id_token'))
    // El token es accesible — esto confirma la vulnerabilidad XSS
    expect(tokenLeido).toBe('jwt-sensible-a-xss')
  })

  test('El perfil completo con rol y funciones es modificable desde JavaScript', async ({ page }) => {
   
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.setItem('llosa_id_token', 'token-de-empleado')
      localStorage.setItem('llosa_perfil', JSON.stringify({
        id: 99,
        rol: 'AREA_TECNICA',
        funciones: ['OBRA_VER'],
      }))
    })

    // Un script malicioso puede cambiar el rol
    const perfilOriginal = await page.evaluate(() => {
      const raw = localStorage.getItem('llosa_perfil')
      return raw ? JSON.parse(raw) : null
    })
    expect(perfilOriginal?.rol).toBe('AREA_TECNICA')

    await page.evaluate(() => {
      const manipulado = { id: 99, rol: 'ADMIN', funciones: ['USER_GESTIONAR'] }
      localStorage.setItem('llosa_perfil', JSON.stringify(manipulado))
    })

    const perfilManipulado = await page.evaluate(() => {
      const raw = localStorage.getItem('llosa_perfil')
      return raw ? JSON.parse(raw) : null
    })
    // Confirma que la manipulación fue exitosa
    expect(perfilManipulado?.rol).toBe('ADMIN')
  })
})

// ─── Autenticación: comportamiento ante tokens inválidos ─────────────────────

test.describe('Seguridad — Validación de tokens', () => {
  test('token expirado detectado por backend (401) limpia sesión correctamente', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { error: 'Token expired' } })
    })

    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.setItem('llosa_id_token', 'token-expirado-o-robado')
      localStorage.setItem('llosa_perfil', JSON.stringify({
        id: 1, rol: 'ADMIN', funciones: [], tipoUsuario: 'EMPLEADO', activo: true,
      }))
    })

    await page.goto('/clientes')

    // Debe redirigir al login
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })

    // El token debe haber sido eliminado de localStorage
    const tokenDespues = await page.evaluate(() => localStorage.getItem('llosa_id_token'))
    expect(tokenDespues).toBeNull()
  })

  test('token faltante (sin sesión) redirige al login sin error', async ({ page }) => {
    // Sin inyectar sesión, navegar directo a ruta protegida
    await page.goto('/clientes')

    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test('acceso directo a ruta protegida por URL sin sesión redirige al login', async ({ page }) => {
    await page.goto('/configuracion')
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test('acceso directo al portal de cliente sin sesión redirige al login', async ({ page }) => {
    await page.goto('/portal/mis-activos')
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })
})

// ─── RBAC: límites de acceso por rol ─────────────────────────────────────────

test.describe('Seguridad — Límites de acceso por rol', () => {
  test('empleado sin permisos no puede acceder a /configuracion', async ({ page }) => {
    const perfilSinPermisos = {
      id: 60,
      email: 'sinpermisos@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: ['OBRA_VER'],
    }

    await mockAuthMe(page, perfilSinPermisos)
    await injectSession(page, perfilSinPermisos)
    await page.goto('/configuracion')

    // Debe ser bloqueado
    try {
      await page.waitForURL(/login/, { timeout: 5_000 })
    } catch {
      await expect(
        page.locator('text=/sin permiso|acceso denegado|no autorizado/i').first()
      ).toBeVisible({ timeout: 5_000 })
    }
  })
})
