const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{js,ts,jsx,tsx}', './public/**/*.html'],
  darkMode: 'media',
  theme: {
    colors: {
      transparent: 'transparent',
      gray: colors.trueGray,
      blue: colors.lightBlue,
      white: colors.white,
      teal: colors.teal,
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
