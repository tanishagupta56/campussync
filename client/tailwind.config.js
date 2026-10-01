/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: '#FBFBF9',
          surface: '#F4F4F0',
          card: '#FFFFFF',
          border: '#E8E8E2',
          borderSubtle: '#F0F0EA',
          // Charcoal / Very dark green
          text: '#1A2421',
          textMuted: '#586560',
          textDim: '#85938D',
          // Sage Green (secondary, cards, tags)
          sage: {
            50: '#F5F7F5',
            100: '#E8ECE7',
            200: '#D5DFD4',
            300: '#B8C8B7',
            500: '#7E947D',
            700: '#465A46',
            900: '#2A372A',
          },
          // Jade Green (primary buttons, active nav, key accents)
          jade: {
            50: '#EDF5F1',
            100: '#D7ECE0',
            200: '#B2D8C3',
            500: '#2E7A60',
            600: '#1F5E49',
            700: '#1B4D3E', // Primary Jade
            800: '#153C30', // Darker Jade hover
            900: '#0E2820',
          },
          // Urgency / Status alerts (soft, muted, never neon)
          alert: {
            red: '#D9534F',
            redBg: '#FDF2F1',
            redBorder: '#F7D6D4',
            amber: '#D9822B',
            amberBg: '#FEF8F0',
            amberBorder: '#F9E5CC',
            green: '#2E7A60',
            greenBg: '#EDF5F1',
            greenBorder: '#B2D8C3',
          }
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(26, 36, 33, 0.04), 0 1px 2px 0 rgba(26, 36, 33, 0.02)',
        card: '0 2px 6px 0 rgba(26, 36, 33, 0.05), 0 1px 3px 0 rgba(26, 36, 33, 0.03)',
        elevated: '0 10px 25px -5px rgba(26, 36, 33, 0.08), 0 8px 10px -6px rgba(26, 36, 33, 0.04)',
      },
    },
  },
  plugins: [],
}
