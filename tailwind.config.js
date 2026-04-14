/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base':       '#f1f5f9',
        'bg-sidebar':    '#ffffff',
        'bg-card':       '#ffffff',
        'bg-card-hover': '#f8fafc',
        'bg-elevated':   '#f8fafc',
        'border-subtle': '#e2e8f0',
        'border-focus':  '#cbd5e1',
        'accent':        '#6366f1',
        'accent-hover':  '#4f46e5',
        'accent-muted':  '#6366f118',
        'violet':        '#8b5cf6',
        'violet-muted':  '#8b5cf618',
        'healthy':       '#10b981',
        'healthy-muted': '#10b98118',
        'warning':       '#f59e0b',
        'warning-muted': '#f59e0b18',
        'critical':      '#ef4444',
        'critical-muted':'#ef444418',
        'text-primary':  '#0f172a',
        'text-body':     '#334155',
        'text-muted':    '#64748b',
        'text-faint':    '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
        'sidebar': '2px 0 8px 0 rgb(0 0 0 / 0.05)',
        'topbar': '0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
