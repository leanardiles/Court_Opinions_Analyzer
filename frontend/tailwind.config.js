/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cardozo Brand Colors
        'cardozo-blue': '#0071BC',
        'cardozo-dark': '#003C71',
        'cardozo-gold': '#FFB81C',
        
        // Neutral Grays
        'gray': {
          50: '#F5F5F5',
          100: '#E5E5E5',
          600: '#666666',
          900: '#333333',
        },
      },
      fontFamily: {
        'serif': ['Georgia', 'Palatino', 'serif'],
        'sans': ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'nav': '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}