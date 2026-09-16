/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arima: ['Arima', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        sand: {
          bg: '#D8C9B7',
          cream: '#F2E8DA',
          white: '#FAF6EF',
          brown: '#8B7968',
          ink: '#3E3832',
        },
      },
      borderRadius: {
        glass: '36px',
        bubble: '22px',
        pill: '26px',
      },
      boxShadow: {
        glass: '0 20px 60px rgba(80,60,40,0.15)',
        soft: '0 8px 24px rgba(80,60,40,0.10)',
        inner: 'inset 0 1px 1px rgba(255,255,255,0.6)',
      },
      backdropBlur: {
        glass: '24px',
        soft: '12px',
      },
      keyframes: {
        'fade-slide-in': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.94)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'fade-slide-in': 'fade-slide-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.5s ease both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
}
