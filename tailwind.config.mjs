/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8B5CF6", // Purple
        secondary: "#FCD34D", // Yellow
        accent: "#EF4444", // Red
        highlight: "#EC4899", // Pink
        background: "#FAFAFA",
        "text-main": "#1F2937",
        "text-sub": "#6B7280",
        "text-muted": "#9CA3AF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        jp: ["var(--font-noto-sans-jp)", "sans-serif"],
      },
      animation: {
        "drop-in": "dropIn 0.5s ease-out",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out infinite 2s",
        "rotate-slow": "rotate 20s linear infinite",
      },
      keyframes: {
        dropIn: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    }
  },
  plugins: []
};


