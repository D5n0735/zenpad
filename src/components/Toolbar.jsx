import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const FONT_GROUPS = [
  {
    group: '한글',
    fonts: [
      { id: 'myeongjo', label: '나눔명조', className: 'font-myeongjo', sample: '몰입하는 명조' },
      { id: 'gowun', label: '고운바탕', className: 'font-gowun', sample: '감성적인 바탕' },
      { id: 'gothic', label: '노토 고딕', className: 'font-gothic', sample: '깔끔한 고딕' }
    ]
  },
  {
    group: '영문 · Serif',
    fonts: [
      { id: 'lora', label: 'Lora', className: 'font-lora', sample: 'Echoes of the dawn' },
      { id: 'garamond', label: 'EB Garamond', className: 'font-garamond', sample: 'Echoes of the dawn' },
      { id: 'playfair', label: 'Playfair Display', className: 'font-playfair', sample: 'Echoes of the dawn' },
      { id: 'merriweather', label: 'Merriweather', className: 'font-merriweather', sample: 'Echoes of the dawn' },
      { id: 'sourceserif', label: 'Source Serif', className: 'font-sourceserif', sample: 'Echoes of the dawn' }
    ]
  },
  {
    group: '영문 · Sans',
    fonts: [
      { id: 'inter', label: 'Inter', className: 'font-inter', sample: 'Echoes of the dawn' },
      { id: 'roboto', label: 'Roboto', className: 'font-roboto', sample: 'Echoes of the dawn' }
    ]
  },
  {
    group: '영문 · Script · Mono',
    fonts: [
      { id: 'caveat', label: 'Caveat', className: 'font-caveat', sample: 'Echoes of the dawn' },
      { id: 'dancing', label: 'Dancing Script', className: 'font-dancing', sample: 'Echoes of the dawn' },
      { id: 'jetbrains', label: 'JetBrains Mono', className: 'font-jetbrains', sample: 'Echoes of the dawn' }
    ]
  }
]

const ALL_FONTS = FONT_GROUPS.flatMap((g) => g.fonts)

