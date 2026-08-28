/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mandi-dark': '#121212',
        'mandi-card': '#1E1E1E',
        'mandi-border': '#2A2A2A',
        'mandi-border-light': '#333333',
        'mandi-green': '#00C851',
        'mandi-green-dark': '#007E33',
        'mandi-green-light': '#00E65C',
        'mandi-green-muted': '#00C85120',
        'mandi-surface': '#252525',
        'mandi-text': '#FFFFFF',
        'mandi-muted': '#B0B0B0',
        'mandi-subtle': '#6B6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-green': 'pulseGreen 2s infinite',
        'bounce-sm': 'bounceSm 1s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 200, 81, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 200, 81, 0)' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'green-gradient': 'linear-gradient(135deg, #00C851 0%, #007E33 100%)',
        'dark-gradient': 'linear-gradient(180deg, #121212 0%, #1a1a1a 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, #1E1E1E 25%, #2A2A2A 50%, #1E1E1E 75%)',
      },
      boxShadow: {
        'green': '0 4px 20px rgba(0, 200, 81, 0.3)',
        'green-lg': '0 8px 40px rgba(0, 200, 81, 0.4)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
