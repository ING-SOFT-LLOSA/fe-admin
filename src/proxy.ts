import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("llosa_id_token")?.value;

  // 1. Generar nonce criptográfico único
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const isProd = process.env.NODE_ENV === "production";

  // CSP con nonce y strict-dynamic para evitar XSS
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://www.gstatic.com;`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://apis.google.com https://www.gstatic.com;`;

  const connectSrc = isProd
    ? "connect-src 'self' https://*.ingsoftware.lat https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://*.firebaseio.com;"
    : "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://*.ingsoftware.lat https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://*.firebaseio.com;";

  const cspHeader = [
    "default-src 'self';",
    scriptSrc,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com;`,
    "img-src 'self' blob: data: https://lh3.googleusercontent.com https://*.googleapis.com https://*.firebaseapp.com;",
    "font-src 'self' data: https://fonts.gstatic.com;",
    connectSrc,
    "frame-src 'self' https://*.firebaseapp.com;",
    "object-src 'none';",
    "base-uri 'self';",
    "form-action 'self';",
    "frame-ancestors 'none';",
    "upgrade-insecure-requests;",
  ].join(" ");

  // 2. Control de redirección de autenticación
  if (!token && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    // Establecer CSP en la redirección
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  // 3. Crear respuesta y propagar el CSP
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - API routes (/api/*)
     * - Archivos estáticos de Next.js (/_next/*)
     * - Archivos públicos (favicon, logos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*[.]png|.*[.]jpg|.*[.]svg).*)',
  ],
};
