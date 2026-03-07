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
        /* Semantic color roles */
        "semantic-primary": {
          DEFAULT: "hsl(var(--semantic-primary))",
          light: "hsl(var(--semantic-primary-light))",
        },
        "semantic-accent": {
          DEFAULT: "hsl(var(--semantic-accent))",
          light: "hsl(var(--semantic-accent-light))",
        },
        "semantic-success": {
          DEFAULT: "hsl(var(--semantic-success))",
          light: "hsl(var(--semantic-success-light))",
        },
        "semantic-warning": {
          DEFAULT: "hsl(var(--semantic-warning))",
          light: "hsl(var(--semantic-warning-light))",
        },
        "semantic-danger": {
          DEFAULT: "hsl(var(--semantic-danger))",
          light: "hsl(var(--semantic-danger-light))",
        },
        /* Legacy — backward compat for marketing site */
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
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Labil Grotesk', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        pixel: ['Pixelated Display', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "elevation-card": "var(--elevation-card)",
        "elevation-card-hover": "var(--elevation-card-hover)",
        "elevation-popover": "var(--elevation-popover)",
        "elevation-modal": "var(--elevation-modal)",
      },
      spacing: {
        "space-1": "var(--space-1)",
        "space-2": "var(--space-2)",
        "space-3": "var(--space-3)",
        "space-4": "var(--space-4)",
        "space-5": "var(--space-5)",
        "space-6": "var(--space-6)",
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
        /* Clay/Attio motion design keyframes */
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 16px hsl(var(--primary) / 0.25)" },
          "50%": { boxShadow: "0 0 32px hsl(var(--primary) / 0.4)" },
        },
        "card-lift": {
          from: { transform: "translateY(0)", boxShadow: "var(--elevation-card)" },
          to: { transform: "translateY(-2px)", boxShadow: "var(--elevation-card-hover)" },
        },
        "sidebar-slide": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "page-enter": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "slide-up-fade": "slide-up-fade 0.6s ease-out forwards",
        "gradient-shift": "gradient-shift 8s ease infinite",
        /* Clay/Attio motion animations */
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "card-lift": "card-lift 0.15s ease-out forwards",
        "sidebar-slide": "sidebar-slide 0.18s ease-out forwards",
        "page-enter": "page-enter 0.25s ease-out forwards",
        "fade-in-scale": "fade-in-scale 0.18s ease-out forwards",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        /* Clay/Attio inspired gradients */
        "gradient-indigo": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--semantic-accent)))",
        "gradient-indigo-soft": "linear-gradient(135deg, hsl(var(--semantic-primary-light)), hsl(var(--semantic-accent-light)))",
        "gradient-success": "linear-gradient(135deg, hsl(var(--success)), hsl(172 60% 40%))",
        "gradient-warm": "linear-gradient(135deg, hsl(var(--warning)), hsl(20 85% 55%))",
        "gradient-danger": "linear-gradient(135deg, hsl(var(--destructive)), hsl(340 80% 55%))",
        /* Legacy gradients (keep for marketing site backward compat) */
        "gradient-primary": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--color-rock-blue)))",
        "gradient-accent": "linear-gradient(135deg, hsl(var(--color-linen)), hsl(var(--color-rock-blue) / 0.5))",
        /* Brand gradients — decorative/CTA only */
        "gradient-hero": "linear-gradient(135deg, hsl(var(--brand-red-wine)), hsl(var(--brand-clementine)))",
        "gradient-cta": "linear-gradient(135deg, hsl(var(--brand-deep-green)), hsl(var(--brand-sage)))",
        "gradient-warm-brand": "linear-gradient(135deg, hsl(var(--brand-cinnamon)), hsl(var(--brand-clementine)))",
        "gradient-soft": "linear-gradient(135deg, hsl(var(--brand-coral) / 0.3), hsl(var(--brand-rock-blue) / 0.3))",
        "gradient-mesh": "radial-gradient(ellipse at 20% 80%, hsl(var(--brand-red-wine) / 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsl(var(--brand-clementine) / 0.12) 0%, transparent 50%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
