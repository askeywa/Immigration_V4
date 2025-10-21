/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // UNIFIED THEME COLORS (Based on Rulebook)
        // ============================================
        
        // Primary Colors (Rulebook)
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626', // Accent Red
          600: '#dc2626', // Accent Red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        // Secondary Colors (Rulebook)
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ea580c', // Accent Orange
          600: '#ea580c', // Accent Orange
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        
        // Neutral Colors (Rulebook)
        neutral: {
          50: '#fafaf8', // Warm White
          100: '#f3f0eb', // Light Beige
          200: '#e5e7eb', // Border Gray
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937', // Dark Gray
          900: '#111827',
        },
        
        // Override default gray with neutral
        gray: {
          50: '#fafaf8', // Warm White
          100: '#f3f0eb', // Light Beige
          200: '#e5e7eb', // Border Gray
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937', // Dark Gray
          900: '#111827',
        },
        
        // System Colors (Fixed)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      
      // ============================================
      // TYPOGRAPHY (Rulebook)
      // ============================================
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        heading: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      
      // ============================================
      // BOX SHADOWS (Rulebook)
      // ============================================
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      
      // ============================================
      // ANIMATIONS (Rulebook)
      // ============================================
      animation: {
        'fade-in': 'fadeIn 300ms ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      
      // ============================================
      // SPACING (Rulebook)
      // ============================================
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};