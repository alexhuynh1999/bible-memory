/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Japandi Palette ─────────────────────────────────
        // Warm neutral backgrounds (rice paper feel)
        parchment: {
          50: '#F6F1E8',   // Soft Rice — main bg
          100: '#EAE4DA',  // Warm Linen — surfaces
          200: '#DDD4C6',  // Pale Clay — elevated
          300: '#C9BEAF',  // Washed Taupe — borders
          400: '#B3A899',
          500: '#9E9488',  // Fog — disabled text
          600: '#857B70',
          700: '#6E655C',
          800: '#5B524A',  // Soft Ink
          900: '#4A423C',
        },
        // Primary brand, text, dark-mode surfaces
        warmBrown: {
          50: '#F8F4F0',
          100: '#EDE5DB',
          200: '#DDD0C0',
          300: '#C9B59A',
          400: '#B09878',
          500: '#A07A5C',
          600: '#9C6B4F',  // Clay Brown — PRIMARY
          700: '#5E3E31',  // Deep Umber — hover / pressed
          800: '#2A2622',  // Dark surface (cards in dark mode)
          900: '#1F1C19',  // Dark background
        },
        // Accent — warm sandstone / gold
        amber: {
          50: '#FBF7EE',
          100: '#F5ECDA',
          200: '#EBD9B8',
          300: '#DCC499',
          400: '#C2A878',  // Warm Sandstone — dark-mode primary
          500: '#A89060',
          600: '#8E784C',
          700: '#73613C',
          800: '#5A4C30',
          900: '#433926',
        },
        // Secondary — muted olive / sage
        olive: {
          50: '#F5F6F1',
          100: '#E8EBE0',
          200: '#D2D7C5',
          300: '#B5BDA4',
          400: '#97A285',
          500: '#7A846A',  // Muted Olive
          600: '#636D55',
          700: '#4E5644',
          800: '#3C4235',
          900: '#2D322A',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',   // 12px — Japandi medium
        '2xl': '1rem',     // 16px — Japandi large
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
