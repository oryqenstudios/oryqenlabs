/** Design tokens live in src/index.css (:root) so runtime theming (accent follows the finish) works; Tailwind reads them as CSS variables. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)', line: 'var(--ink-line)' },
        paper: { DEFAULT: 'var(--paper)', 2: 'var(--paper-2)', line: 'var(--paper-line)' },
        cream: 'var(--cream)',
        char: 'var(--char)',
        mute: { DEFAULT: 'var(--mute-d)', light: 'var(--mute-l)' },
        a1: 'var(--a1)',
        a2: 'var(--a2)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['"Instrument Serif"', '"Iowan Old Style"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      transitionTimingFunction: { brand: 'cubic-bezier(.22,1,.36,1)' },
      maxWidth: { page: '1180px' },
    },
  },
  plugins: [],
};
