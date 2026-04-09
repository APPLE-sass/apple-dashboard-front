'use client'
// components/theme-manager/ThemeProvider.tsx
// ─── Provider de alto nivel: fetcha el tema y lo inyecta en el DOM ───────────
// Se monta en el Layout (o en app/layout.tsx) para máxima prioridad de carga.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { fetchThemeConfig, NODO_FALLBACK_THEME, type ThemeConfig } from '@/lib/theme-service'
import { applyTheme } from '@/lib/apply-theme'

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  config:     ThemeConfig
  projectKey: string
  source:     'api' | 'cache' | 'fallback' | 'loading'
  isLoading:  boolean
  reload:     () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue>({
  config:     NODO_FALLBACK_THEME,
  projectKey: '',
  source:     'loading',
  isLoading:  true,
  reload:     async () => {},
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children:      ReactNode
  projectKey:    string
  /** Config precargada desde el servidor (evita FOUC) */
  initialConfig?: ThemeConfig
}

export function ThemeProvider({
  children,
  projectKey,
  initialConfig,
}: ThemeProviderProps) {
  const [config, setConfig]   = useState<ThemeConfig>(initialConfig ?? NODO_FALLBACK_THEME)
  const [source, setSource]   = useState<ThemeContextValue['source']>(
    initialConfig ? 'api' : 'loading',
  )
  const [isLoading, setIsLoading] = useState(!initialConfig)

  const load = useCallback(async () => {
    setIsLoading(true)
    const result = await fetchThemeConfig(projectKey)
    setConfig(result.config)
    setSource(result.source)
    applyTheme(result.config)
    setIsLoading(false)
  }, [projectKey])

  useEffect(() => {
    // Si ya viene config del servidor, aplicarla en cliente de todas formas
    // para sincronizar fuentes dinámicas (Google Fonts)
    if (initialConfig) {
      applyTheme(initialConfig)
      setIsLoading(false)
      return
    }
    void load()
  }, [projectKey, load, initialConfig])

  // Re-aplicar cuando cambia el config (ej: reload manual)
  useEffect(() => {
    if (!isLoading) applyTheme(config)
  }, [config, isLoading])

  return (
    <ThemeContext.Provider
      value={{ config, projectKey, source, isLoading, reload: load }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
