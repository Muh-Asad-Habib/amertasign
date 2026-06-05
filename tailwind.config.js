module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        accent: '#F59E0B',
        surface: '#FFFFFF',
        background: '#F8FAFC',
      },
    },
  },
  plugins: [],
};
