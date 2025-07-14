/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"], // <-- This targets the Expo Router 'app' folder
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#030014",
        darkbg: "#151312",
        light: {
          100: "#D6C6FF",
        },
        secondary: "#F4C70D",
        accent: "#2ddcf3",
        muted: "#e6f9fc",
      },
    },
  },
  plugins: [],
};
