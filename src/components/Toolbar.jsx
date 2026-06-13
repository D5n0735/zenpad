import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const FONTS = [
  { id: 'myeongjo', label: '나눔명조', className: 'font-myeongjo', sample: '몰입하는 명조' },
  { id: 'gowun', label: '고운바탕', className: 'font-gowun', sample: '감성적인 바탕' },
  { id: 'gothic', label: '노토 고딕', className: 'font-gothic', sample: '깔끔한 고딕' }
]

export default function Toolbar({
  dark,
  onToggleDark,
  font,
  onChangeFont,
  fontSize,
  onChangeFontSize,
  glassOpacity,
  onChangeGlass,
  onApplyRatio,
  onNew,
  onPickBackground,
  onClearBackground,
  hasBackground,
  onSave,
  onSaveAs,
  onOpen
}) {
  return (
    <div className="no-drag flex shrink-0 flex-wrap items-center gap-2 px-4 pb-3 pt-1">
      <ToolButton onClick={onNew} label="새 글">
        <PlusIcon />
        <span>새 글</span>
      </ToolButton>
      <ToolButton onClick={onOpen} label="불러오기">
        <FolderIcon />
        <span>열기</span>
      </ToolButton>
      <ToolButton onClick={onSave} label="저장">
        <SaveIcon />
        <span>저장</span>
      </ToolButton>
      <ToolButton onClick={onSaveAs} label="다른 이름으로 저장">
        <span className="text-[12px]">다른 이름</span>
      </ToolButton>

      <Divider />

      <FontDropdown font={font} onChangeFont={onChangeFont} />
      <FontSizeStepper fontSize={fontSize} onChangeFontSize={onChangeFontSize} />

      <Divider />

      <ToolButton onClick={onPickBackground} label="배경 이미지 선택">
        <ImageIcon />
        <span>배경</span>
      </ToolButton>
      {hasBackground && (
        <ToolButton onClick={onClearBackground} label="배경 제거">
          <span className="text-[12px]">배경 끄기</span>
        </ToolButton>
      )}

      <Divider />

      <GlassDial value={glassOpacity} onChange={onChangeGlass} />

      <Divider />

      <ToolButton onClick={() => onApplyRatio('16:9')} label="가로 16:9 비율">
        <RatioIcon landscape />
        <span className="text-[12px] tabular-nums">16:9</span>
      </ToolButton>
      <ToolButton onClick={() => onApplyRatio('9:14')} label="세로 9:14 비율">
        <RatioIcon />
        <span className="text-[12px] tabular-nums">9:14</span>
      </ToolButton>

      <div className="ml-auto">
        <ThemeToggle dark={dark} onToggle={onToggleDark} />
      </div>
    </div>
  )
}

