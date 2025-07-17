const { PollingWatchKind } = require("typescript");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"], // <-- This targets the Expo Router 'app' folder
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1F62FF",
        darkbg: "#151312",
        light: {
          100: "#E2EAFF",
          200: "#D6C6FF",
        },
        grayText: "#5C5C5C",
        secondary: "#F4C70D",
        accent: "#2ddcf3",
        muted: "#e6f9fc",
        yellowsh: "#F8B959",
        greensh: "#129489",
        bluesh: "#A9C9FB",
        pinksh: "#F292F1",
        redsh: "#F85959",
        purplesh: "#A259F2",
      },
    },
  },
  plugins: [],
};
