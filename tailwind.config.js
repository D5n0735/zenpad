export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        myeongjo: ['"Nanum Myeongjo"', 'serif'],
        gothic: ['"Noto Sans KR"', 'sans-serif'],
        gowun: ['"Gowun Batang"', 'serif'],
        inter: ['"Inter"', '"Noto Sans KR"', 'sans-serif'],
        roboto: ['"Roboto"', '"Noto Sans KR"', 'sans-serif'],
        lora: ['"Lora"', '"Nanum Myeongjo"', 'serif'],
        garamond: ['"EB Garamond"', '"Nanum Myeongjo"', 'serif'],
        playfair: ['"Playfair Display"', '"Nanum Myeongjo"', 'serif'],
        merriweather: ['"Merriweather"', '"Nanum Myeongjo"', 'serif'],
        sourceserif: ['"Source Serif 4"', '"Nanum Myeongjo"', 'serif'],
        caveat: ['"Caveat"', '"Gowun Batang"', 'cursive'],
        dancing: ['"Dancing Script"', '"Gowun Batang"', 'cursive'],
        jetbrains: ['"JetBrains Mono"', '"Noto Sans KR"', 'monospace']
      },
      transitionTimingFunction: {
        glass: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: []
}
