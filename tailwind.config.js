/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        surface: '#1e293b',
        surface2: '#273549',
        indigo: '#6366f1',
        emerald: '#10b981',
        amber: '#f59e0b',
        rose: '#f43f5e',
        blue: '#3b82f6',
        text: '#f8fafc',
        muted: '#94a3b8',
        dim: '#475569',
      },
    },
  },
  plugins: [],
};
