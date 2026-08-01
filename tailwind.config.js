/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#09080d',
          surface: '#0f0e15',
          card: '#15141f',
          glass: 'rgba(255,255,255,0.02)',
          border: 'rgba(255,255,255,0.05)',
          text: '#e4e8f0',
          muted: '#7d8ba0',
          cyan: '#00e5ff',
          purple: '#7c4dff',
          magenta: '#e040fb',
          green: '#00e676',
          orange: '#ff9100',
          red: '#ff1744',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'glass': '18px',
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0,229,255,0.15)',
        'glow-purple': '0 0 24px rgba(124,77,255,0.15)',
        'glow-magenta': '0 0 24px rgba(224,64,251,0.08)',
        'glow-green': '0 0 24px rgba(0,230,118,0.15)',
        'glow-red': '0 0 24px rgba(255,23,68,0.15)',
        'card': '0 4px 30px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(124,77,255,0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-spin': 'spin 4s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,229,255,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0,229,255,0.4)' },
        }
      }
    },
  },
  plugins: [],
}
