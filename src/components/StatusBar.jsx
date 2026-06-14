const FONT_LABELS = {
  myeongjo: '나눔명조',
  gowun: '고운바탕',
  gothic: '노토 고딕',
  inter: 'Inter',
  roboto: 'Roboto',
  lora: 'Lora',
  garamond: 'EB Garamond',
  playfair: 'Playfair Display',
  merriweather: 'Merriweather',
  sourceserif: 'Source Serif',
  caveat: 'Caveat',
  dancing: 'Dancing Script',
  jetbrains: 'JetBrains Mono'
}

export default function StatusBar({ withSpaces, withoutSpaces, lines, font }) {
  const fontLabel = FONT_LABELS[font] || '나눔명조'

  return (
    <div className="no-drag flex select-none items-center justify-between px-7 py-2.5 text-[11px] text-zinc-600 dark:text-zinc-300">
      <span className="tracking-wide opacity-70">{fontLabel}</span>
      <div className="flex items-center gap-4">
        <span className="tabular-nums">{lines}줄</span>
        <span className="h-3 w-px bg-current opacity-20" />
        <span className="tabular-nums">공백 포함 {withSpaces.toLocaleString()}자</span>
        <span className="tabular-nums opacity-70">공백 제외 {withoutSpaces.toLocaleString()}자</span>
      </div>
    </div>
  )
}
