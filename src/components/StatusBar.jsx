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

function formatSeconds(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function StatusBar({
  withSpaces,
  withoutSpaces,
  lines,
  font,
  target,
  progress,
  remaining,
  sessionSeconds,
  autosaveEnabled,
  saving
}) {
  const fontLabel = FONT_LABELS[font] || '나눔명조'

  return (
    <div className="no-drag flex select-none items-center justify-between gap-4 px-7 py-2.5 text-[11px] text-zinc-600 dark:text-zinc-300">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate tracking-wide opacity-70">{fontLabel}</span>
        <span className="h-3 w-px bg-current opacity-20" />
        <span className="tabular-nums opacity-70">집중 {formatSeconds(sessionSeconds)}</span>
        <span className="opacity-70">{autosaveEnabled ? (saving ? '자동저장 중' : '자동저장 켜짐') : '자동저장 꺼짐'}</span>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {target > 0 && (
          <>
            <span className="tabular-nums text-rose-500">{progress}%</span>
            <span className="tabular-nums opacity-70">남은 {remaining.toLocaleString()}자</span>
            <span className="h-3 w-px bg-current opacity-20" />
          </>
        )}
        <span className="tabular-nums">{lines}줄</span>
        <span className="h-3 w-px bg-current opacity-20" />
        <span className="tabular-nums">공백 포함 {withSpaces.toLocaleString()}자</span>
        <span className="tabular-nums opacity-70">공백 제외 {withoutSpaces.toLocaleString()}자</span>
      </div>
    </div>
  )
}
