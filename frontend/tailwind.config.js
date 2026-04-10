module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    '#003049',
          red:     '#D62828',
          orange:  '#F77F00',
          yellow:  '#FCBF49',
          // tints
          'navy-light':   '#E6EDF1',
          'red-light':    '#FDEAEA',
          'orange-light': '#FEF0DC',
          'yellow-light': '#FEF9E7',
          // darks
          'navy-dark':    '#001F30',
          'red-dark':     '#B01F1F',
          'orange-dark':  '#D46A00',
          'yellow-dark':  '#E0A800',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: []
}
