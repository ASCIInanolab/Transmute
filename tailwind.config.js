/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f172a",
                primary: "#8b5cf6",
                secondary: "#64748b",
                accent: "#a78bfa",
                surface: "#1e293b",
            },
            animation: {
                'spin-slow': 'spin 8s linear infinite',
                'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { opacity: 1, boxShadow: '0 0 20px #8b5cf6' },
                    '50%': { opacity: .7, boxShadow: '0 0 10px #8b5cf6' },
                }
            }
        },
    },
    plugins: [],
}
