// components/theme-manager/ThemeScript.tsx
// ─── Script inline SSR para evitar FOUC ──────────────────────────────────────
// Se renderiza en el <head> del layout como Server Component.
// Inyecta las variables CSS desde el servidor ANTES de que React hidrate,
// eliminando el parpadeo visual (Flash of Unstyled Content).

import { buildCssString } from "@/lib/apply-theme"
import { fetchThemeConfig } from "@/lib/theme-service"


interface ThemeScriptProps {
  projectKey: string
}

/**
 * Server Component — se ejecuta en el servidor durante SSR.
 * 1. Fetchea el tema desde el backend (con caché de Next.js, revalidate 300s).
 * 2. Genera el string de CSS variables.
 * 3. Renderiza un <style> + <link> de Google Fonts inline en el <head>.
 *
 * Al estar en el <head> antes del <body>, las variables están disponibles
 * desde el primer paint — sin flash, sin parpadeo.
 */
export async function ThemeScript({ projectKey }: ThemeScriptProps) {
  const { config } = await fetchThemeConfig(projectKey)
  const cssString  = buildCssString(config)

  // Construir los links de Google Fonts para SSR
  const fontsToLoad = [config.fontMain, config.fontHeading]
    .filter(Boolean)
    .filter((f) => !isSystemFont(f!))

  const uniqueFonts = [...new Set(fontsToLoad)]

  return (
    <>
      {/* Preconnect a Google Fonts si hay fuentes dinámicas */}
      {uniqueFonts.length > 0 && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        </>
      )}

      {/* Links de Google Fonts — cargados con display=swap para no bloquear */}
      {uniqueFonts.map((font) => (
        <link
          key={font}
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font!)}:wght@300;400;500;600;700&display=swap`}
          data-gfont={font}
        />
      ))}

      {/* Variables CSS inline — aplicadas antes del primer paint */}
      <style
        dangerouslySetInnerHTML={{ __html: cssString }}
        data-theme-key={projectKey}
      />
    </>
  )
}

function isSystemFont(font: string): boolean {
  const system = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', '-apple-system', 'Arial', 'Helvetica',
    'Georgia', 'Verdana', 'Times New Roman',
  ])
  return system.has(font)
}
