import { test, expect, type Page } from '@playwright/test'
import { mockFirebaseSuccess, mockFirebaseError, mockAuthMe } from './helpers/auth-mock'


test.describe('CP01 — Login corporativo exitoso con dominio @llosaedificaciones.com', () => {
  test('admin@llosaedificaciones.com accede al backoffice tras login exitoso', async ({ page }) => {
    const perfilAdmin = {
      id: 1,
      nombre: 'Admin',
      email: 'admin@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ADMIN',
      activo: true,
      funciones: [],
    }

    await mockFirebaseSuccess(page, 'admin@llosaedificaciones.com')
    await mockAuthMe(page, perfilAdmin)
    await page.goto('/login')

    await page.fill('input[type="email"]', 'admin@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/(proyectos|dashboard)/, { timeout: 8_000 })
  })

  test('no se muestran errores en login válido', async ({ page }) => {
    const perfilAsesor = {
      id: 2,
      nombre: 'Asesor Uno',
      email: 'asesor@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ASESOR',
      activo: true,
      funciones: ['PROYECTO_VER'],
    }

    await mockFirebaseSuccess(page, 'asesor@llosaedificaciones.com')
    await mockAuthMe(page, perfilAsesor)
    await page.goto('/login')

    await page.fill('input[type="email"]', 'asesor@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    // No debe aparecer ningún alert de ERROR (filtramos por texto no vacío;
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /\S/ })
    await expect(errorAlert).toHaveCount(0)
  })
})

// NOTA: el LoginForm actual NO valida el dominio del correo en el cliente.
// Cualquier email se envía a Firebase; el rechazo ocurre en el backend/Firebase.

test.describe('CP02 — Login con dominio externo (@gmail.com)', () => {
  test('un dominio externo SÍ llega a Firebase (no existe pre-validación de dominio)', async ({ page }) => {
    let firebaseCalled = false
    await mockFirebaseError(page, 'INVALID_LOGIN_CREDENTIALS')
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      firebaseCalled = true
      await route.fallback() // dejar que el mock de error responda
    })

    await page.goto('/login')
    await page.fill('input[type="email"]', 'usuario@gmail.com')
    await page.fill('input[type="password"]', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    // Firebase SÍ es llamado: no hay bloqueo de dominio en el cliente
    await expect(page.locator('[role="alert"]').filter({ hasText: /\S/ })).toBeVisible({ timeout: 5_000 })
    expect(firebaseCalled).toBe(true)
  })

  test('se muestra algún error al intentar login con dominio externo', async ({ page }) => {
    // Firebase rechaza porque el usuario no existe
    await mockFirebaseError(page, 'INVALID_LOGIN_CREDENTIALS')
    await page.goto('/login')

    await page.fill('input[type="email"]', 'intruso@hotmail.com')
    await page.fill('input[type="password"]', 'cualquierClave123')
    await page.click('button[type="submit"]')

    // Al menos debe mostrar algún error (el alert con texto, no el route-announcer vacío de Next)
    const error = page.locator('[role="alert"]').filter({ hasText: /\S/ })
    await expect(error).toBeVisible({ timeout: 5_000 })
  })
})


test.describe('CP03 — La opción de recuperar contraseña existe en el backoffice', () => {

  test('El formulario de /login muestra el botón "¿Olvidaste tu contraseña?"', async ({ page }) => {
    await page.goto('/login')
    const btn = page.locator('button:has-text("Olvidaste tu contraseña")')
    await expect(btn).toBeVisible()
  })
})


test.describe('CP04 — Rechazo de credenciales inválidas', () => {
  test('muestra "Correo o contraseña inválido." con auth/invalid-credential', async ({ page }) => {
    await mockFirebaseError(page, 'INVALID_LOGIN_CREDENTIALS')
    await page.goto('/login')

    await page.fill('input[type="email"]', 'tecnico@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ClaveErronea000')
    await page.click('button[type="submit"]')

    await expect(
      page.locator('[role="alert"]').filter({ hasText: /\S/ })
    ).toContainText('Correo o contraseña inválido.', { timeout: 5_000 })
  })

  test('no redirige al dashboard cuando las credenciales son incorrectas', async ({ page }) => {
    await mockFirebaseError(page, 'INVALID_PASSWORD')
    await page.goto('/login')

    await page.fill('input[type="email"]', 'valido@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ClaveErronea000')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/login/, { timeout: 3_000 })
  })
})

// VENDIDO/SEPARADO, "Modo de Espera", cliente inactivo) se eliminaron porque
// esa feature ya no existe: el LoginForm desloguea a los usuarios CLIENTE
// ("El acceso para clientes ha sido movido a un portal especializado").
// Verificar ese comportamiento requiere un login Firebase EXITOSO, que no es
// reproducible solo con mocks de red (necesita el Firebase Auth Emulator).
