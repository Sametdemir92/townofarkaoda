import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        night: {
          DEFAULT: "#1a1a2e",
          light: "#16213e",
          dark: "#0f0f23",
        },
        day: {
          DEFAULT: "#f8f4e3",
          light: "#fefcf3",
          dark: "#e8e0c8",
        },
        mafia: {
          DEFAULT: "#dc2626",
          dark: "#991b1b",
        },
        town: {
          DEFAULT: "#2563eb",
          dark: "#1e40af",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-slow": "fadeIn 1.5s ease-in-out",
        "fade-out": "fadeOut 1s ease-in-out forwards",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-up-slow": "slideUp 0.8s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "shake": "shake 0.6s ease-in-out",
        "shake-hard": "shakeHard 0.5s ease-in-out",
        "glitch": "glitch 2s infinite",
        "breathe": "breathe 3s ease-in-out infinite",
        "breathe-red": "breatheRed 3s ease-in-out infinite",
        "drift": "drift 20s linear infinite",
        "drift-reverse": "driftReverse 25s linear infinite",
        "scale-in": "scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "scale-in-slow": "scaleIn 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "blood-drip": "bloodDrip 2s ease-in forwards",
        "spotlight": "spotlight 2s ease-in-out infinite alternate",
        "confetti-fall": "confettiFall 3s ease-in forwards",
        "storm-flash": "stormFlash 0.3s ease-out",
        "rise-up": "riseUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "flicker": "flicker 4s linear infinite",
        "swing": "swing 2s ease-in-out infinite",
        "tombstone": "tombstone 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "count-up": "countUp 0.4s ease-out",
        "reveal-stagger": "revealStagger 0.5s ease-out forwards",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(220, 38, 38, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(220, 38, 38, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 50%, 90%": { transform: "translateX(-4px)" },
          "30%, 70%": { transform: "translateX(4px)" },
        },
        shakeHard: {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "10%": { transform: "translateX(-8px) rotate(-2deg)" },
          "20%": { transform: "translateX(8px) rotate(2deg)" },
          "30%": { transform: "translateX(-6px) rotate(-1deg)" },
          "40%": { transform: "translateX(6px) rotate(1deg)" },
          "50%": { transform: "translateX(-4px) rotate(0deg)" },
          "60%": { transform: "translateX(4px)" },
          "70%": { transform: "translateX(-2px)" },
          "80%": { transform: "translateX(2px)" },
          "90%": { transform: "translateX(-1px)" },
        },
        glitch: {
          "0%, 100%": { textShadow: "2px 0 #ff0000, -2px 0 #00ff00" },
          "25%": { textShadow: "-2px 0 #ff0000, 2px 0 #00ff00" },
          "50%": { textShadow: "2px 2px #ff0000, -2px -2px #00ff00" },
          "75%": { textShadow: "-2px -2px #ff0000, 2px 2px #00ff00" },
        },
        breathe: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(59, 130, 246, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)" },
        },
        breatheRed: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(220, 38, 38, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(220, 38, 38, 0.6)" },
        },
        drift: {
          "0%": { transform: "translateX(-100%) translateY(0)" },
          "50%": { transform: "translateX(50vw) translateY(-20px)" },
          "100%": { transform: "translateX(100vw) translateY(0)" },
        },
        driftReverse: {
          "0%": { transform: "translateX(100vw) translateY(0)" },
          "50%": { transform: "translateX(50vw) translateY(15px)" },
          "100%": { transform: "translateX(-100%) translateY(0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bloodDrip: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        spotlight: {
          "0%": { boxShadow: "0 0 30px rgba(255, 215, 0, 0.2)" },
          "100%": { boxShadow: "0 0 60px rgba(255, 215, 0, 0.5), 0 0 100px rgba(255, 215, 0, 0.2)" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-100vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        stormFlash: {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "0.8" },
        },
        riseUp: {
          "0%": { transform: "translateY(40px) scale(0.95)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "41%": { opacity: "1" },
          "42%": { opacity: "0.8" },
          "43%": { opacity: "1" },
          "45%": { opacity: "0.3" },
          "46%": { opacity: "1" },
        },
        swing: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        tombstone: {
          "0%": { transform: "translateY(100px) rotateX(90deg)", opacity: "0" },
          "60%": { transform: "translateY(-10px) rotateX(0deg)", opacity: "1" },
          "100%": { transform: "translateY(0) rotateX(0deg)", opacity: "1" },
        },
        countUp: {
          "0%": { transform: "scale(1.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        revealStagger: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
export default config
