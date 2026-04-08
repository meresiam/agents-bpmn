/**
 * Valores da escala default `zinc` do Tailwind (v3.4).
 * Use classes `zinc-*` no JSX; estes hex só onde a API exige string (React Flow, html-to-image).
 */
export const ZINC = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
} as const;

/** Cores de diagrama alinhadas a `zinc-*` (sequence flow, markers, fundo de label). */
export const diagramInline = {
  edge: ZINC[600],
  marker: ZINC[800],
  labelFill: ZINC[800],
  labelBg: ZINC[50],
  dot: ZINC[400],
  minimapNode: ZINC[200],
} as const;
