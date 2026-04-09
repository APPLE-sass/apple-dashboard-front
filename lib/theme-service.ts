// lib/theme-service.ts
// ─── Servicio de temas White-Label ───────────────────────────────────────────
// Consume GET /themes/:projectKey y devuelve los design tokens.
// Si la API falla, devuelve el fallback del Sistema NODO.

export interface ThemeConfig {
  primaryColor?:    string
  secondaryColor?:  string
  accentColor?:     string
  backgroundColor?: string
  textColor?:       string
  borderRadius?:    number
  fontMain?:        string
  fontHeading?:     string
  themeMode?:       'light' | 'dark' | 'system'
  customTokens?:    Record<string, string | number>
}

export interface ThemeResponse {
  projectKey: string
  isDefault:  boolean
  config:     ThemeConfig
  cachedAt?:  string
}

// ─── Fallback: Sistema NODO (siempre disponible sin red) ─────────────────────
export const NODO_FALLBACK_THEME: ThemeConfig = {
  primaryColor:    '#E63946',
  secondaryColor:  '#1D3557',
  accentColor:     '#457B9D',
  backgroundColor: '#F1FAEE',
  textColor:       '#1D3557',
  borderRadius:    6,
  fontMain:        'Plus Jakarta Sans',
  fontHeading:     'Michroma',
  themeMode:       'light',
  customTokens:    {},
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

// Cache en memoria para evitar re-fetches dentro de la misma sesión
const memoryCache = new Map<string, ThemeConfig>()

/**
 * Obtiene la config de tema del backend.
 * - Si hay un hit de caché en memoria, lo devuelve directamente.
 * - Si la request falla (red caída, 404, timeout), devuelve el fallback NODO.
 * - Si isDefault=true en la respuesta, igual aplica esos tokens (son válidos).
 */
export async function fetchThemeConfig(
  projectKey: string,
  timeoutMs = 3000,
): Promise<{ config: ThemeConfig; source: 'api' | 'cache' | 'fallback' }> {
  // 1. Hit de caché en memoria
  if (memoryCache.has(projectKey)) {
    return { config: memoryCache.get(projectKey)!, source: 'cache' }
  }

  // 2. Fetch con timeout
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(`${BASE_URL}/themes/${projectKey}`, {
      signal: controller.signal,
      // No mandamos Authorization: es una ruta pública
      headers: { 'Content-Type': 'application/json' },
      // next.js: revalidar cada 5 minutos (coincide con el TTL del backend)
      next: { revalidate: 300 },
    })

    clearTimeout(timer)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    // El backend aplana el config directamente en la respuesta:
    // { projectKey, isDefault, primaryColor, fontMain, ... }
    const raw = await res.json()

    // Extraer solo los tokens (excluir projectKey, isDefault, cachedAt)
    const { projectKey: _pk, isDefault: _id, cachedAt: _ca, ...tokens } = raw
    const config: ThemeConfig = tokens

    // Guardar en caché de memoria
    memoryCache.set(projectKey, config)

    return { config, source: 'api' }
  } catch {
    // 3. Fallback silencioso — nunca rompemos la UI por un tema
    return { config: NODO_FALLBACK_THEME, source: 'fallback' }
  }
}

/** Limpia el caché en memoria (útil en hot-reload / dev) */
export function clearThemeCache(projectKey?: string) {
  if (projectKey) {
    memoryCache.delete(projectKey)
  } else {
    memoryCache.clear()
  }
}