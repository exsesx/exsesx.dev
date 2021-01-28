const colors = require("tailwindcss/colors");

module.exports = {
  purge: ["./src/pages/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "media", // or 'media' or 'class'
  theme: {
    extend: {},
    colors: {
      transparent: "transparent",
      gray: colors.trueGray,
      blue: colors.lightBlue,
      white: colors.white,
      teal: colors.teal,
    },
  },
  variants: {
    extend: {
      display: ["dark"],
    },
  },
  plugins: [],
};
