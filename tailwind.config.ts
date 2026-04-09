// tailwind.config.ts
// ─── Tailwind configurado para consumir las variables CSS del ThemeManager ───
// Todas las clases de Tailwind (bg-primary, text-secondary, rounded-lg…)
// apuntan a las variables que applyTheme() escribe en :root.
// Cambiar el tema en el backend se refleja automáticamente sin recompilar.

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],

  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      // ── Colores ─────────────────────────────────────────────────────────────
      // Cada token del ThemeConfig tiene su variable CSS homóloga.
      // El formato CSS `hsl(var(--x))` no aplica aquí porque usamos hex/rgb,
      // así que referenciamos la variable directamente.
      colors: {
        // Colores principales del tema
        primary: {
          DEFAULT:    'var(--primary-color, var(--primary, #E63946))',
          foreground: 'var(--primary-foreground, #ffffff)',
        },
        secondary: {
          DEFAULT:    'var(--secondary-color, #1D3557)',
          foreground: 'var(--secondary-foreground, #ffffff)',
        },
        accent: {
          DEFAULT:    'var(--accent-color, var(--accent, #457B9D))',
          foreground: 'var(--accent-foreground, #ffffff)',
        },

        // Backgrounds y textos
        background: 'var(--background, var(--color-background, #F1FAEE))',
        foreground: 'var(--foreground, var(--color-foreground, #1D3557))',

        // Shadcn/UI compatibility — estas ya existen en globals.css
        // pero las sobreescribimos para que también acepten el tema
        border:  'var(--border, rgba(0,0,0,0.1))',
        input:   'var(--input, rgba(0,0,0,0.08))',
        ring:    'var(--ring, var(--primary-color, #E63946))',
        muted: {
          DEFAULT:    'var(--muted, rgba(0,0,0,0.05))',
          foreground: 'var(--muted-foreground, rgba(0,0,0,0.5))',
        },
        card: {
          DEFAULT:    'var(--card, #ffffff)',
          foreground: 'var(--card-foreground, var(--foreground))',
        },
        popover: {
          DEFAULT:    'var(--popover, #ffffff)',
          foreground: 'var(--popover-foreground, var(--foreground))',
        },
        destructive: {
          DEFAULT:    'var(--destructive, #ef4444)',
          foreground: 'var(--destructive-foreground, #ffffff)',
        },

        // Sidebar (usada en el layout existente)
        sidebar: {
          DEFAULT:            'var(--sidebar, #f8fafc)',
          foreground:         'var(--sidebar-foreground, var(--foreground))',
          primary:            'var(--sidebar-primary, var(--primary-color))',
          'primary-foreground': 'var(--sidebar-primary-foreground, #ffffff)',
          accent:             'var(--sidebar-accent, var(--accent-color))',
          'accent-foreground': 'var(--sidebar-accent-foreground, #ffffff)',
          border:             'var(--sidebar-border, var(--border))',
          ring:               'var(--sidebar-ring, var(--ring))',
        },
      },

      // ── Tipografía ───────────────────────────────────────────────────────────
      fontFamily: {
        // font-sans → usa la fuente principal del tema (ej: Plus Jakarta Sans)
        sans: [
          'var(--font-sans, var(--font-main, "Plus Jakarta Sans"))',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        // font-serif → usa la fuente heading del tema (ej: Michroma)
        serif: [
          'var(--font-serif, var(--font-heading, "Michroma"))',
          'ui-serif',
          'Georgia',
          'serif',
        ],
        // font-display → alias explícito para headings display
        display: [
          'var(--font-display, var(--font-heading, "Michroma"))',
          'ui-serif',
          'serif',
        ],
        // font-mono → siempre fijo
        mono: [
          '"Geist Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },

      // ── Border Radius ────────────────────────────────────────────────────────
      // Tailwind usa `rounded-lg`, `rounded-xl` etc.
      // Los mapeamos a las variables que applyTheme() genera.
      borderRadius: {
        none:   '0',
        sm:     'var(--radius-sm,    2px)',
        DEFAULT:'var(--radius,       6px)',
        md:     'var(--radius-md,    4px)',
        lg:     'var(--radius-lg,    var(--radius, 6px))',
        xl:     'var(--radius-xl,    10px)',
        '2xl':  'calc(var(--radius, 6px) * 2)',
        '3xl':  'calc(var(--radius, 6px) * 3)',
        full:   '9999px',
        // Alias semántico para las bento cards
        bento:  'var(--radius-bento, var(--radius, 6px))',
      },

      // ── CSS Variables extras ─────────────────────────────────────────────────
      // Para usar en `className="text-[var(--accent-color)]"` etc.
      // También expone los tokens como `bg-[--primary-color]` (Tailwind v3.3+)
    },
  },

  plugins: [],
}

export default config