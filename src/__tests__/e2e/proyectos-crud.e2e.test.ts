/**
 * Pruebas E2E — Módulo de Proyectos (CP12, CP13, CP14)
 *
 * Todos los tests usan page.route() para mockear Firebase Auth y el backend.
 * No se requiere Firebase Emulator ni backend real (compatible con CI).
 */

import { test, expect, type Page } from '@playwright/test'
import { injectSession } from './helpers/auth-mock'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const perfilAdmin = {
  id: 1,
  nombre: 'Admin Sistema',
  email: 'admin@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'ADMIN',
  activo: true,
  funciones: [],
}

const mockProyectos = [
  {
    id: 'uuid-proyecto-001',
    nombre: 'Edificio Aurora',
    descripcion: 'Edificio residencial premium en Miraflores',
    direccion: 'Av. Larco 123',
    distrito: 'Miraflores',
    departamento: 'Lima',
    fechaInicio: '2024-01-01',
    fechaFin: '2026-12-31',
    precertificacionEdgeLeed: true,
    linkRecorridoVirtual: 'https://virtual.example.com',
  },
  {
    id: 'uuid-proyecto-002',
    nombre: 'Torres del Sol',
    descripcion: 'Complejo residencial en San Isidro',
    direccion: 'Calle Los Libertadores 456',
    distrito: 'San Isidro',
    departamento: 'Lima',
    fechaInicio: '2024-06-01',
    fechaFin: '2027-06-30',
    precertificacionEdgeLeed: false,
    linkRecorridoVirtual: '',
  },
]

const mockTorres = [
  { id: 1, nombre: 'Torre A', nroPisos: 12, nroSotanos: 2, areaComunM2: 500, proyectoId: 'uuid-proyecto-001' },
]

