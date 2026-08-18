import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

function formatSeconds(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function ProjectSidebar({
  library,
  activeProjectId,
  activeChapterId,
  activeProject,
  targetCount,
  todayChars,
  weekTotal,
  todaySessions,
  sessionSeconds,
  saving,
  onSelectChapter,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onCreateChapter,
  onRenameChapter,
  onDeleteChapter,
  onUpdateNotes,
  onChangeTarget
}) {
  const [projectDraft, setProjectDraft] = useState('')
  const [chapterDraft, setChapterDraft] = useState('')
  const target = Math.max(0, Number(targetCount) || 0)
  const todayProgress = target > 0 ? Math.min(100, Math.round((todayChars / target) * 100)) : 0
  const chapters = activeProject?.chapters || []

  const totalChars = useMemo(() => {
    return chapters.reduce((sum, chapter) => sum + String(chapter.content || '').length, 0)
  }, [chapters])

  const addProject = () => {
    const ids = onCreateProject()
    if (projectDraft.trim() && ids?.projectId) onRenameProject(ids.projectId, projectDraft)
    setProjectDraft('')
  }

  const addChapter = () => {
    if (!activeProjectId) return
    const chapter = onCreateChapter(activeProjectId)
    if (chapterDraft.trim() && chapter?.id) onRenameChapter(activeProjectId, chapter.id, chapterDraft)
    setChapterDraft('')
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="no-drag flex min-h-0 w-[280px] shrink-0 flex-col gap-3 rounded-2xl border border-black/10 bg-white/55 p-3 text-zinc-800 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100"
    >
      <section className="min-h-0">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">작품</h2>
          <span className="text-[10px] text-zinc-400">{saving ? '저장 중' : '저장됨'}</span>
        </div>

        <div className="flex gap-1.5">
          <input
            value={projectDraft}
            onChange={(e) => setProjectDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addProject()
            }}
            placeholder="새 작품"
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white/65 px-2 py-1.5 text-[12px] outline-none focus:border-rose-400/60 dark:border-white/10 dark:bg-black/20"
          />
          <button
            type="button"
            onClick={addProject}
            className="rounded-lg bg-rose-400/90 px-2.5 text-[12px] font-medium text-white hover:bg-rose-400"
          >
            추가
          </button>
        </div>

        <div className="mt-2 flex max-h-28 flex-col gap-1 overflow-y-auto pr-1">
          {library.projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectChapter(project.id, project.chapters[0]?.id)}
              className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors ${
                project.id === activeProjectId
                  ? 'bg-rose-400/15 text-rose-600 dark:text-rose-200'
                  : 'hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{project.title}</span>
              <span
                role="button"
                tabIndex={0}
                title="이름 변경"
                onClick={(e) => {
                  e.stopPropagation()
                  const name = window.prompt('작품 이름', project.title)
                  if (name) onRenameProject(project.id, name)
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                수정
              </span>
              {library.projects.length > 1 && (
                <span
                  role="button"
                  tabIndex={0}
                  title="작품 삭제"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('작품과 챕터를 삭제할까요?')) onDeleteProject(project.id)
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  삭제
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="min-h-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">챕터</h2>
          <span className="text-[10px] tabular-nums text-zinc-400">{totalChars.toLocaleString()}자</span>
        </div>

        <div className="flex gap-1.5">
          <input
            value={chapterDraft}
            onChange={(e) => setChapterDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addChapter()
            }}
            placeholder="새 챕터"
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white/65 px-2 py-1.5 text-[12px] outline-none focus:border-rose-400/60 dark:border-white/10 dark:bg-black/20"
          />
          <button
            type="button"
            onClick={addChapter}
            className="rounded-lg bg-rose-400/90 px-2.5 text-[12px] font-medium text-white hover:bg-rose-400"
          >
            추가
          </button>
        </div>

        <div className="mt-2 flex max-h-52 flex-col gap-1 overflow-y-auto pr-1">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              type="button"
              onClick={() => onSelectChapter(activeProjectId, chapter.id)}
              className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors ${
                chapter.id === activeChapterId
                  ? 'bg-zinc-900/10 text-zinc-950 dark:bg-white/15 dark:text-white'
                  : 'hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <span className="w-5 shrink-0 text-[10px] tabular-nums text-zinc-400">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
              <span className="text-[10px] tabular-nums text-zinc-400">{String(chapter.content || '').length.toLocaleString()}</span>
              <span
                role="button"
                tabIndex={0}
                title="이름 변경"
                onClick={(e) => {
                  e.stopPropagation()
                  const name = window.prompt('챕터 이름', chapter.title)
                  if (name) onRenameChapter(activeProjectId, chapter.id, name)
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                수정
              </span>
              {chapters.length > 1 && (
                <span
                  role="button"
                  tabIndex={0}
                  title="챕터 삭제"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('이 챕터를 삭제할까요?')) onDeleteChapter(activeProjectId, chapter.id)
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  삭제
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">설정 메모</h2>
        <textarea
          value={activeProject?.notes || ''}
          onChange={(e) => onUpdateNotes(activeProjectId, e.target.value)}
          spellCheck={false}
          className="h-24 w-full resize-none rounded-xl border border-black/10 bg-white/55 px-3 py-2 text-[12px] leading-relaxed outline-none focus:border-rose-400/60 dark:border-white/10 dark:bg-black/20"
        />
      </section>

      <section className="rounded-xl border border-black/10 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">오늘 목표</h2>
          <span className="text-[11px] tabular-nums text-rose-500">{todayProgress}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={target}
            onChange={(e) => onChangeTarget(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            inputMode="numeric"
            className="w-24 rounded-lg border border-black/10 bg-white/70 px-2 py-1 text-right text-[12px] tabular-nums outline-none dark:border-white/10 dark:bg-black/20"
          />
          <span className="text-[12px] text-zinc-500 dark:text-zinc-400">자</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: `${todayProgress}%` }} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="tabular-nums">오늘 {todayChars.toLocaleString()}</span>
          <span className="tabular-nums">주간 {weekTotal.toLocaleString()}</span>
          <span className="tabular-nums">{todaySessions}세션</span>
        </div>
        <div className="mt-1 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">집중 {formatSeconds(sessionSeconds)}</div>
      </section>
    </motion.aside>
  )
}
