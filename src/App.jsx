import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TitleBar from './components/TitleBar.jsx'
import Toolbar from './components/Toolbar.jsx'
import Editor from './components/Editor.jsx'
import StatusBar from './components/StatusBar.jsx'

const api = typeof window !== 'undefined' ? window.api : undefined
const STORE_KEY = 'glass-notes:prefs'
const IDLE_HIDE_MS = 2600

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {}
  } catch {
    return {}
  }
}

export default function App() {
  const saved = loadPrefs()
  const [dark, setDark] = useState(saved.dark ?? true)
  const [font, setFont] = useState(saved.font || 'myeongjo')
  const [fontSize, setFontSize] = useState(saved.fontSize || 19)
  const [background, setBackground] = useState(saved.background || '')
  const [glassOpacity, setGlassOpacity] = useState(saved.glassOpacity ?? 35)
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState(null)
  const [docName, setDocName] = useState('무제')
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState(null)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [editorSize, setEditorSize] = useState({ width: '100%', height: '100%' })

  const editorRef = useRef(null)
  const toastTimer = useRef(null)
  const idleTimer = useRef(null)
  const editorFocused = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [dark])

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ dark, font, fontSize, background, glassOpacity }))
  }, [dark, font, fontSize, background, glassOpacity])

  const flash = useCallback((message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])

  const scheduleHide = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      if (editorFocused.current) setChromeVisible(false)
    }, IDLE_HIDE_MS)
  }, [])

  const revealChrome = useCallback(() => {
    setChromeVisible(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    const onMove = () => revealChrome()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onMove)
    }
  }, [revealChrome])

  const updateContent = (value) => {
    setContent(value)
    setDirty(true)
    setChromeVisible(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }

  const counts = useMemo(() => {
    const withSpaces = content.length
    const withoutSpaces = content.replace(/\s/g, '').length
    const lines = content === '' ? 0 : content.split('\n').length
    return { withSpaces, withoutSpaces, lines }
  }, [content])

  const baseName = (p) => p.split(/[\\/]/).pop()

  const handleSave = useCallback(async () => {
    if (!api) return
    const res = await api.saveFile({ content, currentPath: filePath })
    if (res.canceled) return
    setFilePath(res.path)
    setDocName(baseName(res.path))
    setDirty(false)
    flash('저장되었습니다')
  }, [content, filePath, flash])

  const handleSaveAs = useCallback(async () => {
    if (!api) return
    const res = await api.saveFileAs({ content })
    if (res.canceled) return
    setFilePath(res.path)
    setDocName(baseName(res.path))
    setDirty(false)
    flash('새 파일로 저장했습니다')
  }, [content, flash])

  const handleOpen = useCallback(async () => {
    if (!api) return
    const res = await api.openFile()
    if (res.canceled) return
    setContent(res.content)
    setFilePath(res.path)
    setDocName(baseName(res.path))
    setDirty(false)
    flash('불러왔습니다')
  }, [flash])

  const handleNew = useCallback(() => {
    if (dirty && !window.confirm('저장하지 않은 변경사항이 있습니다. 새 문서를 시작할까요?')) return
    setContent('')
    setFilePath(null)
    setDocName('무제')
    setDirty(false)
    setChromeVisible(true)
    if (editorRef.current) editorRef.current.focus()
    flash('새 문서')
  }, [dirty, flash])

  const applyRatio = useCallback((key) => {
    if (key === '16:9') setEditorSize({ width: '960px', height: '540px' })
    else setEditorSize({ width: '396px', height: '616px' })
  }, [])

  const handlePickBackground = useCallback(async () => {
    if (!api) return
    const res = await api.pickImage()
    if (res.canceled) return
    setBackground(res.dataUrl)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 's' && e.shiftKey) {
        e.preventDefault()
        handleSaveAs()
      } else if (key === 's') {
        e.preventDefault()
        handleSave()
      } else if (key === 'o') {
        e.preventDefault()
        handleOpen()
      } else if (key === 'n') {
        e.preventDefault()
        handleNew()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave, handleSaveAs, handleOpen, handleNew])

  const chromeTransition = { duration: 0.45, ease: [0.4, 0, 0.2, 1] }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer background={background} dark={dark} />

      <motion.div
        animate={{
          paddingTop: chromeVisible ? 104 : 30,
          paddingBottom: chromeVisible ? 48 : 30
        }}
        transition={chromeTransition}
        className="absolute inset-0 z-10 flex items-center justify-center overflow-auto px-5"
      >
        <Editor
          ref={editorRef}
          value={content}
          onChange={updateContent}
          font={font}
          fontSize={fontSize}
          dark={dark}
          glassOpacity={glassOpacity}
          width={editorSize.width}
          height={editorSize.height}
          onResize={setEditorSize}
          onFocus={() => {
            editorFocused.current = true
          }}
          onBlur={() => {
            editorFocused.current = false
            setChromeVisible(true)
          }}
        />
      </motion.div>

      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : -16 }}
        transition={chromeTransition}
        style={{ pointerEvents: chromeVisible ? 'auto' : 'none' }}
        className="absolute inset-x-0 top-0 z-20 text-zinc-900 dark:text-zinc-100"
      >
        <TitleBar title={docName} dirty={dirty} onRename={setDocName} />
        <Toolbar
          dark={dark}
          onToggleDark={() => setDark((v) => !v)}
          font={font}
          onChangeFont={setFont}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
          glassOpacity={glassOpacity}
          onChangeGlass={setGlassOpacity}
          onApplyRatio={applyRatio}
          onNew={handleNew}
          onPickBackground={handlePickBackground}
          onClearBackground={() => setBackground('')}
          hasBackground={!!background}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onOpen={handleOpen}
        />
      </motion.div>

      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : 16 }}
        transition={chromeTransition}
        style={{ pointerEvents: chromeVisible ? 'auto' : 'none' }}
        className="absolute inset-x-0 bottom-0 z-20"
      >
        <StatusBar
          withSpaces={counts.withSpaces}
          withoutSpaces={counts.withoutSpaces}
          lines={counts.lines}
          font={font}
        />
      </motion.div>

      <AnimatePresence>
        {!chromeVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 text-[10px] tracking-widest text-white/90 backdrop-blur"
          >
            FOCUS
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-none absolute bottom-12 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/20 bg-zinc-900/80 px-5 py-2.5 text-[13px] text-white shadow-2xl backdrop-blur-xl dark:bg-white/15"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BackgroundLayer({ background, dark }) {
  return (
    <div className="absolute inset-0 z-0 transition-colors duration-700">
      <AnimatePresence mode="wait">
        <motion.div
          key={background || 'gradient'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-cover bg-center"
          style={
            background
              ? { backgroundImage: `url(${background})` }
              : {
                  backgroundImage: dark
                    ? 'radial-gradient(120% 120% at 20% 0%, #2a2f45 0%, #14161f 55%, #0c0d13 100%)'
                    : 'radial-gradient(120% 120% at 20% 0%, #fbe7d2 0%, #e9d3e4 45%, #d9e2ef 100%)'
                }
          }
        />
      </AnimatePresence>
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          dark ? 'bg-black/35' : 'bg-white/20'
        }`}
      />
    </div>
  )
}