function FontDropdown({ font, onChangeFont }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = FONTS.find((f) => f.id === font) || FONTS[0]

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white/40 px-3 text-[13px] text-zinc-700 shadow-sm backdrop-blur transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 ${current.className}`}
      >
        {current.label}
        <ChevronIcon open={open} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="absolute z-30 mt-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-white/80 p-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/80"
          >
            {FONTS.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChangeFont(f.id)
                    setOpen(false)
                  }}
                  className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                    f.id === font ? 'bg-black/5 dark:bg-white/10' : ''
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wide text-zinc-400">{f.label}</span>
                  <span className={`${f.className} text-[15px] text-zinc-800 dark:text-zinc-100`}>{f.sample}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

const DIAL_SENSITIVITY = 0.2

function GlassDial({ value, onChange }) {
  const ref = useRef(null)
  const dragRef = useRef(null)
  const [near, setNear] = useState(false)
  const [dragging, setDragging] = useState(false)
  const min = 0
  const max = 100
  const safe = Math.max(min, Math.min(max, value ?? 35))
  const pct = (safe - min) / (max - min)
  const indicatorDeg = 225 + pct * 270
  const accentDeg = pct * 270

  const commit = (next) => {
    const clamped = Math.round(Math.max(min, Math.min(max, next)))
    if (clamped !== safe) onChange(clamped)
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    ref.current.setPointerCapture(e.pointerId)
    setDragging(true)
    dragRef.current = { y: e.clientY, val: safe }
  }
  const onPointerMove = (e) => {
    if (!ref.current || !ref.current.hasPointerCapture(e.pointerId) || !dragRef.current) return
    const dy = dragRef.current.y - e.clientY
    commit(dragRef.current.val + dy * DIAL_SENSITIVITY)
  }
  const onPointerUp = (e) => {
    if (ref.current && ref.current.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId)
    setDragging(false)
    dragRef.current = null
  }
  const onPointerCancel = () => {
    setDragging(false)
    dragRef.current = null
  }
  const onWheel = (e) => {
    e.preventDefault()
    commit(safe + (e.deltaY < 0 ? 1 : -1))
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      commit(safe + 1)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      commit(safe - 1)
    }
  }

  const enlarged = near || dragging

  return (
    <div className="flex items-center gap-1" title="유리 불투명도">
      <div
        onMouseEnter={() => setNear(true)}
        onMouseLeave={() => setNear(false)}
        className="flex items-center justify-center p-2"
      >
        <motion.div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-label="유리 불투명도"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={safe}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          animate={{ scale: enlarged ? 1.22 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
          style={{
            background: `conic-gradient(from 225deg, rgba(251,113,133,0.95) ${accentDeg}deg, rgba(140,140,140,0.28) ${accentDeg}deg 270deg, transparent 270deg 360deg)`
          }}
          className={`relative h-11 w-11 cursor-pointer touch-none rounded-full p-[3px] outline-none transition-shadow ${
            enlarged ? 'shadow-lg shadow-rose-400/20' : 'shadow-sm'
          } focus-visible:ring-2 focus-visible:ring-rose-400/60`}
        >
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-800/85">
            <span className="select-none text-[11px] font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
              {safe}
            </span>
            <span
              style={{ transform: `rotate(${indicatorDeg}deg) translateY(-15px)` }}
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-rose-400 shadow"
            />
          </div>
        </motion.div>
      </div>
      <span className="select-none text-[10px] uppercase tracking-wide text-zinc-400">유리</span>
    </div>
  )
}

function FontSizeStepper({ fontSize, onChangeFontSize }) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-lg border border-black/10 bg-white/40 px-1.5 text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
      <button
        type="button"
        aria-label="글자 작게"
        onClick={() => onChangeFontSize(Math.max(13, fontSize - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10"
      >
        −
      </button>
      <span className="w-9 text-center text-[12px] tabular-nums">{fontSize}px</span>
      <button
        type="button"
        aria-label="글자 크게"
        onClick={() => onChangeFontSize(Math.min(40, fontSize + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10"
      >
        +
      </button>
    </div>
  )
}

function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      type="button"
      aria-label="테마 전환"
      onClick={onToggle}
      className={`relative flex h-9 w-16 items-center rounded-full border px-1 transition-colors duration-500 ${
        dark ? 'border-white/10 bg-indigo-500/30' : 'border-black/10 bg-amber-200/60'
      }`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[14px] shadow-md ${
          dark ? 'ml-auto bg-zinc-900 text-indigo-200' : 'bg-white text-amber-500'
        }`}
      >
        {dark ? '🌙' : '☀️'}
      </motion.div>
    </button>
  )
}

function ToolButton({ children, onClick, label }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="flex h-9 items-center gap-1.5 rounded-lg border border-black/10 bg-white/40 px-3 text-[13px] text-zinc-700 shadow-sm backdrop-blur transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
    >
      {children}
    </motion.button>
  )
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />
}

function ChevronIcon({ open }) {
  return (
    <motion.svg animate={{ rotate: open ? 180 : 0 }} width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

function RatioIcon({ landscape }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      {landscape ? (
        <rect x="1.5" y="4" width="13" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      ) : (
        <rect x="4.5" y="1.5" width="7" height="13" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      )}
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.2 1.4H12.5A1.5 1.5 0 0 1 14 5.9V11A1.5 1.5 0 0 1 12.5 12.5h-9A1.5 1.5 0 0 1 2 11V4.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 2.5h7.5L13.5 5.5V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5 2.5v3h5v-3M5.5 13v-3.2A.8.8 0 0 1 6.3 9h3.4a.8.8 0 0 1 .8.8V13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6.4" r="1.1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M3 11l3.2-3 2.3 2.1L10.8 8l2.2 2.3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
