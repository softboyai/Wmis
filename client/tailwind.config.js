/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Neutral grays (dark mode palette)
        surface: {
          0: '#0a0a0a',
          1: '#111111',
          2: '#1a1a1a',
          3: '#222222',
          4: '#2a2a2a',
        },
        border: {
          DEFAULT: '#2e2e2e',
          subtle: '#252525',
          strong: '#3a3a3a',
        },
        // Accent - Indigo
        accent: {
          DEFAULT: '#5b6af5',
          hover: '#6e7cf7',
          subtle: 'rgba(91,106,245,0.12)',
          border: 'rgba(91,106,245,0.3)',
        },
        // Semantic
        success: { DEFAULT: '#22c55e', subtle: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
        warning: { DEFAULT: '#f59e0b', subtle: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
        danger: { DEFAULT: '#ef4444', subtle: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
        info: { DEFAULT: '#3b82f6', subtle: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.3)',
        DEFAULT: '0 2px 4px rgba(0,0,0,0.4)',
        md: '0 4px 8px rgba(0,0,0,0.5)',
        lg: '0 8px 16px rgba(0,0,0,0.6)',
        overlay: '0 16px 48px rgba(0,0,0,0.7)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      animation: {
        'slide-in': 'slideIn 150ms ease-out',
        'fade-in': 'fadeIn 150ms ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateX(-8px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        skeleton: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
};
