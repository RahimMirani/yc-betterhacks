/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        primary: '#1a1a1a',
        secondary: '#6b7280',
        border: '#e5e7eb',
        code: '#f9fafb',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Inter', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