const NOTE_STYLES = [
  { id: 'plain', label: '무지' },
  { id: 'ruled', label: '괘선' },
  { id: 'grid', label: '모눈' },
  { id: 'dots', label: '점선' },
  { id: 'cream', label: '크림지' },
  { id: 'legal', label: '리갈패드' }
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
  noteStyle,
  onChangeNoteStyle,
  ratioEnabled,
  onToggleRatioEnabled,
  customRatios,
  onApplyRatio,
  onAddRatio,
  onRemoveRatio,
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

      <Popover hover align="left" panelWidth="w-44" trigger={<FileIcon />} triggerLabel="파일">
        {({ close }) => (
          <div className="p-1">
            <MenuItem onClick={() => { onOpen(); close() }} icon={<FolderIcon />} label="불러오기" hint="Ctrl+O" />
            <MenuItem onClick={() => { onSave(); close() }} icon={<SaveIcon />} label="저장" hint="Ctrl+S" />
            <MenuItem onClick={() => { onSaveAs(); close() }} icon={<SaveAsIcon />} label="다른 이름으로 저장" hint="Ctrl+⇧S" />
          </div>
        )}
      </Popover>

      <Divider />

      <FontDropdown font={font} onChangeFont={onChangeFont} />
      <FontSizeStepper fontSize={fontSize} onChangeFontSize={onChangeFontSize} />

      <Divider />

      <Popover hover align="left" panelWidth="w-44" trigger={<ImageIcon />} triggerLabel="배경">
        {({ close }) => (
          <div className="p-1">
            <MenuItem onClick={() => { onPickBackground(); close() }} icon={<ImageIcon />} label="배경 이미지 선택" />
            <MenuItem
              onClick={() => { onClearBackground(); close() }}
              icon={<EraseIcon />}
              label="배경 끄기"
              disabled={!hasBackground}
            />
          </div>
        )}
      </Popover>

      <Popover align="left" panelWidth="w-48" trigger={<NoteIcon />} triggerLabel="노트 양식">
        {({ close }) => (
          <div className="p-1">
            <div className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-wide text-zinc-400">노트 양식</div>
            <div className="grid grid-cols-2 gap-1">
              {NOTE_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onChangeNoteStyle(s.id); close() }}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                    noteStyle === s.id
                      ? 'border-rose-400/60 bg-rose-400/10'
                      : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
                  }`}
                >
                  <NoteSwatch id={s.id} dark={dark} />
                  <span className="text-[11px] text-zinc-700 dark:text-zinc-200">{s.label}</span>
                </button>
              ))}
            </div>
            {hasBackground && (
              <div className="px-2 pb-1 pt-1.5 text-[10px] text-zinc-400">배경 이미지가 켜져 있을 땐 적용되지 않습니다</div>
            )}
          </div>
        )}
      </Popover>

      <Divider />

      <GlassDial value={glassOpacity} onChange={onChangeGlass} />

      <Popover align="left" panelWidth="w-60" trigger={<GearIcon />} triggerLabel="옵션">
        {() => (
          <OptionsPanel
            ratioEnabled={ratioEnabled}
            onToggleRatioEnabled={onToggleRatioEnabled}
            customRatios={customRatios}
            onApplyRatio={onApplyRatio}
            onAddRatio={onAddRatio}
            onRemoveRatio={onRemoveRatio}
          />
        )}
      </Popover>

      <div className="ml-auto">
        <ThemeToggle dark={dark} onToggle={onToggleDark} />
      </div>
    </div>
  )
}

function Popover({ trigger, triggerLabel, children, hover, align = 'left', panelWidth = 'w-44' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const scheduleClose = () => {
    if (!hover) return
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={hover ? () => { cancelClose(); setOpen(true) } : undefined}
      onMouseLeave={scheduleClose}
    >
      <motion.button
        type="button"
        aria-label={triggerLabel}
        title={triggerLabel}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white/40 text-zinc-700 shadow-sm backdrop-blur transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 ${
          open ? 'bg-white/70 dark:bg-white/15' : ''
        }`}
      >
        {trigger}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className={`absolute z-40 mt-1.5 ${align === 'right' ? 'right-0' : 'left-0'} ${panelWidth} overflow-hidden rounded-xl border border-black/10 bg-white/85 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/85`}
          >
            {children({ close: () => setOpen(false) })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({ onClick, icon, label, hint, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
        disabled
          ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-500'
          : 'text-zinc-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
      }`}
    >
      <span className="text-zinc-500 dark:text-zinc-300">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[10px] tabular-nums text-zinc-400">{hint}</span>}
    </button>
  )
}

function OptionsPanel({ ratioEnabled, onToggleRatioEnabled, customRatios, onApplyRatio, onAddRatio, onRemoveRatio }) {
  const [w, setW] = useState('16')
  const [h, setH] = useState('9')

  const submit = () => {
    const nw = parseInt(w, 10)
    const nh = parseInt(h, 10)
    if (nw > 0 && nh > 0) onAddRatio(nw, nh)
  }

  return (
    <div className="p-2.5">
      <button
        type="button"
        onClick={onToggleRatioEnabled}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-[13px] text-zinc-700 dark:text-zinc-200"
      >
        <span>고정 비율 활성화</span>
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${
            ratioEnabled ? 'bg-rose-400/80' : 'bg-black/15 dark:bg-white/15'
          }`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${ratioEnabled ? 'right-0.5' : 'left-0.5'}`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {ratioEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 border-t border-black/10 pt-2 dark:border-white/10">
              <div className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-400">고정 비율 만들기</div>
              <div className="flex items-center gap-1.5">
                <input
                  value={w}
                  onChange={(e) => setW(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  aria-label="가로 비율"
                  className="w-12 rounded-md border border-black/10 bg-white/70 px-2 py-1 text-center text-[13px] tabular-nums text-zinc-800 outline-none dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-100"
                />
                <span className="text-zinc-400">:</span>
                <input
                  value={h}
                  onChange={(e) => setH(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  aria-label="세로 비율"
                  className="w-12 rounded-md border border-black/10 bg-white/70 px-2 py-1 text-center text-[13px] tabular-nums text-zinc-800 outline-none dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={submit}
                  className="ml-auto rounded-md bg-rose-400/90 px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-rose-400"
                >
                  만들기
                </button>
              </div>

              <div className="mb-1.5 mt-2.5 text-[10px] uppercase tracking-wide text-zinc-400">저장된 비율</div>
              {customRatios.length === 0 ? (
                <div className="px-1 py-1 text-[11px] text-zinc-400">아직 만든 비율이 없습니다</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {customRatios.map((r) => (
                    <span
                      key={r.id}
                      className="group flex items-center gap-1 rounded-md border border-black/10 bg-white/60 py-1 pl-2 pr-1 text-[12px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                    >
                      <button type="button" onClick={() => onApplyRatio(r.w, r.h)} className="tabular-nums hover:text-rose-500">
                        {r.w}:{r.h}
                      </button>
                      <button
                        type="button"
                        aria-label="비율 삭제"
                        onClick={() => onRemoveRatio(r.id)}
                        className="flex h-4 w-4 items-center justify-center rounded text-zinc-400 hover:bg-rose-500/15 hover:text-rose-500"
                      >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M2 2l5 5M7 2l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FontDropdown({ font, onChangeFont }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = ALL_FONTS.find((f) => f.id === font) || ALL_FONTS[0]

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
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="absolute z-40 mt-2 max-h-80 w-52 overflow-y-auto rounded-xl border border-black/10 bg-white/85 p-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/85"
          >
            {FONT_GROUPS.map((g) => (
              <div key={g.group}>
                <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-wide text-zinc-400">{g.group}</div>
                {g.fonts.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { onChangeFont(f.id); setOpen(false) }}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                      f.id === font ? 'bg-black/5 dark:bg-white/10' : ''
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400">{f.label}</span>
                    <span className={`${f.className} text-[15px] text-zinc-800 dark:text-zinc-100`}>{f.sample}</span>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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

const DIAL_RANGE = 270

function GlassDial({ value, onChange }) {
  const ref = useRef(null)
  const dragRef = useRef(null)
  const [near, setNear] = useState(false)
  const [dragging, setDragging] = useState(false)
  const min = 0
  const max = 100
  const safe = Math.max(min, Math.min(max, value ?? 35))
  const pct = (safe - min) / (max - min)
  const indicatorDeg = 225 + pct * DIAL_RANGE
  const accentDeg = pct * DIAL_RANGE

  const commit = (next) => {
    const clamped = Math.round(Math.max(min, Math.min(max, next)))
    if (clamped !== safe) onChange(clamped)
  }

  const angleAt = (cx, cy, x, y) => (Math.atan2(y - cy, x - cx) * 180) / Math.PI

  const onPointerDown = (e) => {
    e.preventDefault()
    ref.current.setPointerCapture(e.pointerId)
    setDragging(true)
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    dragRef.current = { cx, cy, prev: angleAt(cx, cy, e.clientX, e.clientY), val: safe }
  }
  const onPointerMove = (e) => {
    if (!ref.current || !ref.current.hasPointerCapture(e.pointerId) || !dragRef.current) return
    const d = dragRef.current
    const cur = angleAt(d.cx, d.cy, e.clientX, e.clientY)
    let delta = cur - d.prev
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    d.prev = cur
    d.val = Math.max(min, Math.min(max, d.val + (delta / DIAL_RANGE) * (max - min)))
    commit(d.val)
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
    <div className="flex items-center gap-1" title="유리 불투명도 (드래그하여 회전)">
      <div onMouseEnter={() => setNear(true)} onMouseLeave={() => setNear(false)} className="flex items-center justify-center p-2">
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
          className={`relative h-11 w-11 cursor-grab touch-none rounded-full p-[3px] outline-none transition-shadow active:cursor-grabbing ${
            enlarged ? 'shadow-lg shadow-rose-400/20' : 'shadow-sm'
          } focus-visible:ring-2 focus-visible:ring-rose-400/60`}
        >
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-800/85">
            <span className="select-none text-[11px] font-medium tabular-nums text-zinc-700 dark:text-zinc-200">{safe}</span>
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

function NoteSwatch({ id, dark }) {
  const line = dark ? 'rgba(255,255,255,0.35)' : 'rgba(60,60,90,0.4)'
  const base = dark ? '#2a2d35' : '#ffffff'
  const cream = dark ? '#2a2720' : '#faf4e2'
  let bg = base
  let image = 'none'
  let size = 'auto'
  if (id === 'ruled' || id === 'legal') {
    if (id === 'legal') bg = cream
    image = `repeating-linear-gradient(to bottom, transparent 0, transparent 4px, ${line} 4px, ${line} 5px)`
    size = '100% 5px'
  } else if (id === 'grid') {
    image = `repeating-linear-gradient(to bottom, transparent 0, transparent 4px, ${line} 4px, ${line} 5px), repeating-linear-gradient(to right, transparent 0, transparent 4px, ${line} 4px, ${line} 5px)`
    size = '5px 5px'
  } else if (id === 'dots') {
    image = `radial-gradient(${line} 0.8px, transparent 0.9px)`
    size = '5px 5px'
  } else if (id === 'cream') {
    bg = cream
  }
  return (
    <span
      className="block h-7 w-full rounded-md border border-black/10 dark:border-white/15"
      style={{ background: bg, backgroundImage: image, backgroundSize: size }}
    />
  )
}

function ChevronIcon({ open }) {
  return (
    <motion.svg animate={{ rotate: open ? 180 : 0 }} width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2.2h5l3 3V13a.8.8 0 0 1-.8.8H4a.8.8 0 0 1-.8-.8V3a.8.8 0 0 1 .8-.8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 2.2V5.2h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
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

function SaveAsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 2.5h6L12.5 6V9" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 2.5v10.5a.5.5 0 0 0 .5.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M11.5 9.5v5M9 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6.4" r="1.1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M3 11l3.2-3 2.3 2.1L10.8 8l2.2 2.3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function EraseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 12L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2.5" width="10" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 1.8v1.6M8 12.6v1.6M2.4 8H1M15 8h-1.4M3.9 3.9l1.1 1.1M11 11l1.1 1.1M12.1 3.9 11 5M5 11l-1.1 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
