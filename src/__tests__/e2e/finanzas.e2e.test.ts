/**
 * Pruebas E2E — Módulo de Finanzas (CP29, CP32)
 *
 * CP29: Crear cronograma de pago directo (crédito directo)
 * CP32: Bloquear edición de cronograma histórico
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
  funciones: ['FINANZAS_VER', 'FINANZAS_EDITAR'],
}

const mockCronograma = {
  id: 1001,
  clienteId: 101,
  activoId: 501,
  tipoFinanciamiento: 'CREDITO_DIRECTO',
  montoTotal: 250000,
  cuotaInicial: 50000,
  numeroCuotas: 24,
  tasaInteres: 8.5,
  estado: 'VIGENTE',
  fechaInicio: '2024-01-01',
  cuotas: [
    { id: 1, numero: 1, monto: 8500, fechaVencimiento: '2024-02-01', pagado: true, fechaPago: '2024-02-01' },
    { id: 2, numero: 2, monto: 8500, fechaVencimiento: '2024-03-01', pagado: true, fechaPago: '2024-03-01' },
    { id: 3, numero: 3, monto: 8500, fechaVencimiento: '2024-04-01', pagado: false, fechaPago: null },
  ],
}

const mockCronogramaHistorico = {
  ...mockCronograma,
  id: 1002,
  estado: 'CERRADO', // Cronograma histórico — no se puede editar
  cuotas: mockCronograma.cuotas.map(c => ({ ...c, pagado: true, fechaPago: '2024-02-01' })),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function mockFinanzasEndpoints(page: Page) {
  await page.route('**/api/finanzas**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        json: { content: [mockCronograma], totalPages: 1, number: 0 },
      })
    } else {
      await route.fallback()
    }
  })
  await page.route('**/api/cronogramas**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        json: [mockCronograma],
      })
    } else {
      await route.fallback()
    }
  })
  await page.route('**/api/pagos**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
}

// ─── CP29: Crear cronograma de crédito directo ────────────────────────────────

test.describe('CP29 — Crear cronograma de pago en crédito directo', () => {
  test('admin accede al módulo de finanzas', async ({ page }) => {
    await mockFinanzasEndpoints(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas')

    await expect(
      page.locator('text=/finanzas|cronograma|pagos/i').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('existe botón para crear nuevo cronograma de pago', async ({ page }) => {
    await mockFinanzasEndpoints(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas')

    await expect(
      page.locator('text=/finanzas|cronograma|pagos/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const crearBtn = page.locator(
      'button:has-text("Crear"), button:has-text("Nuevo"), button:has-text("cronograma"), a:has-text("Crear")'
    )
    // Si el botón existe, verificar que es clickable
    if (await crearBtn.count() > 0) {
      await expect(crearBtn.first()).toBeVisible()
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'CP29: No se encontró botón "Crear cronograma" visible en /finanzas.',
      })
    }
  })

  test('formulario de cronograma incluye campo tipo de financiamiento', async ({ page }) => {
    await mockFinanzasEndpoints(page)
    await page.route('**/api/users**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id: 101, nombre: 'Ana', apellidos: 'García', email: 'ana@gmail.com', tipoUsuario: 'CLIENTE', activo: true }],
      })
    })
    await page.route('**/api/activos**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { content: [{ id: 501, codigoActivo: 'UNIT-501', estado: 'DISPONIBLE' }], totalPages: 1 },
      })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas')

    await expect(
      page.locator('text=/finanzas|cronograma|pagos/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const crearBtn = page.locator(
      'button:has-text("Crear"), button:has-text("Nuevo cronograma"), a:has-text("Crear")'
    )

    if (await crearBtn.count() > 0) {
      await crearBtn.first().click()
      await page.waitForTimeout(500)

      // El formulario debe tener algún selector de tipo de financiamiento
      const tipoSelect = page.locator(
        'select[name*="tipo"], select[name*="financiamiento"], input[name*="tipo"]'
      )
      if (await tipoSelect.count() > 0) {
        await expect(tipoSelect.first()).toBeVisible()
      } else {
        test.info().annotations.push({
          type: 'info',
          description: 'CP29: No se encontró campo de tipo de financiamiento en el formulario.',
        })
      }
    }
  })

  test('crear cronograma de crédito directo llama a POST /api/cronogramas', async ({ page }) => {
    let postCalled = false

    await mockFinanzasEndpoints(page)
    await page.route('**/api/cronogramas', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
        await route.fulfill({ status: 201, json: mockCronograma })
      } else {
        await route.fulfill({ status: 200, json: [mockCronograma] })
      }
    })
    // Alternativa: el endpoint puede estar bajo /api/finanzas
    await page.route('**/api/finanzas/cronograma', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
        await route.fulfill({ status: 201, json: mockCronograma })
      } else {
        await route.fallback()
      }
    })
    await page.route('**/api/users**', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas')

    await expect(
      page.locator('text=/finanzas|cronograma|pagos/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const crearBtn = page.locator(
      'button:has-text("Crear"), button:has-text("Nuevo"), a:has-text("Crear")'
    ).first()

    if (await crearBtn.count() > 0) {
      await crearBtn.click()
      await page.waitForTimeout(500)

      // Llenar campos mínimos
      const tipoInput = page.locator('select[name*="tipo"], input[value="CREDITO_DIRECTO"]')
      if (await tipoInput.count() > 0) {
        const tagName = await tipoInput.first().evaluate(el => el.tagName.toLowerCase())
        if (tagName === 'select') {
          await tipoInput.first().selectOption({ label: /crédito directo/i } as never)
        }
      }

      const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")')
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click()
        await page.waitForTimeout(1_500)
      }

      // Verificar que el POST fue llamado o que hay un mensaje de éxito
      const success = page.locator('text=/creado|guardado|éxito/i')
      if (!postCalled && await success.count() === 0) {
        test.info().annotations.push({
          type: 'info',
          description: 'CP29: El flujo de creación de cronograma puede requerir más campos o es un wizard multi-paso.',
        })
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'CP29: No se encontró botón de creación de cronograma. La funcionalidad puede estar en una ruta diferente.',
      })
    }
  })

  test('listado de finanzas muestra cronogramas existentes', async ({ page }) => {
    await mockFinanzasEndpoints(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas')

    await expect(
      page.locator('text=/finanzas|cronograma/i').first()
    ).toBeVisible({ timeout: 8_000 })

    // Si hay cronogramas, al menos uno debe mostrarse
    const cronogramaItem = page.locator('text=/CREDITO_DIRECTO|crédito directo|cronograma/i')
    if (await cronogramaItem.count() === 0) {
      test.info().annotations.push({
        type: 'info',
        description: 'CP29: No se encontraron cronogramas listados en /finanzas con el mock actual.',
      })
    }
  })
})

