/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rojo: {
          DEFAULT: '#C8171E',
          oscuro: '#a01016',
          suave: '#fff5f5',
        },
        negro: '#111111',
        dorado: '#C8A84B',
        gris: {
          claro: '#F5F5F5',
          borde: '#E0E0E0',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
}
