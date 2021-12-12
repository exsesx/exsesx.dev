const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {},
    colors: {
      transparent: "transparent",
      gray: colors.neutral,
      blue: colors.sky,
      white: colors.white,
      teal: colors.teal,
      red: colors.red,
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
