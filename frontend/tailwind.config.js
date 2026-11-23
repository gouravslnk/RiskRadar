/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        darkbg: {
          950: '#000000',
          900: '#080808',
          850: '#0d0d0d',
          800: '#141414',
          700: '#222222',
          600: '#333333',
        },
      },
    },
  },
  plugins: [],
}
