import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './emails/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sage: {
          dark: '#77DA3E',
          DEFAULT: '#ACE433',
          light: '#d2f38d',
          50: '#f6fced',
          100: '#eef8dc',
          200: '#dcf1b9',
          300: '#cae995',
          400: '#ACE433',
          500: '#94cc23',
          600: '#77DA3E',
          700: '#58a82a',
          800: '#3c751b',
          900: '#20400d',
        },
        cream: '#FAF7F2',
        'warm-white': '#FFFEF9',
        earth: {
          DEFAULT: '#8B6F47',
          light: '#B8956A',
          dark: '#6B5035',
        },
        gold: {
          DEFAULT: '#C9A96E',
          light: '#DFC99A',
          dark: '#A08347',
        },
        charcoal: {
          DEFAULT: '#1E1E1D',
          light: '#212022',
          lighter: '#4A4A4A',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-jost)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-jost)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.25' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '2px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(139, 111, 71, 0.12), 0 1px 2px rgba(139, 111, 71, 0.08)',
        'warm': '0 4px 6px rgba(139, 111, 71, 0.10), 0 2px 4px rgba(139, 111, 71, 0.06)',
        'warm-md': '0 10px 15px rgba(139, 111, 71, 0.12), 0 4px 6px rgba(139, 111, 71, 0.07)',
        'warm-lg': '0 20px 25px rgba(139, 111, 71, 0.12), 0 10px 10px rgba(139, 111, 71, 0.06)',
        'warm-xl': '0 25px 50px rgba(139, 111, 71, 0.20)',
        'sage-glow': '0 0 20px rgba(125, 155, 118, 0.25)',
        'gold-glow': '0 0 20px rgba(201, 169, 110, 0.30)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'marquee': 'marquee 30s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      backgroundImage: {
        'gradient-sage': 'linear-gradient(135deg, #4A6741 0%, #7D9B76 100%)',
        'gradient-cream': 'linear-gradient(180deg, #FAF7F2 0%, #FFFEF9 100%)',
        'gradient-earth': 'linear-gradient(135deg, #8B6F47 0%, #C9A96E 100%)',
        'gradient-hero': 'linear-gradient(135deg, #2C2C2C 0%, #4A6741 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
