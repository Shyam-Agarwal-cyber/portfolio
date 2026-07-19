import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1120px' },
    },
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        'surface-raised': 'hsl(var(--surface-raised))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        fg: 'hsl(var(--fg))',
        'fg-secondary': 'hsl(var(--fg-secondary))',
        'fg-muted': 'hsl(var(--fg-muted))',
        accent: 'hsl(var(--accent))',
        'accent-soft': 'hsl(var(--accent-soft))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.75rem, 6vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
      },
      maxWidth: {
        content: '1120px',
      },
      keyframes: {
        'flow-dash': {
          to: { strokeDashoffset: '-16' },
        },
        'accent-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'flow-dash': 'flow-dash 1s linear infinite',
        'accent-pulse': 'accent-pulse 2.4s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