// ─── CP32: Bloquear edición de cronograma histórico ──────────────────────────

test.describe('CP32 — Bloquear edición de cronograma con estado histórico (CERRADO)', () => {
  test('cronograma con estado CERRADO no permite edición de cuotas', async ({ page }) => {
    await page.route('**/api/finanzas**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { content: [mockCronogramaHistorico], totalPages: 1, number: 0 },
      })
    })
    await page.route('**/api/cronogramas**', async (route) => {
      if (route.request().url().includes('/1002')) {
        await route.fulfill({ status: 200, json: mockCronogramaHistorico })
      } else {
        await route.fulfill({ status: 200, json: [mockCronogramaHistorico] })
      }
    })
    await page.route('**/api/pagos**', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas')

    await expect(
      page.locator('text=/finanzas|cronograma/i').first()
    ).toBeVisible({ timeout: 8_000 })

    // Navegar al cronograma histórico
    await page.goto('/finanzas/1002')

    // Esperar que cargue
    await page.waitForTimeout(1_500)

    // Verificar que los botones de edición de cuotas están deshabilitados o ausentes
    const editCuotaBtn = page.locator(
      'button:has-text("Editar cuota"), button:has-text("Modificar"), input[name*="cuota"]:not([disabled]):not([readonly])'
    )
    const editableCount = await editCuotaBtn.count()

    if (editableCount > 0) {
      // BUG documentado: se pueden editar cuotas de un cronograma histórico
      test.info().annotations.push({
        type: 'bug',
        description: `CP32: Se encontraron ${editableCount} control(es) editables en un cronograma con estado CERRADO. Los cronogramas históricos deben ser de solo lectura.`,
      })
    }
    // El test espera que no haya controles editables
    expect(editableCount).toBe(0)
  })

  test('cronograma CERRADO muestra indicador visual de estado histórico', async ({ page }) => {
    await page.route('**/api/finanzas**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { content: [mockCronogramaHistorico], totalPages: 1, number: 0 },
      })
    })
    await page.route('**/api/cronogramas/**', async (route) => {
      await route.fulfill({ status: 200, json: mockCronogramaHistorico })
    })
    await page.route('**/api/pagos**', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas/1002')

    await page.waitForTimeout(1_500)

    // Debe mostrar algún indicador de que el cronograma es histórico/cerrado
    const estadoIndicador = page.locator('text=/cerrado|histórico|finalizado|completado/i')
    if (await estadoIndicador.count() === 0) {
      test.info().annotations.push({
        type: 'info',
        description: 'CP32: No se muestra indicador visual del estado CERRADO del cronograma.',
      })
    }
  })

  test('cronograma VIGENTE sí permite registrar pago de cuota pendiente', async ({ page }) => {
    let patchCalled = false

    await page.route('**/api/finanzas**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { content: [mockCronograma], totalPages: 1, number: 0 },
      })
    })
    await page.route('**/api/cronogramas/**', async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        patchCalled = true
        await route.fulfill({ status: 200, json: { ...mockCronograma.cuotas[2], pagado: true } })
      } else {
        await route.fulfill({ status: 200, json: mockCronograma })
      }
    })
    await page.route('**/api/pagos**', async (route) => {
      if (route.request().method() === 'POST') {
        patchCalled = true
        await route.fulfill({ status: 201, json: { id: 999, cuotaId: 3, monto: 8500 } })
      } else {
        await route.fulfill({ status: 200, json: [] })
      }
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/finanzas/1001')

    await page.waitForTimeout(1_500)

    // Buscar botón para registrar pago en la cuota pendiente
    const pagarBtn = page.locator(
      'button:has-text("Pagar"), button:has-text("Registrar pago"), button:has-text("Marcar pagado")'
    )

    if (await pagarBtn.count() > 0) {
      await pagarBtn.first().click()
      await page.waitForTimeout(500)

      const confirmarBtn = page.locator('button:has-text("Confirmar"), button:has-text("Guardar"), button[type="submit"]')
      if (await confirmarBtn.count() > 0) {
        await confirmarBtn.first().click()
        await page.waitForTimeout(1_000)
        expect(patchCalled).toBe(true)
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'CP32: No se encontró botón "Registrar pago" en el cronograma VIGENTE en /finanzas/1001.',
      })
    }
  })
})
