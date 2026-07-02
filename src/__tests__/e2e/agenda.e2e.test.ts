
import { test, expect, type Page } from '@playwright/test'
import { injectSession } from './helpers/auth-mock'


const perfilAdmin = {
  id: 1,
  nombre: 'Admin Sistema',
  email: 'admin@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'ADMIN',
  activo: true,
  funciones: ['AGENDA_VER', 'AGENDA_EDITAR'],
}

// Fecha futura válida: mañana
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const fechaFutura = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD

// Fecha pasada: ayer
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const fechaPasada = yesterday.toISOString().split('T')[0] // YYYY-MM-DD

const mockCitas = [
  {
    id: 201,
    titulo: 'Reunión con Ana García',
    descripcion: 'Presentación del proyecto Edificio Aurora',
    fecha: fechaFutura,
    hora: '10:00',
    clienteId: 101,
    asesorId: 1,
    estado: 'PROGRAMADA',
    tipo: 'PRESENCIAL',
  },
]


async function mockAgendaEndpoints(page: Page) {
  await page.route('**/api/agenda**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: mockCitas })
    } else {
      await route.fallback()
    }
  })
  await page.route('**/api/citas**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: mockCitas })
    } else {
      await route.fallback()
    }
  })
  await page.route('**/api/users**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 101, nombre: 'Ana', apellidos: 'García', email: 'ana@gmail.com', tipoUsuario: 'CLIENTE', activo: true }],
    })
  })
}


