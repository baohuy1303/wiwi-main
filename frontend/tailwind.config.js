import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        aurora: 'aurora 60s linear infinite',
      },
      keyframes: {
        aurora: {
          from: {
            backgroundPosition: '50% 50%, 50% 50%',
          },
          to: {
            backgroundPosition: '350% 50%, 350% 50%',
          },
        },
      },
    },
  },
  darkMode: "class",
  darkMode: "class",
  plugins: [
    heroui({
      prefix: "heroui", // prefix for themes variables
      addCommonColors: false, // override common colors (e.g. "blue", "green", "pink").
      defaultTheme: "dark", // default theme from the themes object
      defaultExtendTheme: "dark", // default theme to extend on custom themes
      layout: {}, // common layout tokens (applied to all themes)
      themes: {
        light: {
          layout: {}, // light theme layout tokens
          colors: {primary: "#0072f5",}, // light theme colors
        },
        dark: {
          layout: {}, // dark theme layout tokens
          colors: {primary: "#0072f5",}, // dark theme colors
        },
         extend: {
      animation: {
        'text-shimmer': 'text-shimmer 2s linear infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
      },
      keyframes: {
        'text-shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in-up': {
            '0%': {
                opacity: '0',
                transform: 'translateY(20px)'
            },
            '100%': {
                opacity: '1',
                transform: 'translateY(0)'
            },
        },
      },
    },
        // ... custom themes
      },
    }),
  ],
}