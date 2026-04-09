// lib/apply-theme.ts
// ─── Motor de inyección de variables CSS + fuentes dinámicas ─────────────────
// Recibe ThemeConfig y escribe las variables en :root del documento.

import type { ThemeConfig } from './theme-service'

// ─── Mapa de token → variable CSS ────────────────────────────────────────────
// Cada clave del ThemeConfig se traduce a una (o varias) variables CSS.
// Esto es lo que Tailwind consume vía `var(--*)`.

type CssVarMap = {
  [K in keyof ThemeConfig]?: (value: NonNullable<ThemeConfig[K]>) => Record<string, string>
}

const TOKEN_MAP: CssVarMap = {
  primaryColor: (v) => ({
    '--primary':            v,
    '--primary-color':      v,
    '--color-primary':      v,
    '--ring':               v,
    '--sidebar-primary':    v,
  }),
  secondaryColor: (v) => ({
    '--secondary-color':    v,
    '--color-secondary':    v,
  }),
  accentColor: (v) => ({
    '--accent':             v,
    '--accent-color':       v,
    '--color-accent':       v,
  }),
  backgroundColor: (v) => ({
    '--background':         v,
    '--color-background':   v,
  }),
  textColor: (v) => ({
    '--foreground':         v,
    '--color-foreground':   v,
  }),
  borderRadius: (v) => ({
    '--radius':             `${v}px`,
    '--radius-bento':       `${v}px`,
    '--radius-sm':          `${Math.max(0, v - 4)}px`,
    '--radius-md':          `${Math.max(0, v - 2)}px`,
    '--radius-lg':          `${v}px`,
    '--radius-xl':          `${v + 4}px`,
  }),
  fontMain: (v) => ({
    '--font-main':          v,
    '--font-sans':          `'${v}', sans-serif`,
  }),
  fontHeading: (v) => ({
    '--font-heading':       v,
    '--font-serif':         `'${v}', serif`,
    '--font-display':       `'${v}', serif`,
  }),
}

// ─── Fuentes de Google ya cargadas (singleton) ───────────────────────────────
const loadedFonts = new Set<string>()

/**
 * Verifica si una fuente ya está en el DOM o en loadedFonts,
 * y si no, inserta el <link> de Google Fonts dinámicamente.
 * Solo se ejecuta en el cliente (window check).
 */
export function loadGoogleFont(fontFamily: string): void {
  if (typeof window === 'undefined') return
  if (loadedFonts.has(fontFamily)) return

  // Verificar si ya hay un link para esta fuente
  const existing = document.head.querySelector(
    `link[data-gfont="${CSS.escape(fontFamily)}"]`,
  )
  if (existing) {
    loadedFonts.add(fontFamily)
    return
  }

  // Familias que NO son Google Fonts (sistema / genéricas)
  const systemFonts = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', '-apple-system', 'BlinkMacSystemFont',
    'Segoe UI', 'Arial', 'Helvetica', 'Georgia', 'Verdana',
    'Times New Roman', 'Courier New',
  ])
  if (systemFonts.has(fontFamily)) {
    loadedFonts.add(fontFamily)
    return
  }

  // Construir URL de Google Fonts v2
  const encodedFamily = encodeURIComponent(fontFamily)
  const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`

  // Preconnect (solo una vez)
  if (!document.head.querySelector('link[rel="preconnect"][href="https://fonts.googleapis.com"]')) {
    const preconnect1 = document.createElement('link')
    preconnect1.rel  = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(preconnect1)

    const preconnect2 = document.createElement('link')
    preconnect2.rel          = 'preconnect'
    preconnect2.href         = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin  = 'anonymous'
    document.head.appendChild(preconnect2)
  }

  // Insertar el link
  const link = document.createElement('link')
  link.rel                   = 'stylesheet'
  link.href                  = href
  link.setAttribute('data-gfont', fontFamily)
  document.head.appendChild(link)

  loadedFonts.add(fontFamily)
}

/**
 * applyTheme(config)
 *
 * Escribe las variables CSS en document.documentElement (:root).
 * Llama a loadGoogleFont para cada fuente del config.
 * Es idempotente — puede llamarse varias veces con distintos configs.
 */
export function applyTheme(config: ThemeConfig): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  // Recorrer cada token del config y mapear a variables CSS
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null) continue

    const mapper = TOKEN_MAP[key as keyof ThemeConfig]
    if (mapper) {
      // @ts-ignore — el tipado dinámico es correcto por construcción
      const vars = mapper(value)
      for (const [cssVar, cssValue] of Object.entries(vars)) {
        root.style.setProperty(cssVar, cssValue)
      }
    }

    // customTokens: aplicar directamente como --nombre-token
    if (key === 'customTokens' && typeof value === 'object') {
      for (const [tokenName, tokenValue] of Object.entries(value as Record<string, string | number>)) {
        const varName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`
        root.style.setProperty(varName, String(tokenValue))
      }
    }
  }

  // Cargar fuentes dinámicamente
  if (config.fontMain)    loadGoogleFont(config.fontMain)
  if (config.fontHeading) loadGoogleFont(config.fontHeading)

  // Aplicar data-theme para selector CSS si se quiere scope adicional
  if (config.themeMode && config.themeMode !== 'system') {
    root.setAttribute('data-theme', config.themeMode)
  }
}

/**
 * buildCssString(config)
 *
 * Versión SSR-safe: devuelve un string de CSS con las variables
 * listo para inyectar en un <style> tag en el servidor.
 * Esto evita FOUC (Flash of Unstyled Content) en la primera carga.
 */
export function buildCssString(config: ThemeConfig): string {
  const lines: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null) continue
    if (key === 'customTokens' || key === 'themeMode' || key === 'fontMain' || key === 'fontHeading') continue

    const mapper = TOKEN_MAP[key as keyof ThemeConfig]
    if (mapper) {
      // @ts-ignore
      const vars = mapper(value)
      for (const [cssVar, cssValue] of Object.entries(vars)) {
        lines.push(`  ${cssVar}: ${cssValue};`)
      }
    }
  }

  if (config.fontMain) {
    lines.push(`  --font-main: ${config.fontMain};`)
    lines.push(`  --font-sans: '${config.fontMain}', sans-serif;`)
  }
  if (config.fontHeading) {
    lines.push(`  --font-heading: ${config.fontHeading};`)
    lines.push(`  --font-serif: '${config.fontHeading}', serif;`)
    lines.push(`  --font-display: '${config.fontHeading}', serif;`)
  }

  if (config.customTokens) {
    for (const [tokenName, tokenValue] of Object.entries(config.customTokens)) {
      const varName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`
      lines.push(`  ${varName}: ${String(tokenValue)};`)
    }
  }

  return `:root {\n${lines.join('\n')}\n}`
}