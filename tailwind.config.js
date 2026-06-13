export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        myeongjo: ['"Nanum Myeongjo"', 'serif'],
        gothic: ['"Noto Sans KR"', 'sans-serif'],
        gowun: ['"Gowun Batang"', 'serif']
      },
      transitionTimingFunction: {
        glass: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: []
}
