/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}'
    ],
    theme: {
        extend: {
            colors: {
                bg: 'rgb(var(--bg) / <alpha-value>)',
                surface: 'rgb(var(--surface) / <alpha-value>)',
                'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
                fg: 'rgb(var(--fg) / <alpha-value>)',
                muted: 'rgb(var(--muted) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                accent: {
                    DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
                    hover: 'rgb(var(--accent-hover) / <alpha-value>)',
                    fg: 'rgb(var(--accent-fg) / <alpha-value>)'
                },
                danger: 'rgb(var(--danger) / <alpha-value>)',
                warning: 'rgb(var(--warning) / <alpha-value>)'
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                serif: ['var(--font-instrument-serif)', 'ui-serif', 'Georgia', 'serif'],
                mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'monospace']
            },
            fontSize: {
                'display-xl': ['clamp(3rem, 7vw, 6rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
                'display-lg': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
                'display-md': ['clamp(2rem, 3.5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }]
            },
            borderRadius: {
                xs: '6px',
                sm: '8px',
                DEFAULT: '12px',
                md: '12px',
                lg: '16px',
                xl: '20px'
            },
            boxShadow: {
                hairline: '0 0 0 1px rgb(var(--border))',
                lift: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
                'lift-dark': '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)'
            },
            transitionTimingFunction: {
                premium: 'cubic-bezier(0.22, 1, 0.36, 1)'
            },
            keyframes: {
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '20%, 60%': { transform: 'translateX(-4px)' },
                    '40%, 80%': { transform: 'translateX(4px)' }
                },
                'fade-in': {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 }
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                }
            },
            animation: {
                shake: 'shake 0.4s cubic-bezier(.36,.07,.19,.97)',
                'fade-in': 'fade-in 0.3s ease-out',
                shimmer: 'shimmer 2s linear infinite'
            }
        }
    },
    plugins: []
};
