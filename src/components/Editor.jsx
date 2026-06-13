import { forwardRef, useRef } from 'react'

const FONT_CLASS = {
  myeongjo: 'font-myeongjo',
  gowun: 'font-gowun',
  gothic: 'font-gothic'
}

const Editor = forwardRef(function Editor(
  {
    value,
    onChange,
    font,
    fontSize,
    dark,
    glassOpacity = 35,
    width = '100%',
    height = '100%',
    onResize,
    onFocus,
    onBlur
  },
  ref
) {
  const fontClass = FONT_CLASS[font] || FONT_CLASS.myeongjo
  const op = Math.max(0, Math.min(100, glassOpacity)) / 100
  const surfaceColor = dark ? `rgba(24, 24, 27, ${op})` : `rgba(255, 255, 255, ${op})`
  const cardRef = useRef(null)

  const startResize = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startW = rect.width
    const startH = rect.height
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const move = (ev) => {
      const w = Math.max(320, startW + (ev.clientX - startX))
      const h = Math.max(220, startH + (ev.clientY - startY))
      if (onResize) onResize({ width: `${Math.round(w)}px`, height: `${Math.round(h)}px` })
    }
    const up = (ev) => {
      handle.releasePointerCapture(ev.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={cardRef}
      style={{
        backgroundColor: surfaceColor,
        width,
        height,
        resize: 'both',
        overflow: 'auto',
        minWidth: '320px',
        minHeight: '220px',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      className="relative flex rounded-2xl border border-white/30 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-2xl dark:border-white/10"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent dark:from-white/5" />
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        spellCheck={false}
        placeholder="여기에 당신의 세계를 적어 내려가세요…"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.9 }}
        className={`editor-surface relative z-10 h-full w-full bg-transparent px-9 py-8 text-zinc-800 caret-rose-400 outline-none placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-400 ${fontClass}`}
      />
      <div
        onPointerDown={startResize}
        title="드래그하여 크기 조절"
        className="no-drag absolute bottom-1.5 right-1.5 z-20 flex h-5 w-5 cursor-nwse-resize items-end justify-end rounded-md text-zinc-500/70 hover:text-rose-400 dark:text-zinc-300/60"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M3 10L10 3M6 10L10 6M9 10L10 9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
})

export default Editor
