/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './about-us/**/*.html',
    './chinese/**/*.html',
    './assets/**/*.html',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'luban-red': '#b91c1c',
        'luban-red-dark': '#7f1d1d',
        'luban-gold': '#c58b2b',
        'luban-ink': '#1c1917',
        'luban-muted': '#78716c',
      },
    },
  },
  plugins: [],
}
