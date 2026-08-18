import { useEffect, useRef } from 'react'

export default function SearchPanel({
  query,
  onChangeQuery,
  matchCount,
  activeIndex,
  onNext,
  onPrevious,
  onClose
}) {
  const inputRef = useRef(null)
  const current = matchCount > 0 && activeIndex >= 0 ? activeIndex + 1 : 0

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div className="flex h-11 min-w-[310px] items-center gap-1.5 rounded-xl border border-black/10 bg-white/85 px-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/85">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-300">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onChangeQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          } else if (event.key === 'Enter') {
            event.preventDefault()
            if (event.shiftKey) onPrevious()
            else onNext()
          }
        }}
        placeholder="찾기"
        spellCheck={false}
        className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
      />
      <span className="w-14 shrink-0 text-center text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {current}/{matchCount}
      </span>
      <IconButton label="이전 결과" onClick={onPrevious} disabled={!matchCount}>
        <ChevronUpIcon />
      </IconButton>
      <IconButton label="다음 결과" onClick={onNext} disabled={!matchCount}>
        <ChevronDownIcon />
      </IconButton>
      <IconButton label="닫기" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </div>
  )
}

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
        disabled
          ? 'cursor-not-allowed text-zinc-300 dark:text-zinc-600'
          : 'text-zinc-600 hover:bg-black/10 dark:text-zinc-200 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.35" />
      <path d="M10.2 10.2 13.4 13.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M4.5 9.5 8 6l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M4.5 6.5 8 10l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
