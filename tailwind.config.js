const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{js,ts,jsx,tsx}', "./public/**/*.html"],
  darkMode: 'media',
  theme: {
    colors: {
      gray: colors.trueGray,
      blue: colors.lightBlue,
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
