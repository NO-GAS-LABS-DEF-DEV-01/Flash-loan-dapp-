/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NO_GAS-LABS Color Palette
        'ngl-dark': '#0a0a0a',
        'ngl-darker': '#050505',
        'ngl-teal': '#00ffff',
        'ngl-teal-dark': '#00cccc',
        'ngl-magenta': '#ff00ff',
        'ngl-magenta-dark': '#cc00cc',
        'ngl-gold': '#ffaa00',
        'ngl-gold-dark': '#cc8800',
        'ngl-green': '#00ff00',
        'ngl-red': '#ff0000',
        'ngl-gray': '#333333',
        'ngl-gray-light': '#666666',
      },
      fontFamily: {
        'pixel': ['Courier New', 'monospace'],
        'cyber': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 1.5s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'matrix': 'matrix 20s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': {
            boxShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
          },
          '50%': {
            boxShadow: '0 0 2px #00ffff, 0 0 5px #00ffff, 0 0 8px #00ffff',
          },
        },
        'flicker': {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            opacity: '1',
          },
          '20%, 24%, 55%': {
            opacity: '0.4',
          },
        },
        'glow': {
          'from': {
            textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
          },
          'to': {
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
          },
        },
        'matrix': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      boxShadow: {
        'neon-teal': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
        'neon-magenta': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 15px #ff00ff',
        'neon-gold': '0 0 5px #ffaa00, 0 0 10px #ffaa00, 0 0 15px #ffaa00',
      },
      backdropBlur: {
        'xs': '1px',
      },
    },
  },
  plugins: [],
}