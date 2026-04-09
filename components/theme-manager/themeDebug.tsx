'use client'
// components/theme-manager/ThemeDebug.tsx
// ─── Panel de debug: muestra variables CSS activas en el DOM ─────────────────

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from './themeProvider'

// Variables CSS que queremos inspeccionar
const WATCHED_VARS = [
  '--primary',
  '--primary-color',
  '--secondary-color',
  '--accent-color',
  '--background',
  '--foreground',
  '--radius',
  '--radius-bento',
  '--font-sans',
  '--font-serif',
  '--font-display',
  '--font-main',
  '--font-heading',
] as const

type WatchedVar = typeof WATCHED_VARS[number]

function readCssVar(name: WatchedVar): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim() || '(not set)'
}

function isColor(value: string): boolean {
  return (
    value.startsWith('#') ||
    value.startsWith('rgb') ||
    value.startsWith('hsl') ||
    value.startsWith('oklch')
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ThemeDebugProps {
  /** Solo visible en development por defecto */
  forceShow?: boolean
}

export function ThemeDebug({ forceShow = false }: ThemeDebugProps) {
  const { config, projectKey, source, isLoading } = useTheme()
  const [vars, setVars]       = useState<Record<WatchedVar, string>>({} as any)
  const [open, setOpen]       = useState(false)
  const [copied, setCopied]   = useState(false)
  const [mounted, setMounted] = useState(false)

  const isDev = process.env.NODE_ENV === 'development'
  const show  = forceShow || isDev

  const refreshVars = useCallback(() => {
    const snapshot = {} as Record<WatchedVar, string>
    for (const v of WATCHED_VARS) {
      snapshot[v] = readCssVar(v)
    }
    setVars(snapshot)
  }, [])

  useEffect(() => {
    setMounted(true)
    refreshVars()
  }, [config, refreshVars])

  if (!show || !mounted) return null

  const sourceColors: Record<string, string> = {
    api:      '#22c55e',
    cache:    '#3b82f6',
    fallback: '#f59e0b',
    loading:  '#94a3b8',
  }

  const handleCopy = async () => {
    const text = WATCHED_VARS
      .map((v) => `${v}: ${vars[v]}`)
      .join('\n')
    await navigator.clipboard.writeText(`:root {\n${text}\n}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        position:   'fixed',
        bottom:     '1rem',
        right:      '1rem',
        zIndex:     9999,
        fontFamily: 'monospace',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display:         'flex',
          alignItems:      'center',
          gap:             '6px',
          padding:         '6px 12px',
          borderRadius:    '8px',
          border:          '1px solid rgba(255,255,255,0.15)',
          background:      'rgba(15,15,15,0.92)',
          color:           '#e2e8f0',
          fontSize:        '11px',
          fontWeight:      600,
          cursor:          'pointer',
          backdropFilter:  'blur(12px)',
          boxShadow:       '0 4px 24px rgba(0,0,0,0.4)',
          letterSpacing:   '0.05em',
          textTransform:   'uppercase',
        }}
      >
        <span style={{
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          background:   sourceColors[source] ?? '#94a3b8',
          flexShrink:   0,
          boxShadow:    `0 0 6px ${sourceColors[source] ?? '#94a3b8'}`,
        }} />
        🎨 Theme
        <span style={{
          padding:      '1px 6px',
          borderRadius: '4px',
          background:   'rgba(255,255,255,0.08)',
          fontSize:     '10px',
        }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position:       'absolute',
            bottom:         'calc(100% + 8px)',
            right:          0,
            width:          '340px',
            maxHeight:      '520px',
            overflowY:      'auto',
            borderRadius:   '12px',
            border:         '1px solid rgba(255,255,255,0.1)',
            background:     'rgba(10,10,10,0.96)',
            backdropFilter: 'blur(20px)',
            boxShadow:      '0 8px 40px rgba(0,0,0,0.6)',
            color:          '#e2e8f0',
            fontSize:       '11px',
          }}
        >
          {/* Header */}
          <div style={{
            padding:      '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display:      'flex',
            justifyContent: 'space-between',
            alignItems:   'center',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#f8fafc' }}>
                Theme Inspector
              </div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>
                key: <span style={{ color: '#94a3b8' }}>{projectKey}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Source badge */}
              <span style={{
                padding:      '2px 8px',
                borderRadius: '20px',
                background:   `${sourceColors[source]}20`,
                color:        sourceColors[source],
                border:       `1px solid ${sourceColors[source]}40`,
                fontSize:     '10px',
                fontWeight:   700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {isLoading ? '⟳ loading' : source}
              </span>
              {/* Refresh */}
              <button
                onClick={refreshVars}
                title="Refresh variables"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border:     '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color:      '#94a3b8',
                  cursor:     'pointer',
                  padding:    '3px 7px',
                  fontSize:   '12px',
                }}
              >
                ↺
              </button>
              {/* Copy */}
              <button
                onClick={handleCopy}
                title="Copy as CSS"
                style={{
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                  border:     `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  color:      copied ? '#22c55e' : '#94a3b8',
                  cursor:     'pointer',
                  padding:    '3px 7px',
                  fontSize:   '11px',
                }}
              >
                {copied ? '✓' : '⎘'}
              </button>
            </div>
          </div>

          {/* Variables list */}
          <div style={{ padding: '8px 0' }}>
            {WATCHED_VARS.map((varName) => {
              const value   = vars[varName] ?? '…'
              const isColor = value !== '(not set)' && value !== '…' && isColorValue(value)

              return (
                <div
                  key={varName}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         '10px',
                    padding:     '5px 14px',
                    transition:  'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Color swatch or placeholder */}
                  <div style={{
                    width:        '18px',
                    height:       '18px',
                    borderRadius: '4px',
                    background:   isColor ? value : 'rgba(255,255,255,0.05)',
                    border:       '1px solid rgba(255,255,255,0.12)',
                    flexShrink:   0,
                    fontSize:     isColor ? '0' : '10px',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    color:        '#475569',
                  }}>
                    {!isColor && (value !== '(not set)' ? '—' : '·')}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#7c6af7', fontSize: '10px', letterSpacing: '0.02em' }}>
                      {varName}
                    </div>
                    <div style={{
                      color:        value === '(not set)' ? '#334155' : '#cbd5e1',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                      fontSize:     '11px',
                      marginTop:    '1px',
                    }}>
                      {value}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Config JSON footer */}
          <details style={{
            borderTop:  '1px solid rgba(255,255,255,0.06)',
            padding:    '10px 14px',
          }}>
            <summary style={{
              cursor:     'pointer',
              color:      '#475569',
              fontSize:   '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              userSelect: 'none',
            }}>
              Raw config JSON
            </summary>
            <pre style={{
              marginTop:  '8px',
              fontSize:   '10px',
              color:      '#64748b',
              overflow:   'auto',
              maxHeight:  '150px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              padding:    '8px',
              lineHeight: 1.5,
            }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

function isColorValue(value: string): boolean {
  return (
    value.startsWith('#')   ||
    value.startsWith('rgb') ||
    value.startsWith('hsl') ||
    value.startsWith('oklch')
  )
}