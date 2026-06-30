/**
 * Shared E2E auth-mock helpers.
 *
 * Root cause fixed here: AuthContext.onAuthStateChanged calls getIdToken(true)
 * (force-refresh) after every sign-in. That hits securetoken.googleapis.com.
 * If that endpoint is NOT mocked, the refresh fails → catch block clears session
 * → user stays on /login even though loginEmail just succeeded.
 *
 * Fix: mock BOTH identitytoolkit (sign-in) AND securetoken (force-refresh).
 *
 * We also use a properly-formatted fake JWT so Firebase SDK can parse it
 * without errors (it decodes header + payload but never verifies the signature
 * client-side).
 */

import type { Page } from '@playwright/test'

// Valid-format fake JWT: header.payload.sig (base64url)
// Payload has exp=9999999999 (far future) so Firebase never considers it expired
export const FAKE_JWT =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJtb2NrLXVpZC0wMDEiLCJlbWFpbCI6Im1vY2tAbGxvc2FlZGlmaWNhY2lvbmVzLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5LCJhdWQiOiJkZW1vLWxsb3NhIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2RlbW8tbGxvc2EiLCJmaXJlYmFzZSI6eyJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0' +
  '.mock-sig'

export async function mockFirebaseSuccess(page: Page, email: string): Promise<void> {
  // Firebase SDK v9+ makes these requests during signInWithEmailAndPassword:
  //   1. POST accounts:signInWithPassword   → returns idToken + refreshToken
  //   2. POST accounts:lookup (GetAccountInfo) → returns full user profile array
  // Without the correct response format for each, the SDK throws
  // "Cannot read properties of undefined (reading 'length')" because it tries
  // to iterate response.users[] from a sign-in-shaped response.

  await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
    const url = route.request().url()

    if (url.includes('accounts%3AlookupUser') || url.includes('accounts:lookup') || url.includes('getAccountInfo')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#GetAccountInfoResponse',
          users: [{
            localId: 'mock-uid-001',
            email,
            displayName: '',
            emailVerified: true,
            providerUserInfo: [{ providerId: 'password', email, federatedId: email, rawId: email }],
            validSince: '1700000000',
            disabled: false,
            lastLoginAt: '1700000000000',
            createdAt: '1700000000000',
            passwordHash: 'mock-hash',
          }],
        }),
      })
    } else {
      // signInWithPassword + any other identitytoolkit endpoint
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#VerifyPasswordResponse',
          localId: 'mock-uid-001',
          email,
          displayName: '',
          idToken: FAKE_JWT,
          registered: true,
          refreshToken: 'mock-refresh-token',
          expiresIn: '3600',
        }),
      })
    }
  })

  // Required: getIdToken(true) in onAuthStateChanged calls this endpoint.
  // Without mocking securetoken, the force-refresh fails → catch block in
  // AuthContext clears the session right after login succeeds.
  await page.route('**/securetoken.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: FAKE_JWT,
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'mock-refresh-token',
        id_token: FAKE_JWT,
        user_id: 'mock-uid-001',
        project_id: 'demo-llosa',
      }),
    })
  })
}

export async function mockFirebaseError(page: Page, errorCode: string): Promise<void> {
  await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 400, message: errorCode, errors: [{ message: errorCode }] },
      }),
    })
  })
}

export async function mockAuthMe(
  page: Page,
  perfil: Record<string, unknown> | null,
  status = 200,
): Promise<void> {
  await page.route('**/api/auth/me', async (route) => {
    if (perfil === null) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    } else {
      await route.fulfill({ status, json: perfil })
    }
  })
}

/**
 * Full login flow via form submission with mocked Firebase + backend.
 * Waits for the session cookie to confirm successful login.
 */
export async function injectSession(
  page: Page,
  perfil: Record<string, unknown>,
): Promise<void> {
  const email = (perfil.email as string) || 'test@llosaedificaciones.com'
  await mockFirebaseSuccess(page, email)
  await mockAuthMe(page, perfil)
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'Test123456')
  await page.click('button[type="submit"]')
  await page
    // 2nd param is `arg` (passed into the predicate), not `options` — must be
    // explicit `undefined` or the { timeout } object is silently swallowed as
    // `arg` and this waits with NO timeout (hangs until the test's own timeout).
    .waitForFunction(() => document.cookie.includes('llosa_id_token='), undefined, { timeout: 12_000 })
    .catch(() => { /* negative case — test verifies expected behavior */ })
}
