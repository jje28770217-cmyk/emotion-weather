/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
        display: ['Gowun Dodum', 'Pretendard Variable', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#2f3856', soft: '#5a6485', faint: '#8790ab' },
        brand: { DEFAULT: '#5663c7', dark: '#4452b3', light: '#e8eafb' },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(60, 70, 120, 0.25)',
        lift: '0 18px 50px -14px rgba(60, 70, 120, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fade-in .5s ease both',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
