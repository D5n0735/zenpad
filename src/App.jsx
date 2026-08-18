import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TitleBar from './components/TitleBar.jsx'
import Toolbar from './components/Toolbar.jsx'
import Editor from './components/Editor.jsx'
import StatusBar from './components/StatusBar.jsx'
import ProjectSidebar from './components/ProjectSidebar.jsx'
import MarkdownPreview from './components/MarkdownPreview.jsx'
import SearchPanel from './components/SearchPanel.jsx'
import usePreferences from './hooks/usePreferences.js'
import useLibrary from './hooks/useLibrary.js'
import useEditorStats from './hooks/useEditorStats.js'
import useWritingStats from './hooks/useWritingStats.js'
import useFocusSession from './hooks/useFocusSession.js'
import { htmlDocument } from './lib/markdown.js'

const api = typeof window !== 'undefined' ? window.api : undefined
const IDLE_HIDE_MS = 2600
const FALLBACK_DRAFT_KEY = 'zenpad:draft:v1'

function baseName(path) {
  return String(path || '').split(/[\\/]/).pop()
}

function resultOk(result) {
  return result && result.ok !== false
}

function fallbackReadDraft() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_DRAFT_KEY) || 'null')
  } catch {
    return null
  }
}

function fallbackWriteDraft(draft) {
  localStorage.setItem(FALLBACK_DRAFT_KEY, JSON.stringify(draft))
}

function fallbackClearDraft() {
  localStorage.removeItem(FALLBACK_DRAFT_KEY)
}

function findMatches(text, query) {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return []

  const source = text.toLocaleLowerCase()
  const matches = []
  let cursor = 0
  while (cursor < source.length) {
    const index = source.indexOf(needle, cursor)
    if (index === -1) break
    matches.push({ start: index, end: index + needle.length })
    cursor = index + needle.length
  }
  return matches
}

function exportFontFamily(font) {
  const stacks = {
    myeongjo: '"Nanum Myeongjo", serif',
    gowun: '"Gowun Batang", serif',
    gothic: '"Noto Sans KR", sans-serif',
    inter: '"Inter", "Noto Sans KR", sans-serif',
    roboto: '"Roboto", "Noto Sans KR", sans-serif',
    lora: '"Lora", "Nanum Myeongjo", serif',
    garamond: '"EB Garamond", "Nanum Myeongjo", serif',
    playfair: '"Playfair Display", "Nanum Myeongjo", serif',
    merriweather: '"Merriweather", "Nanum Myeongjo", serif',
    sourceserif: '"Source Serif 4", "Nanum Myeongjo", serif',
    caveat: '"Caveat", "Gowun Batang", cursive',
    dancing: '"Dancing Script", "Gowun Batang", cursive',
    jetbrains: '"JetBrains Mono", "Noto Sans KR", monospace'
  }
  return stacks[font] || stacks.myeongjo
}

