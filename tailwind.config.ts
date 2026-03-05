import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        pharmacy: {
          DEFAULT: "hsl(var(--pharmacy))",
          foreground: "hsl(var(--pharmacy-foreground))",
        },
        client: {
          DEFAULT: "hsl(var(--client))",
          foreground: "hsl(var(--client-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "rock-blue": "hsl(var(--color-rock-blue))",
        linen: "hsl(var(--color-linen))",
        /* Brand palette — for gradients & decorative accents only */
        "brand-wine": "hsl(var(--brand-red-wine))",
        "brand-clementine": "hsl(var(--brand-clementine))",
        "brand-green": "hsl(var(--brand-deep-green))",
        "brand-sage": "hsl(var(--brand-sage))",
        "brand-cinnamon": "hsl(var(--brand-cinnamon))",
        "brand-coral": "hsl(var(--brand-coral))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 40px hsl(var(--primary) / 0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "slide-up-fade": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "slide-up-fade": "slide-up-fade 0.6s ease-out forwards",
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        /* Legacy gradients (keep for backward compat) */
        "gradient-primary": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--color-rock-blue)))",
        "gradient-accent": "linear-gradient(135deg, hsl(var(--color-linen)), hsl(var(--color-rock-blue) / 0.5))",
        /* Brand gradients — decorative/CTA only */
        "gradient-hero": "linear-gradient(135deg, hsl(var(--brand-red-wine)), hsl(var(--brand-clementine)))",
        "gradient-cta": "linear-gradient(135deg, hsl(var(--brand-deep-green)), hsl(var(--brand-sage)))",
        "gradient-warm": "linear-gradient(135deg, hsl(var(--brand-cinnamon)), hsl(var(--brand-clementine)))",
        "gradient-soft": "linear-gradient(135deg, hsl(var(--brand-coral) / 0.3), hsl(var(--brand-rock-blue) / 0.3))",
        "gradient-mesh": "radial-gradient(ellipse at 20% 80%, hsl(var(--brand-red-wine) / 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsl(var(--brand-clementine) / 0.12) 0%, transparent 50%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
