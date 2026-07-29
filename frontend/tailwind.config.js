/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f8f4',
          100: '#dcefe2',
          500: '#2f7a4d',
          600: '#256440',
          700: '#1d4f33',
        },
      },
    },
  },
  plugins: [],
};
