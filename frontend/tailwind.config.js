module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // A deep, rich, vibrant navy for sidebars & headers
          navy:    '#1A365D', 
          red:     '#EF4444', 
          // An ultra-vibrant electric blue for active states & primary buttons
          orange:  '#2563EB', 
          yellow:  '#F59E0B', 
          
          // Clean, crisp light tints for backgrounds
          'navy-light':   '#EFF6FF',
          'red-light':    '#FEE2E2',
          'orange-light': '#DBEAFE',
          'yellow-light': '#FEF3C7',
          
          // Deep darks for focus and contrast
          'navy-dark':    '#0F172A',
          'red-dark':     '#DC2626',
          'orange-dark':  '#1D4ED8',
          'yellow-dark':  '#D97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        primary: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    }
  },
  plugins: []
}
