/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "setup-primary": "#2563EB",
        "setup-indigo": "#4F46E5",
        "setup-success": "#22C55E",
        "setup-heading": "#1E293B",
        "setup-muted": "#64748B",
        "setup-border": "#E5E7EB",
        "setup-page": "#F9FAFB",
      },
    },
  },
  plugins: [],
};
