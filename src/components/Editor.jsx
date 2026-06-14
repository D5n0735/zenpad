import { forwardRef, useRef } from 'react'

const FONT_CLASS = {
  myeongjo: 'font-myeongjo',
  gowun: 'font-gowun',
  gothic: 'font-gothic',
  inter: 'font-inter',
  roboto: 'font-roboto',
  lora: 'font-lora',
  garamond: 'font-garamond',
  playfair: 'font-playfair',
  merriweather: 'font-merriweather',
  sourceserif: 'font-sourceserif',
  caveat: 'font-caveat',
  dancing: 'font-dancing',
  jetbrains: 'font-jetbrains'
}

function notePattern(style, dark, fontSize) {
  const line = dark ? 'rgba(255,255,255,0.10)' : 'rgba(64,64,96,0.13)'
  const dot = dark ? 'rgba(255,255,255,0.16)' : 'rgba(64,64,96,0.20)'
  const lh = Math.max(20, Math.round(fontSize * 1.9))
  if (style === 'ruled' || style === 'legal') {
    return {
      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${lh - 1}px, ${line} ${lh - 1}px, ${line} ${lh}px)`,
      backgroundSize: `100% ${lh}px`,
      backgroundPosition: '36px 33px'
    }
  }
  if (style === 'grid') {
    return {
      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 23px, ${line} 23px, ${line} 24px), repeating-linear-gradient(to right, transparent 0, transparent 23px, ${line} 23px, ${line} 24px)`,
      backgroundSize: '24px 24px',
      backgroundPosition: '36px 33px'
    }
  }
  if (style === 'dots') {
    return {
      backgroundImage: `radial-gradient(${dot} 1.3px, transparent 1.4px)`,
      backgroundSize: '22px 22px',
      backgroundPosition: '36px 33px'
    }
  }
  return { backgroundImage: 'none' }
}

function surfaceBase(style, dark, op) {
  if ((style === 'cream' || style === 'legal') && !dark) return `rgba(250, 244, 226, ${op})`
  if ((style === 'cream' || style === 'legal') && dark) return `rgba(38, 35, 28, ${op})`
  return dark ? `rgba(24, 24, 27, ${op})` : `rgba(255, 255, 255, ${op})`
}

const Editor = forwardRef(function Editor(
  {
    value,
    onChange,
    font,
    fontSize,
    dark,
    glassOpacity = 35,
    noteStyle = 'plain',
    hasBackground = false,
    width = '100%',
    height = '100%',
    aspectRatio = null,
    onResize,
    onFocus,
    onBlur
  },
  ref
) {
  const fontClass = FONT_CLASS[font] || FONT_CLASS.myeongjo
  const op = Math.max(0, Math.min(100, glassOpacity)) / 100
  const surfaceColor = surfaceBase(noteStyle, dark, op)
  const showPattern = !hasBackground && noteStyle !== 'plain' && noteStyle !== 'cream'
  const pattern = notePattern(noteStyle, dark, fontSize)
  const cardRef = useRef(null)

  const sizeStyle = aspectRatio
    ? { aspectRatio, height: '100%', width: 'auto', maxWidth: '100%', maxHeight: '100%' }
    : { width, height, minWidth: '320px', minHeight: '220px', maxWidth: '100%', maxHeight: '100%' }

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
        resize: 'both',
        overflow: 'auto',
        ...sizeStyle
      }}
      className="relative flex rounded-2xl border border-white/30 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-2xl dark:border-white/10"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent dark:from-white/5" />
      {showPattern && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl" style={pattern} />
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        spellCheck={false}
        placeholder="여기에 당신의 세계를 적어 내려가세요…"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.9,
          transform: 'translateZ(0)',
          WebkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility'
        }}
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
