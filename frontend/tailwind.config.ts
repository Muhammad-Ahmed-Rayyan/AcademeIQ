import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F1117",
        surface: "#1A1D27",
        border: "#2A2D3A",
        primary: {
          DEFAULT: "#4F8EF7",
          hover: "#6BA3FF",
        },
        success: "#34C77B",
        warning: "#F5A623",
        danger: "#E05252",
        text: {
          primary: "#F0F2F8",
          secondary: "#8B90A7",
          disabled: "#444860",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.4)',
        'md': '0 4px 12px rgba(0,0,0,0.3)',
        'lg': '0 8px 24px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
} satisfies Config;