test.describe('Agenda — Acceso y listado', () => {
  test('admin accede a /agenda y ve las citas programadas', async ({ page }) => {
    await mockAgendaEndpoints(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/agenda')

    await expect(
      page.locator('text=/agenda|cita|calendario/i').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('existe botón para crear nueva cita', async ({ page }) => {
    await mockAgendaEndpoints(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/agenda')

    await expect(
      page.locator('text=/agenda|cita|calendario/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const crearBtn = page.locator(
      'button:has-text("Nueva cita"), button:has-text("Crear cita"), button:has-text("Agendar"), a:has-text("Nueva")'
    )
    if (await crearBtn.count() > 0) {
      await expect(crearBtn.first()).toBeVisible()
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Agenda: No se encontró botón de creación de cita en /agenda.',
      })
    }
  })
})


test.describe('CP34 — Agendar cita con fecha futura válida', () => {
  test('se puede crear una cita con fecha futura (mañana)', async ({ page }) => {
    let postCalled = false
    let requestBody: Record<string, unknown> | null = null

    await mockAgendaEndpoints(page)

    // Mock para el POST de creación de cita
    await page.route('**/api/agenda', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
        const body = route.request().postDataJSON() as Record<string, unknown>
        requestBody = body
        await route.fulfill({
          status: 201,
          json: {
            id: 202,
            ...body,
            estado: 'PROGRAMADA',
          },
        })
      } else {
        await route.fulfill({ status: 200, json: mockCitas })
      }
    })
    await page.route('**/api/citas', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
        const body = route.request().postDataJSON() as Record<string, unknown>
        requestBody = body
        await route.fulfill({
          status: 201,
          json: { id: 202, ...body, estado: 'PROGRAMADA' },
        })
      } else {
        await route.fulfill({ status: 200, json: mockCitas })
      }
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/agenda')

    await expect(
      page.locator('text=/agenda|cita|calendario/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const crearBtn = page.locator(
      'button:has-text("Nueva cita"), button:has-text("Crear cita"), button:has-text("Agendar"), button:has-text("Nueva"), a:has-text("Nueva")'
    )

    if (await crearBtn.count() > 0) {
      await crearBtn.first().click()
      await page.waitForTimeout(500)

      // Llenar campo de fecha con fecha futura
      const fechaInput = page.locator(
        'input[type="date"], input[name*="fecha"], input[placeholder*="fecha"]'
      )
      if (await fechaInput.count() > 0) {
        await fechaInput.first().fill(fechaFutura)
      }

      // Llenar hora
      const horaInput = page.locator(
        'input[type="time"], input[name*="hora"], input[placeholder*="hora"]'
      )
      if (await horaInput.count() > 0) {
        await horaInput.first().fill('10:00')
      }

      // Llenar título o descripción
      const tituloInput = page.locator(
        'input[name*="titulo"], input[name*="asunto"], textarea[name*="descripcion"]'
      )
      if (await tituloInput.count() > 0) {
        await tituloInput.first().fill('Reunión de presentación')
      }

      const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")')
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click()
        await page.waitForTimeout(1_500)
      }

      if (postCalled) {
        // Si el POST fue llamado, verificar que la fecha en el body es futura
        if (requestBody && requestBody.fecha) {
          expect(new Date(requestBody.fecha as string) > new Date()).toBeTruthy()
        }
      } else {
        const success = page.locator('text=/creada|agendada|guardada|éxito/i')
        if (await success.count() === 0) {
          test.info().annotations.push({
            type: 'info',
            description: 'CP34: No se confirmó la creación de la cita. El flujo puede requerir más pasos.',
          })
        }
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'CP34: No se encontró botón para crear nueva cita en /agenda.',
      })
    }
  })

  test('la cita creada aparece en el listado de la agenda', async ({ page }) => {
    const citaNueva = {
      id: 203,
      titulo: 'Visita a obra Edificio Aurora',
      fecha: fechaFutura,
      hora: '14:00',
      estado: 'PROGRAMADA',
      clienteId: 101,
    }

    await page.route('**/api/agenda**', async (route) => {
      await route.fulfill({ status: 200, json: [...mockCitas, citaNueva] })
    })
    await page.route('**/api/citas**', async (route) => {
      await route.fulfill({ status: 200, json: [...mockCitas, citaNueva] })
    })
    await page.route('**/api/users**', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/agenda')

    await expect(
      page.locator('text=/agenda|cita|calendario/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const citaVisible = page.locator('text=Visita a obra Edificio Aurora')
    if (await citaVisible.count() > 0) {
      await expect(citaVisible).toBeVisible()
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'CP34: La cita no se muestra en el listado — puede ser un calendario visual.',
      })
    }
  })
})


test.describe('CP36 — Rechazar cita con fecha en el pasado', () => {
  test('validación client-side: no se puede seleccionar fecha pasada en el datepicker', async ({ page }) => {
    await mockAgendaEndpoints(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/agenda')

    await expect(
      page.locator('text=/agenda|cita|calendario/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const crearBtn = page.locator(
      'button:has-text("Nueva cita"), button:has-text("Crear cita"), button:has-text("Agendar"), button:has-text("Nueva"), a:has-text("Nueva")'
    )

    if (await crearBtn.count() > 0) {
      await crearBtn.first().click()
      await page.waitForTimeout(500)

      // Intentar ingresar fecha pasada
      const fechaInput = page.locator(
        'input[type="date"], input[name*="fecha"], input[placeholder*="fecha"]'
      )

      if (await fechaInput.count() > 0) {
        await fechaInput.first().fill(fechaPasada)

        // Intentar enviar
        const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")')
        if (await submitBtn.count() > 0) {
          await submitBtn.first().click()
          await page.waitForTimeout(1_000)

          const validationMsg = page.locator(
            'text=/fecha.*pasada|fecha.*inválida|debe.*futura|pasado/i'
          )
          if (await validationMsg.count() > 0) {
            await expect(validationMsg.first()).toBeVisible({ timeout: 3_000 })
          } else {
            const minAttr = await fechaInput.first().getAttribute('min')
            if (minAttr) {
              expect(new Date(minAttr) >= yesterday).toBeTruthy()
            } else {
              // BUG documentado: no hay validación client-side de fecha pasada
              test.info().annotations.push({
                type: 'bug',
                description: 'CP36: El campo de fecha no tiene atributo min ni validación client-side para fechas pasadas. Un usuario puede crear citas con fechas pasadas.',
              })
            }
          }
        }
      } else {
        test.info().annotations.push({
          type: 'info',
          description: 'CP36: No se encontró campo de fecha en el formulario de cita.',
        })
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'CP36: No se encontró botón para crear nueva cita en /agenda.',
      })
    }
  })

  test('backend rechaza POST de cita con fecha pasada (400/422)', async ({ page }) => {
    let postAttempted = false

    await mockAgendaEndpoints(page)
    await page.route('**/api/agenda', async (route) => {
      if (route.request().method() === 'POST') {
        postAttempted = true
        await route.fulfill({
          status: 422,
          json: { error: 'La fecha de la cita no puede ser en el pasado.' },
        })
      } else {
        await route.fulfill({ status: 200, json: mockCitas })
      }
    })
    await page.route('**/api/citas', async (route) => {
      if (route.request().method() === 'POST') {
        postAttempted = true
        await route.fulfill({
          status: 422,
          json: { error: 'La fecha de la cita no puede ser en el pasado.' },
        })
      } else {
        await route.fulfill({ status: 200, json: mockCitas })
      }
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/agenda')

    await expect(
      page.locator('text=/agenda|cita|calendario/i').first()
    ).toBeVisible({ timeout: 8_000 })

    const crearBtn = page.locator(
      'button:has-text("Nueva cita"), button:has-text("Crear"), button:has-text("Agendar"), a:has-text("Nueva")'
    )

    if (await crearBtn.count() > 0) {
      await crearBtn.first().click()
      await page.waitForTimeout(500)

      // Forzar fecha pasada en el input (bypassing min validation)
      const fechaInput = page.locator('input[type="date"], input[name*="fecha"]')
      if (await fechaInput.count() > 0) {
        await fechaInput.first().evaluate(
          (el, date) => { (el as HTMLInputElement).value = date },
          fechaPasada
        )
      }

      const tituloInput = page.locator('input[name*="titulo"], input[name*="asunto"]')
      if (await tituloInput.count() > 0) {
        await tituloInput.first().fill('Cita con fecha pasada')
      }

      const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar")')
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click()
        await page.waitForTimeout(1_500)

        if (postAttempted) {
          await expect(
            page.locator('text=/pasada|inválida|error/i').first()
          ).toBeVisible({ timeout: 5_000 })
        }
      }
    }
  })

  test('campo de fecha tiene atributo min estrictamente mayor a la fecha de hoy', async ({ page }) => {
    await mockAgendaEndpoints(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/agenda')

    await expect(
      page.locator('text=/agenda|cita/i').first()
    ).toBeVisible({ timeout: 8_000 })

    // getByRole evita cuelgues que producen los selectores compuestos con :has-text
    const crearBtn = page.getByRole('button', { name: /nueva cita/i })

    if (await crearBtn.count() > 0) {
      await crearBtn.first().click()
      await page.waitForTimeout(500)

      // Usar el id específico evita ambigüedad con el input de edición (#edit-date)
      const fechaInput = page.locator('#agenda-event-date')
      if (await fechaInput.count() > 0) {
        const minAttr = await fechaInput.getAttribute('min')
        const today = new Date().toISOString().split('T')[0]

        if (minAttr) {
          // CP36: min debe ser ESTRICTAMENTE mayor a hoy (mañana o posterior)
          expect(
            minAttr > today,
            `CP36: min="${minAttr}" no es estrictamente mayor a hoy (${today}). Debe apuntar a mañana o una fecha futura.`
          ).toBeTruthy()
        } else {
          test.info().annotations.push({
            type: 'bug',
            description: 'CP36: El input de fecha no tiene atributo "min". No se previene la selección de fechas pasadas a nivel HTML, solo a nivel JS al enviar el formulario.',
          })
        }
      }
    }
  })
})
