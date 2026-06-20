import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("llosa_id_token")?.value;
  
  if (token) {
    return NextResponse.next();
  }
  
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - API routes (/api/*)
     * - Archivos estáticos de Next.js (/_next/*)
     * - Archivos públicos (favicon, logos)
     * - Ruta de login (/login)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*[.]png|.*[.]jpg|.*[.]svg|login).*)',
  ],
};
