/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#040a1a",
        surface: "#0b1a2f",
        surface2: "#142840",
        indigo: "#635cf1",
        blue: "#38bdf8",
        emerald: "#22c55e",
        amber: "#f59e0b",
        rose: "#f43f5e",
        text: "#e8f0fa",
        muted: "#5e7490",
        dim: "#1a2d42",
      },
    },
  },
  plugins: [],
};
