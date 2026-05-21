/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "setup-primary": "#2563EB",
        "setup-success": "#22C55E",
      },
    },
  },
  plugins: [],
};
