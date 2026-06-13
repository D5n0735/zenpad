import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const hasApi = typeof window !== 'undefined' && window.api

export default function TitleBar({ title, dirty, onRename }) {
  const [maximized, setMaximized] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!hasApi) return
    window.api.isMaximized().then(setMaximized)
  }, [])

  useEffect(() => {
    if (!editing) setDraft(title)
  }, [title, editing])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const minimize = () => hasApi && window.api.minimize()
  const close = () => hasApi && window.api.close()
  const toggle = async () => {
    if (!hasApi) return
    const next = await window.api.toggleMaximize()
    setMaximized(next)
  }

  const beginEdit = () => {
    setDraft(title)
    setEditing(true)
  }
  const commit = () => {
    const name = draft.trim()
    if (name && onRename) onRename(name)
    setEditing(false)
  }
  const cancel = () => {
    setDraft(title)
    setEditing(false)
  }
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  return (
    <div className="drag-region relative flex h-11 shrink-0 items-center justify-between px-4 text-zinc-700 dark:text-zinc-200">
      <div className="flex items-center gap-2.5">
        <div className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 shadow-sm" />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            spellCheck={false}
            className="no-drag w-52 rounded-md border border-rose-400/40 bg-white/70 px-2 py-0.5 text-[13px] font-medium tracking-wide text-zinc-800 outline-none ring-2 ring-rose-400/30 dark:bg-zinc-800/80 dark:text-zinc-100"
          />
        ) : (
          <button
            type="button"
            onClick={beginEdit}
            title="클릭하여 이름 변경"
            className="no-drag select-none rounded-md px-1.5 py-0.5 text-[13px] font-medium tracking-wide opacity-80 transition-colors hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          >
            {title || '무제'}
            {dirty ? ' •' : ''}
          </button>
        )}
      </div>

      <div className="no-drag flex items-center gap-1">
        <WindowButton onClick={minimize} label="최소화">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </WindowButton>
        <WindowButton onClick={toggle} label="최대화">
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
              <path d="M4.6 3V2.2A1 1 0 0 1 5.6 1.2h4.2a1 1 0 0 1 1 1v4.2a1 1 0 0 1-1 1H9" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </WindowButton>
        <WindowButton onClick={close} label="닫기" danger>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </WindowButton>
      </div>
    </div>
  )
}

function WindowButton({ children, onClick, label, danger }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      className={`flex h-7 w-9 items-center justify-center rounded-md text-zinc-600 transition-colors duration-150 dark:text-zinc-300 ${
        danger
          ? 'hover:bg-rose-500 hover:text-white'
          : 'hover:bg-black/10 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </motion.button>
  )
}