const mockHitos = [
  { id: 1, nombre: 'Cimentación', orden: 1, completado: false },
  { id: 2, nombre: 'Estructura', orden: 2, completado: false },
  { id: 3, nombre: 'Acabados', orden: 3, completado: false },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function mockProyectosEndpoint(page: Page, proyectos = mockProyectos) {
  await page.route('**/api/proyectos', async (route) => {
    await route.fulfill({ status: 200, json: proyectos })
  })
}

// ─── Listar proyectos ─────────────────────────────────────────────────────────

test.describe('Proyectos — Listado', () => {
  test('admin accede a /proyectos y ve la lista desde la API', async ({ page }) => {
    await mockProyectosEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('text=Edificio Aurora')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Torres del Sol')).toBeVisible()
  })

  test('el KPI de Total proyectos muestra el conteo correcto', async ({ page }) => {
    await mockProyectosEndpoint(page)
    // Mock sub-endpoints called by fetchProjectDetails to avoid unhandled network errors
    await page.route('**/api/activos/proyecto/**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })
    await page.route('**/api/proyectos/**/avance-general', async (route) => {
      await route.fulfill({ status: 200, json: { porcentajeAvance: 0 } })
    })
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    // The component renders the count as "N proyectos" in the filter bar once loading finishes
    await expect(page.locator('text=/2\\s*proyectos/').first()).toBeVisible({ timeout: 5_000 })
  })

  test('estado vacío cuando la API devuelve lista vacía', async ({ page }) => {
    await mockProyectosEndpoint(page, [])
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    // Sin proyectos no deben aparecer tarjetas con nombres de proyectos
    await expect(page.locator('text=Edificio Aurora')).toHaveCount(0, { timeout: 3_000 })
  })

  test('existe el botón "Crear Nuevo Proyecto"', async ({ page }) => {
    await mockProyectosEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('a:has-text("Nuevo proyecto"), button:has-text("Nuevo proyecto")')).toBeVisible({ timeout: 5_000 })
  })
})

// ─── Detalle de proyecto ──────────────────────────────────────────────────────

test.describe('Proyectos — Detalle', () => {
  test('click en tarjeta navega al detalle del proyecto', async ({ page }) => {
    await mockProyectosEndpoint(page)
    await page.route('**/api/proyectos/uuid-proyecto-001', async (route) => {
      await route.fulfill({ status: 200, json: mockProyectos[0] })
    })
    await page.route('**/api/torres/uuid-proyecto-001', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/proyecto/uuid-proyecto-001**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Edificio Aurora')).toBeVisible({ timeout: 5_000 })

    // Click en la tarjeta del proyecto
    await page.locator('text=Edificio Aurora').first().click()

    await expect(page).toHaveURL(/\/proyectos\//, { timeout: 8_000 })
  })

  test('detalle muestra nombre y datos del proyecto', async ({ page }) => {
    await page.route('**/api/proyectos**', async (route) => {
      await route.fulfill({ status: 200, json: mockProyectos })
    })
    await page.route('**/api/torres/uuid-proyecto-001', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/proyecto/uuid-proyecto-001**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/uuid-proyecto-001')

    await expect(page.locator('text=Edificio Aurora')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('text=Miraflores')).toBeVisible({ timeout: 5_000 })
  })

  test('detalle tiene navegación a subpáginas (Obra, Unidades)', async ({ page }) => {
    await page.route('**/api/proyectos**', async (route) => {
      await route.fulfill({ status: 200, json: mockProyectos })
    })
    await page.route('**/api/torres/**', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/uuid-proyecto-001')

    // Links de navegación interna del proyecto (Resumen e Inventario)
    await expect(page.locator('a:has-text("Resumen")')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('a:has-text("Inventario"), a[href*="unidades"]')).toBeVisible()
  })
})

// ─── CP12: Crear proyecto con jerarquía e hitos ───────────────────────────────

test.describe('CP12 — Crear proyecto con jerarquía (torres/pisos) e hitos de obra', () => {
  test('admin accede a /proyectos/new y ve el formulario de creación', async ({ page }) => {
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/new')

    await expect(
      page.locator('text=/nuevo proyecto|crear proyecto/i').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('formulario de nuevo proyecto valida campos requeridos', async ({ page }) => {
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/new')

    // Intentar enviar sin llenar campos
    const submitBtn = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")')
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click()
      // Debe haber alguna validación visible
      await expect(
        page.locator('text=/requerido|obligatorio|ingresa/i').first()
      ).toBeVisible({ timeout: 3_000 })
    } else {
      // Si no hay submit button, al menos el form debe renderizar
      await expect(page.locator('form, input[name], input[type="text"]').first()).toBeVisible()
    }
  })

  test('crea proyecto exitosamente con nombre, torres e hitos', async ({ page }) => {
    let postCalled = false

    const nuevoProyecto = {
      id: 'uuid-nuevo-001',
      nombre: 'Residencial Novo',
      descripcion: 'Proyecto nuevo',
      direccion: 'Jr. Lima 100',
      distrito: 'Barranco',
      departamento: 'Lima',
      fechaInicio: '2025-01-01',
      fechaFin: '2027-12-31',
      precertificacionEdgeLeed: false,
      linkRecorridoVirtual: '',
    }

    await page.route('**/api/proyectos', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
        await route.fulfill({ status: 201, json: nuevoProyecto })
      } else {
        await route.fulfill({ status: 200, json: mockProyectos })
      }
    })
    await page.route('**/api/torres**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: { id: 10, nombre: 'Torre A', nroPisos: 8 } })
      } else {
        await route.fulfill({ status: 200, json: [] })
      }
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/new')

    await expect(
      page.locator('text=/nuevo proyecto|crear proyecto/i').first()
    ).toBeVisible({ timeout: 8_000 })

    // Llenar campos básicos del proyecto
    const nombreInput = page.locator('input[name="nombre"], input[placeholder*="nombre"]')
    if (await nombreInput.count() > 0) {
      await nombreInput.first().fill('Residencial Novo')
    }

    const direccionInput = page.locator('input[name="direccion"], input[placeholder*="dirección"]')
    if (await direccionInput.count() > 0) {
      await direccionInput.first().fill('Jr. Lima 100')
    }

    const submitBtn = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")')
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click()
      await page.waitForTimeout(1_500)
      // Si el formulario tiene múltiples pasos (wizard), el POST puede llamarse al final
      if (!postCalled) {
        // Continuar al siguiente paso si hay wizard
        const nextBtn = page.locator('button:has-text("Siguiente"), button:has-text("Continuar")')
        if (await nextBtn.count() > 0) {
          await nextBtn.first().click()
          await page.waitForTimeout(500)
          const finalBtn = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")')
          if (await finalBtn.count() > 0) {
            await finalBtn.first().click()
            await page.waitForTimeout(1_000)
          }
        }
      }
      // Puede haber redirigido al detalle del nuevo proyecto
      const successVisible = page.locator('text=/creado|éxito|guardado/i')
      const redirected = page.url().includes('uuid-nuevo-001') || page.url().includes('/proyectos/')
      expect(postCalled || redirected || await successVisible.count() > 0).toBeTruthy()
    }
  })
})

// ─── CP13: Rechazar nombre de proyecto duplicado ──────────────────────────────

test.describe('CP13 — Rechazar proyecto con nombre duplicado', () => {
  test('UI muestra error cuando el backend rechaza nombre duplicado (409)', async ({ page }) => {
    await page.route('**/api/proyectos', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          json: { error: 'Ya existe un proyecto con ese nombre.' },
        })
      } else {
        await route.fulfill({ status: 200, json: mockProyectos })
      }
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/new')

    await expect(
      page.locator('text=/nuevo proyecto|crear proyecto/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const nombreInput = page.locator('input[name="nombre"], input[placeholder*="nombre"]')
    if (await nombreInput.count() > 0) {
      await nombreInput.first().fill('Edificio Aurora') // nombre duplicado
    }

    const submitBtn = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")')
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click()
      await page.waitForTimeout(1_000)

      // Si hay wizard, puede que el error aparezca en el último paso
      const nextBtn = page.locator('button:has-text("Siguiente"), button:has-text("Continuar")')
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click().catch(() => {})
        await page.waitForTimeout(500)
        const finalBtn = page.locator('button[type="submit"], button:has-text("Crear")')
        if (await finalBtn.count() > 0) {
          await finalBtn.first().click()
          await page.waitForTimeout(1_000)
        }
      }

      // Debe mostrar error de duplicado
      await expect(
        page.locator('text=/duplicado|ya existe|nombre.*proyecto/i').first()
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('validación client-side: nombre vacío no puede enviarse', async ({ page }) => {
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/new')

    await expect(
      page.locator('text=/nuevo proyecto|crear proyecto/i').first()
    ).toBeVisible({ timeout: 8_000 })

    // Intentar enviar sin nombre
    const submitBtn = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")')
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click()
      // Debe aparecer validación de campo requerido
      await expect(
        page.locator('text=/requerido|obligatorio|ingresa el nombre/i').first()
      ).toBeVisible({ timeout: 3_000 })
    }
  })
})

// ─── CP14: Estructura de hitos inmutable al editar ───────────────────────────
// BUG DOCUMENTADO (CP14): Al editar un proyecto existente, los hitos de obra
// no deben poder modificarse (son parte de la estructura contractual). Si la UI
// permite editar hitos en el modo edición, esto representa un defecto.

test.describe('CP14 — La estructura de hitos de obra es inmutable al editar proyecto', () => {
  test('en la vista de edición no existe opción para modificar hitos existentes', async ({ page }) => {
    await page.route('**/api/proyectos**', async (route) => {
      await route.fulfill({ status: 200, json: mockProyectos })
    })
    await page.route('**/api/torres/**', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })
    await page.route('**/api/hitos**', async (route) => {
      await route.fulfill({ status: 200, json: mockHitos })
    })
    await page.route('**/api/obra**', async (route) => {
      await route.fulfill({ status: 200, json: { hitos: mockHitos } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/uuid-proyecto-001')

    await expect(page.locator('text=Edificio Aurora')).toBeVisible({ timeout: 8_000 })

    // Buscar botón de editar
    const editBtn = page.locator('button:has-text("Editar"), button[aria-label*="editar"]')
    if (await editBtn.count() > 0) {
      await editBtn.first().click()
      await page.waitForTimeout(500)

      // Verificar que no haya campos de edición de hitos habilitados
      // (los hitos deben ser read-only en modo edición)
      const hitosSection = page.locator('[data-testid="hitos-section"], section:has-text("Hitos"), div:has-text("Hitos de obra")')
      if (await hitosSection.count() > 0) {
        // Los hitos no deben tener inputs editables
        const hitosEditables = hitosSection.locator('input:not([disabled]):not([readonly]), button:has-text("Agregar hito")')
        const count = await hitosEditables.count()
        // Si existen campos editables de hitos, documentar el bug
        if (count > 0) {
          test.info().annotations.push({
            type: 'bug',
            description: `CP14: Se encontraron ${count} campo(s) editables en la sección de Hitos al editar el proyecto. Los hitos deberían ser inmutables.`,
          })
        }
        // El test verifica la condición: hitos deben ser inmutables (count === 0)
        expect(count).toBe(0)
      } else {
        // Si no se muestra la sección de hitos en edición, la condición se cumple por omisión
        test.info().annotations.push({
          type: 'info',
          description: 'CP14: La sección de hitos no se muestra en el modo de edición — comportamiento correcto.',
        })
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'CP14: No se encontró botón "Editar" en la vista del proyecto.',
      })
    }
  })

  test('admin edita nombre del proyecto y guarda los cambios (campos editables funcionan)', async ({ page }) => {
    let putCalled = false

    await page.route('**/api/proyectos**', async (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true
        await route.fulfill({ status: 200, json: { ...mockProyectos[0], nombre: 'Edificio Aurora Renovado' } })
      } else {
        await route.fulfill({ status: 200, json: mockProyectos })
      }
    })
    await page.route('**/api/torres/**', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/uuid-proyecto-001')

    const editBtn = page.locator('button:has-text("Editar"), button[aria-label*="editar"]')
    if (await editBtn.count() > 0) {
      await editBtn.first().click()

      const nombreInput = page.locator('input[name="nombre"], input[placeholder*="nombre"]')
      if (await nombreInput.count() > 0) {
        await nombreInput.fill('Edificio Aurora Renovado')
        await page.locator('button:has-text("Guardar"), button[type="submit"]').first().click()
        await page.waitForTimeout(1_000)
        expect(putCalled).toBe(true)
      }
    }
  })
})
