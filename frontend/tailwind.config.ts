import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        aila: {
          black: '#0A0A0A',
          'graphite-900': '#141414',
          'graphite-800': '#1E1E1E',
          'graphite-700': '#2A2A2A',
          'graphite-600': '#3A3A3A',
          'graphite-500': '#555555',
          'graphite-400': '#777777',
          'graphite-300': '#999999',
          'graphite-200': '#BBBBBB',
          'graphite-100': '#DDDDDD',
          'cream-100': '#E8E8E4',
          'cream-50': '#F0F0EC',
          cream: '#FAFAF8',
          white: '#FFFFFF',
          cyan: '#34C4F9',
          blue: '#4CB3F6',
          violet: '#8D80EC',
          purple: '#CE4EE1',
          magenta: '#E63DE0',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#60A5FA',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          hover: 'var(--surface-hover)',
        },
        fg: {
          primary: 'var(--fg-primary)',
          secondary: 'var(--fg-secondary)',
          tertiary: 'var(--fg-tertiary)',
        },
        'border-app': 'var(--border-default)',
        bravy: {
          dark: '#0f172a',
          darker: '#020617',
          accent: '#6366f1',
          'accent-light': '#818cf8',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        bpmn: '10px',
        aila: '8px',
      },
      backgroundImage: {
        'aila-gradient':
          'linear-gradient(135deg, #34C4F9 0%, #4CB3F6 25%, #8D80EC 50%, #CE4EE1 75%, #E63DE0 100%)',
      },
      boxShadow: {
        'aila-glow': '0 0 0 1px rgba(141, 128, 236, 0.35), 0 4px 24px -8px rgba(141, 128, 236, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
