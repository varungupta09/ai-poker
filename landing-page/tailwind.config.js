/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0d12",
        neon: "#62f3ff",
        flare: "#ff7ad9",
        gold: "#ffd166"
      },
      boxShadow: {
        glow: "0 0 40px rgba(98, 243, 255, 0.35)",
        flare: "0 0 40px rgba(255, 122, 217, 0.35)"
      }
    }
  },
  plugins: []
};
