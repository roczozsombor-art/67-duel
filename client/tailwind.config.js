/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00ff88',
          cyan: '#00d4ff',
          pink: '#ff0080',
          yellow: '#ffff00',
        },
        dark: {
          bg: '#0a0a0f',
          card: '#0f0f1a',
          border: '#1a1a2e',
          surface: '#12121f',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glow-green': 'glowGreen 1.5s ease-in-out infinite alternate',
        'glow-cyan': 'glowCyan 1.5s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradientX 4s ease infinite',
        'spin-slow': 'spin 4s linear infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { textShadow: '0 0 5px #00ff88, 0 0 20px #00ff88, 0 0 40px #00ff88' },
          '50%': { textShadow: '0 0 2px #00ff88, 0 0 8px #00ff88' },
        },
        glowGreen: {
          from: { boxShadow: '0 0 5px #00ff88, 0 0 20px #00ff88' },
          to: { boxShadow: '0 0 10px #00ff88, 0 0 40px #00ff88, 0 0 80px #00ff8866' },
        },
        glowCyan: {
          from: { boxShadow: '0 0 5px #00d4ff, 0 0 20px #00d4ff' },
          to: { boxShadow: '0 0 10px #00d4ff, 0 0 40px #00d4ff, 0 0 80px #00d4ff66' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
};