export default function App() {
  const { prefs, setPref, updatePrefs } = usePreferences()
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState(null)
  const [docName, setDocName] = useState('무제')
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState(null)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [editorRatio, setEditorRatio] = useState(null)
  const [activeDoc, setActiveDoc] = useState({ type: 'chapter' })
  const [editorActive, setEditorActive] = useState(false)
  const [autosaveSaving, setAutosaveSaving] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchIndex, setActiveSearchIndex] = useState(0)
  const [searchCommitted, setSearchCommitted] = useState(false)

  const editorRef = useRef(null)
  const toastTimer = useRef(null)
  const idleTimer = useRef(null)
  const editorFocused = useRef(false)
  const dirtyRef = useRef(dirty)
  const activeDocRef = useRef(activeDoc)

  const flash = useCallback((message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])

  const library = useLibrary(api, flash)
  const documentKey = useMemo(() => {
    if (activeDoc.type === 'chapter') return `chapter:${library.activeProjectId}:${library.activeChapterId}`
    return `${activeDoc.type}:${filePath || docName}`
  }, [activeDoc.type, docName, filePath, library.activeChapterId, library.activeProjectId])
  const counts = useEditorStats(content, prefs.targetCount)
  const writingStats = useWritingStats(content, documentKey)
  const focusSession = useFocusSession(editorActive, writingStats.recordSession)
  const searchMatches = useMemo(() => findMatches(content, searchQuery), [content, searchQuery])

  useEffect(() => {
    setActiveSearchIndex(0)
    setSearchCommitted(false)
  }, [content, documentKey, searchQuery])

  useEffect(() => {
    if (activeSearchIndex < searchMatches.length) return
    setActiveSearchIndex(Math.max(0, searchMatches.length - 1))
  }, [activeSearchIndex, searchMatches.length])

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  useEffect(() => {
    activeDocRef.current = activeDoc
  }, [activeDoc])

  useEffect(() => {
    const root = document.documentElement
    if (prefs.dark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [prefs.dark])

  useEffect(() => {
    if (!library.loaded || activeDoc.type !== 'chapter' || !library.activeChapter) return
    setContent(library.activeChapter.content || '')
    setDocName(library.activeChapter.title || '새 챕터')
    setFilePath(null)
    setDirty(false)
    focusSession.reset()
  }, [activeDoc.type, library.loaded, library.activeProjectId, library.activeChapterId])

  useEffect(() => {
    if (activeDoc.type === 'chapter' && library.activeChapter?.title) {
      setDocName(library.activeChapter.title)
    }
  }, [activeDoc.type, library.activeChapter?.title])

  const clearDraft = useCallback(async () => {
    try {
      if (api?.clearDraft) await api.clearDraft()
      fallbackClearDraft()
    } catch {
      fallbackClearDraft()
    }
  }, [])

  useEffect(() => {
    let alive = true
    const loadDraft = async () => {
      try {
        const draft = api?.readDraft ? await api.readDraft() : fallbackReadDraft()
        if (!alive || !draft?.content) return
        const savedAt = draft.savedAt ? new Date(draft.savedAt).toLocaleString() : '알 수 없음'
        const shouldRestore = window.confirm(`자동 저장본을 복구할까요?\n\n문서: ${draft.docName || '무제'}\n저장 시각: ${savedAt}`)
        if (!shouldRestore) return
        setActiveDoc({ type: 'draft' })
        setContent(draft.content || '')
        setFilePath(draft.filePath || null)
        setDocName(`${draft.docName || '무제'} 복구본`)
        setDirty(true)
        setChromeVisible(true)
        flash('자동 저장본을 복구했습니다')
      } catch {
        // Recovery is best-effort; a broken draft should not block startup.
      }
    }
    loadDraft()
    return () => {
      alive = false
    }
  }, [flash])

  useEffect(() => {
    if (!prefs.autosaveEnabled) {
      setAutosaveSaving(false)
      return undefined
    }
    const shouldSaveDraft = activeDoc.type === 'chapter'
      ? content.trim().length > 0
      : dirty && content.trim().length > 0
    if (!shouldSaveDraft) {
      setAutosaveSaving(false)
      return undefined
    }

    setAutosaveSaving(true)
    const id = setTimeout(async () => {
      const draft = {
        content,
        docName,
        filePath,
        activeDoc,
        savedAt: new Date().toISOString()
      }
      try {
        if (api?.writeDraft) {
          const result = await api.writeDraft(draft)
          if (!resultOk(result)) throw new Error(result?.error || '자동 저장 실패')
        } else {
          fallbackWriteDraft(draft)
        }
      } catch {
        try {
          fallbackWriteDraft(draft)
        } catch {
          // Avoid interrupting typing if every persistence layer fails.
        }
      } finally {
        setAutosaveSaving(false)
      }
    }, 700)

    return () => clearTimeout(id)
  }, [activeDoc, content, dirty, docName, filePath, prefs.autosaveEnabled])

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

  const selectSearchMatch = useCallback((index) => {
    const match = searchMatches[index]
    const editor = editorRef.current
    if (!match || !editor) return
    requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(match.start, match.end)
    })
  }, [searchMatches])

  const moveSearch = useCallback((direction) => {
    if (!searchMatches.length) return
    const nextIndex = searchCommitted
      ? (activeSearchIndex + direction + searchMatches.length) % searchMatches.length
      : activeSearchIndex
    setActiveSearchIndex(nextIndex)
    setSearchCommitted(true)
    selectSearchMatch(nextIndex)
  }, [activeSearchIndex, searchCommitted, searchMatches.length, selectSearchMatch])

  const openSearch = useCallback(() => {
    setChromeVisible(true)
    setSearchVisible(true)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchVisible(false)
    setSearchCommitted(false)
    if (editorRef.current) editorRef.current.focus()
  }, [])

  useEffect(() => {
    const onMove = () => revealChrome()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onMove)
    }
  }, [revealChrome])

  const updateContent = useCallback((value) => {
    setContent(value)
    if (activeDocRef.current.type === 'chapter') {
      library.updateActiveChapterContent(value)
      setDirty(false)
    } else {
      setDirty(true)
    }
    setChromeVisible(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }, [library])

  const confirmDiscard = useCallback((message) => {
    if (!dirtyRef.current || activeDocRef.current.type === 'chapter') return true
    return window.confirm(message)
  }, [])

  const handleSave = useCallback(async () => {
    if (!api?.saveFile) {
      flash('데스크톱 앱에서 저장할 수 있습니다')
      return false
    }
    const result = await api.saveFile({ content, currentPath: filePath })
    if (result?.canceled) return false
    if (!resultOk(result)) {
      flash(`저장 실패: ${result?.error || '알 수 없는 오류'}`)
      return false
    }
    setFilePath(result.path)
    setDocName(baseName(result.path))
    setDirty(false)
    await clearDraft()
    flash('저장되었습니다')
    return true
  }, [clearDraft, content, filePath, flash])

  const handleSaveAs = useCallback(async () => {
    if (!api?.saveFileAs) {
      flash('데스크톱 앱에서 저장할 수 있습니다')
      return false
    }
    const result = await api.saveFileAs({ content })
    if (result?.canceled) return false
    if (!resultOk(result)) {
      flash(`저장 실패: ${result?.error || '알 수 없는 오류'}`)
      return false
    }
    setActiveDoc({ type: 'file' })
    setFilePath(result.path)
    setDocName(baseName(result.path))
    setDirty(false)
    await clearDraft()
    flash('새 파일로 저장했습니다')
    return true
  }, [clearDraft, content, flash])

  const handleOpen = useCallback(async () => {
    if (!confirmDiscard('저장하지 않은 변경사항이 있습니다. 다른 파일을 불러올까요?')) return
    if (!api?.openFile) {
      flash('데스크톱 앱에서 파일을 불러올 수 있습니다')
      return
    }
    const result = await api.openFile()
    if (result?.canceled) return
    if (!resultOk(result)) {
      flash(`불러오기 실패: ${result?.error || '알 수 없는 오류'}`)
      return
    }
    setActiveDoc({ type: 'file' })
    setContent(result.content || '')
    setFilePath(result.path)
    setDocName(baseName(result.path))
    setDirty(false)
    await clearDraft()
    flash('불러왔습니다')
  }, [clearDraft, confirmDiscard, flash])

  const handleNew = useCallback(async () => {
    if (!confirmDiscard('저장하지 않은 변경사항이 있습니다. 새 문서를 시작할까요?')) return
    setActiveDoc({ type: 'scratch' })
    setContent('')
    setFilePath(null)
    setDocName('무제')
    setDirty(false)
    setChromeVisible(true)
    focusSession.reset()
    await clearDraft()
    if (editorRef.current) editorRef.current.focus()
    flash('새 문서')
  }, [clearDraft, confirmDiscard, flash, focusSession])

  const handleRename = useCallback(async (name) => {
    const clean = name.trim()
    if (!clean) return
    if (activeDocRef.current.type === 'chapter' && library.activeProjectId && library.activeChapterId) {
      library.renameChapter(library.activeProjectId, library.activeChapterId, clean)
      setDocName(clean)
      return
    }
    if (filePath && api?.renameFile) {
      const result = await api.renameFile({ currentPath: filePath, nextName: clean })
      if (!resultOk(result)) {
        flash(`이름 변경 실패: ${result?.error || '알 수 없는 오류'}`)
        return
      }
      setFilePath(result.path)
      setDocName(result.name || baseName(result.path))
      return
    }
    setDocName(clean)
  }, [filePath, flash, library])

  const handleSelectChapter = useCallback((projectId, chapterId) => {
    if (!projectId || !chapterId) return
    if (!confirmDiscard('저장하지 않은 변경사항이 있습니다. 챕터를 이동할까요?')) return
    library.setActiveProjectId(projectId)
    library.setActiveChapterId(chapterId)
    setActiveDoc({ type: 'chapter' })
    setChromeVisible(true)
  }, [confirmDiscard, library])

  const handlePickBackground = useCallback(async () => {
    if (!api?.pickImage) {
      flash('데스크톱 앱에서 배경 이미지를 선택할 수 있습니다')
      return
    }
    const result = await api.pickImage()
    if (result?.canceled) return
    if (!resultOk(result)) {
      flash(`배경 설정 실패: ${result?.error || '알 수 없는 오류'}`)
      return
    }
    updatePrefs({
      backgroundUrl: result.url || result.dataUrl || '',
      backgroundPath: result.path || ''
    })
    flash('배경을 적용했습니다')
  }, [flash, updatePrefs])

  const handleExportMarkdown = useCallback(async () => {
    if (!api?.exportMarkdown) {
      flash('데스크톱 앱에서 내보낼 수 있습니다')
      return
    }
    const result = await api.exportMarkdown({ content, docName })
    if (result?.canceled) return
    if (!resultOk(result)) {
      flash(`내보내기 실패: ${result?.error || '알 수 없는 오류'}`)
      return
    }
    flash('Markdown으로 내보냈습니다')
  }, [content, docName, flash])

  const handleExportHtml = useCallback(async () => {
    if (!api?.exportHtml) {
      flash('데스크톱 앱에서 내보낼 수 있습니다')
      return
    }
    const html = htmlDocument({
      title: docName,
      markdown: content,
      fontFamily: exportFontFamily(prefs.font)
    })
    const result = await api.exportHtml({ html, docName })
    if (result?.canceled) return
    if (!resultOk(result)) {
      flash(`내보내기 실패: ${result?.error || '알 수 없는 오류'}`)
      return
    }
    flash('HTML로 내보냈습니다')
  }, [content, docName, flash, prefs.font])

  const requestClose = useCallback(async () => {
    const shouldClose = !dirtyRef.current || activeDocRef.current.type === 'chapter'
      || window.confirm('저장하지 않은 변경사항이 있습니다. 자동 저장본은 남아 있습니다. 앱을 닫을까요?')
    if (!shouldClose) return
    if (activeDocRef.current.type === 'chapter') {
      const saved = await library.saveNow()
      if (!saved && !window.confirm('작품 라이브러리를 저장하지 못했습니다. 그래도 앱을 닫을까요?')) return
    }
    if (api?.forceClose) await api.forceClose()
  }, [library])

  useEffect(() => {
    if (!api?.onCloseRequested) return undefined
    return api.onCloseRequested(requestClose)
  }, [requestClose])

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!dirtyRef.current || activeDocRef.current.type === 'chapter') return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 's' && event.shiftKey) {
        event.preventDefault()
        handleSaveAs()
      } else if (key === 's') {
        event.preventDefault()
        handleSave()
      } else if (key === 'o') {
        event.preventDefault()
        handleOpen()
      } else if (key === 'n') {
        event.preventDefault()
        handleNew()
      } else if (key === 'p') {
        event.preventDefault()
        setPref('previewVisible', (value) => !value)
      } else if (key === 'f') {
        event.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave, handleSaveAs, handleOpen, handleNew, openSearch, setPref])

  const applyRatio = useCallback((w, h) => {
    setEditorRatio({ w, h })
  }, [])

  const handleResize = useCallback((size) => {
    setEditorRatio(null)
    setPref('editorSize', size)
  }, [setPref])

  const addRatio = useCallback((w, h) => {
    if (!w || !h) return
    setPref('customRatios', (prev = []) => {
      if (prev.some((ratio) => ratio.w === w && ratio.h === h)) return prev
      return [...prev, { id: `${w}:${h}:${Date.now()}`, w, h }]
    })
  }, [setPref])

  const removeRatio = useCallback((id) => {
    setPref('customRatios', (prev = []) => prev.filter((ratio) => ratio.id !== id))
  }, [setPref])

  const toggleRatioEnabled = useCallback(() => {
    setPref('ratioEnabled', (value) => {
      if (value) setEditorRatio(null)
      return !value
    })
  }, [setPref])

  const chromeTransition = { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
  const showSidebar = chromeVisible && prefs.sidebarVisible
  const showPreview = chromeVisible && prefs.previewVisible

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer background={prefs.backgroundUrl} dark={prefs.dark} />

      <motion.div
        animate={{
          paddingTop: chromeVisible ? 104 : 30,
          paddingBottom: chromeVisible ? 48 : 30
        }}
        transition={chromeTransition}
        className="absolute inset-0 z-10 flex min-h-0 gap-4 overflow-hidden px-5"
      >
        <AnimatePresence initial={false}>
          {showSidebar && (
            <ProjectSidebar
              library={library.library}
              activeProjectId={library.activeProjectId}
              activeChapterId={library.activeChapterId}
              activeProject={library.activeProject}
              targetCount={prefs.targetCount}
              todayChars={writingStats.todayChars}
              weekTotal={writingStats.weekTotal}
              todaySessions={writingStats.todaySessions}
              sessionSeconds={focusSession.seconds}
              saving={library.saving}
              onSelectChapter={handleSelectChapter}
              onCreateProject={library.createProject}
              onRenameProject={library.renameProject}
              onDeleteProject={library.deleteProject}
              onCreateChapter={library.createChapter}
              onRenameChapter={library.renameChapter}
              onDeleteChapter={library.deleteChapter}
              onUpdateNotes={library.updateProjectNotes}
              onChangeTarget={(value) => setPref('targetCount', value)}
            />
          )}
        </AnimatePresence>

        <div className={`grid min-w-0 flex-1 gap-4 ${showPreview ? 'grid-cols-[minmax(320px,1fr)_minmax(300px,0.86fr)]' : 'grid-cols-1'}`}>
          <div className="flex min-h-0 items-center justify-center overflow-auto">
            <Editor
              ref={editorRef}
              value={content}
              onChange={updateContent}
              font={prefs.font}
              fontSize={prefs.fontSize}
              dark={prefs.dark}
              glassOpacity={prefs.glassOpacity}
              noteStyle={prefs.noteStyle}
              hasBackground={!!prefs.backgroundUrl}
              width={prefs.editorSize.width}
              height={prefs.editorSize.height}
              aspectRatio={editorRatio ? `${editorRatio.w} / ${editorRatio.h}` : null}
              onResize={handleResize}
              onFocus={() => {
                editorFocused.current = true
                setEditorActive(true)
                scheduleHide()
              }}
              onBlur={() => {
                editorFocused.current = false
                setEditorActive(false)
                setChromeVisible(true)
              }}
            />
          </div>

          <AnimatePresence initial={false}>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="min-h-0"
              >
                <MarkdownPreview
                  content={content}
                  font={prefs.font}
                  fontSize={prefs.fontSize}
                  dark={prefs.dark}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : -16 }}
        transition={chromeTransition}
        style={{ pointerEvents: chromeVisible ? 'auto' : 'none' }}
        className="absolute inset-x-0 top-0 z-20 text-zinc-900 dark:text-zinc-100"
      >
        <TitleBar title={docName} dirty={dirty} onRename={handleRename} onClose={requestClose} />
        <Toolbar
          dark={prefs.dark}
          onToggleDark={() => setPref('dark', (value) => !value)}
          font={prefs.font}
          onChangeFont={(value) => setPref('font', value)}
          fontSize={prefs.fontSize}
          onChangeFontSize={(value) => setPref('fontSize', value)}
          glassOpacity={prefs.glassOpacity}
          onChangeGlass={(value) => setPref('glassOpacity', value)}
          noteStyle={prefs.noteStyle}
          onChangeNoteStyle={(value) => setPref('noteStyle', value)}
          ratioEnabled={prefs.ratioEnabled}
          onToggleRatioEnabled={toggleRatioEnabled}
          customRatios={prefs.customRatios}
          onApplyRatio={applyRatio}
          onAddRatio={addRatio}
          onRemoveRatio={removeRatio}
          sidebarVisible={prefs.sidebarVisible}
          onToggleSidebar={() => setPref('sidebarVisible', (value) => !value)}
          previewVisible={prefs.previewVisible}
          onTogglePreview={() => setPref('previewVisible', (value) => !value)}
          searchVisible={searchVisible}
          onToggleSearch={() => (searchVisible ? closeSearch() : openSearch())}
          autosaveEnabled={prefs.autosaveEnabled}
          onToggleAutosave={() => setPref('autosaveEnabled', (value) => !value)}
          onNew={handleNew}
          onPickBackground={handlePickBackground}
          onClearBackground={() => updatePrefs({ backgroundUrl: '', backgroundPath: '' })}
          hasBackground={!!prefs.backgroundUrl}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onOpen={handleOpen}
          onExportMarkdown={handleExportMarkdown}
          onExportHtml={handleExportHtml}
        />
      </motion.div>

      <AnimatePresence>
        {searchVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="no-drag absolute right-5 top-[102px] z-40"
          >
            <SearchPanel
              query={searchQuery}
              onChangeQuery={setSearchQuery}
              matchCount={searchMatches.length}
              activeIndex={searchMatches.length ? activeSearchIndex : -1}
              onNext={() => moveSearch(1)}
              onPrevious={() => moveSearch(-1)}
              onClose={closeSearch}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
          font={prefs.font}
          target={counts.target}
          progress={counts.progress}
          remaining={counts.remaining}
          sessionSeconds={focusSession.seconds}
          autosaveEnabled={prefs.autosaveEnabled}
          saving={autosaveSaving || library.saving}
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
