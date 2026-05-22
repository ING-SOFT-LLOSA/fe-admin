<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SYSTEM RULES: FRONTEND DESIGN SYSTEM

## 1. PALETA DE COLORES OBLIGATORIA
Tienes ESTRICTAMENTE PROHIBIDO inventar colores, usar valores hexadecimales arbitrarios en las clases de Tailwind o usar los colores por defecto. Debes usar única y exclusivamente las variables semánticas configuradas en el CSS (`globals.css` con Tailwind v4):
- Fondo general y secciones (60%): `build-bg` (Hex: #f9f6f0)
- Textos principales, títulos y botones primarios (30%): `build-main` (Hex: #3C3C3B)
- Detalles, bordes, iconos y hovers (10%): `build-accent` (Hex: #c49e5d)

## 2. REGLAS DE CONTRASTE Y ACCESIBILIDAD (WCAG)
- Todo el texto legible e informativo DEBE llevar la clase `text-build-main`. Nunca uses `text-build-accent` para párrafos largos.
- Los botones principales (CTA) se diseñan con fondo oscuro (`bg-build-main`) y texto claro (`text-build-bg`).
- Las tarjetas (Cards) o divisiones deben usar bordes finos con `border-build-accent` sobre el fondo `bg-build-bg`.

## 3. TIPOGRAFÍA
- **Headings** (h1-h6): `'Outfit', sans-serif` — bold, tight letter-spacing.
- **Body text**, labels, inputs, buttons: `'Plus Jakarta Sans', sans-serif`.
- Nunca uses Manrope, Inter, Roboto ni las fuentes por defecto del navegador.

## 4. ESTILO VISUAL
El enfoque de la constructora es moderno, limpio y arquitectónico. Evita sobrecargar la interfaz. Prioriza el uso de espacios en blanco amplios (paddings y margins generosos) para separar la información en lugar de usar bloques de color pesados.
