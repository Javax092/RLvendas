/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#111827",
        panel: "#1f2937",
        brand: "#f97316",
        accent: "#22c55e",
        ink: "#f9fafb",
        muted: "#94a3b8"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(249, 115, 22, 0.22)"
      },
      backgroundImage: {
        "hero-pattern":
          "radial-gradient(circle at top left, rgba(249,115,22,0.28), transparent 30%), radial-gradient(circle at 85% 15%, rgba(34,197,94,0.18), transparent 25%), linear-gradient(180deg, #020617 0%, #111827 45%, #020617 100%)"
      }
    }
  },
  plugins: []
};

