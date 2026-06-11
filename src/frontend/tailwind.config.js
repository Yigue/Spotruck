/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1B5E20', 50: '#E8F5E9', 100: '#C8E6C9', 500: '#388E3C', 700: '#1B5E20', 900: '#0A3A0A' },
        secondary: { DEFAULT: '#212121', 50: '#F5F5F5', 300: '#BDBDBD', 400: '#9E9E9E', 500: '#616161', 900: '#212121' },
        accent: { DEFAULT: '#FF6D00', 50: '#FFF3E0', 500: '#FF6D00', 700: '#E65100' },
        surface: '#FFFFFF',
        background: '#FAFAFA',
        text: { DEFAULT: '#1A1A1A', muted: '#757575' },
        success: '#2E7D32',
        warning: '#F57C00',
        error: '#C62828',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: { 'xs': '12px', 'sm': '14px', 'base': '16px', 'lg': '20px', 'xl': '24px', '2xl': '32px', '3xl': '48px' },
      spacing: { 'xs': '4px', 'sm': '8px', 'md': '16px', 'lg': '24px', 'xl': '32px', '2xl': '48px' },
      borderRadius: { 'sm': '4px', 'DEFAULT': '8px', 'lg': '12px', 'full': '9999px' },
      boxShadow: { 'card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', 'modal': '0 10px 25px rgba(0,0,0,0.15)' },
      transitionDuration: { '150': '150ms', '200': '200ms' },
    },
  },
  plugins: [],
}
