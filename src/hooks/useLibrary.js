import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const STORE_KEY = 'zenpad:library:v1'

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function now() {
  return new Date().toISOString()
}

function defaultLibrary() {
  const stamp = now()
  const projectId = makeId('project')
  const chapterId = makeId('chapter')
  return {
    projects: [
      {
        id: projectId,
        title: '나의 첫 작품',
        notes: '캐릭터, 세계관, 장면 아이디어를 여기에 적어두세요.',
        createdAt: stamp,
        updatedAt: stamp,
        chapters: [
          {
            id: chapterId,
            title: '1화',
            content: '',
            createdAt: stamp,
            updatedAt: stamp
          }
        ]
      }
    ]
  }
}

function normalizeLibrary(value) {
  if (!value || !Array.isArray(value.projects) || value.projects.length === 0) return defaultLibrary()
  return {
    projects: value.projects.map((project) => ({
      id: project.id || makeId('project'),
      title: project.title || '무제 작품',
      notes: project.notes || '',
      createdAt: project.createdAt || now(),
      updatedAt: project.updatedAt || now(),
      chapters: Array.isArray(project.chapters) && project.chapters.length > 0
        ? project.chapters.map((chapter) => ({
            id: chapter.id || makeId('chapter'),
            title: chapter.title || '새 챕터',
            content: chapter.content || '',
            createdAt: chapter.createdAt || now(),
            updatedAt: chapter.updatedAt || now()
          }))
        : [
            {
              id: makeId('chapter'),
              title: '1화',
              content: '',
              createdAt: now(),
              updatedAt: now()
            }
          ]
    }))
  }
}

export default function useLibrary(api, onError) {
  const [libraryState, setLibraryState] = useState(() => normalizeLibrary(null))
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeChapterId, setActiveChapterId] = useState(null)
  const libraryRef = useRef(libraryState)

  const setLibrary = useCallback((updater) => {
    setLibraryState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      libraryRef.current = next
      return next
    })
  }, [])

  const persistLibrary = useCallback(async (nextLibrary) => {
    if (api?.saveLibrary) {
      const result = await api.saveLibrary(nextLibrary)
      if (result?.ok === false) throw new Error(result.error || 'save failed')
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(nextLibrary))
    }
  }, [api])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        let next
        if (api?.loadLibrary) next = await api.loadLibrary()
        else next = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
        if (!alive) return
        const normalized = normalizeLibrary(next)
        const firstProject = normalized.projects[0]
        const firstChapter = firstProject?.chapters?.[0]
        setLibrary(normalized)
        setActiveProjectId(firstProject?.id || null)
        setActiveChapterId(firstChapter?.id || null)
        setLoaded(true)
      } catch (error) {
        onError?.('작품 라이브러리를 불러오지 못했습니다.')
        if (alive) setLoaded(true)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [api, onError])

  useEffect(() => {
    if (!loaded) return undefined
    setSaving(true)
    const id = setTimeout(async () => {
      try {
        await persistLibrary(libraryState)
      } catch {
        onError?.('작품 라이브러리를 저장하지 못했습니다.')
      } finally {
        setSaving(false)
      }
    }, 450)
    return () => clearTimeout(id)
  }, [libraryState, loaded, onError, persistLibrary])

  const saveNow = useCallback(async () => {
    if (!loaded) return true
    setSaving(true)
    try {
      await persistLibrary(libraryRef.current)
      return true
    } catch {
      onError?.('작품 라이브러리를 저장하지 못했습니다.')
      return false
    } finally {
      setSaving(false)
    }
  }, [loaded, onError, persistLibrary])

  const activeProject = useMemo(
    () => libraryState.projects.find((project) => project.id === activeProjectId) || libraryState.projects[0] || null,
    [libraryState, activeProjectId]
  )

  const activeChapter = useMemo(
    () => activeProject?.chapters.find((chapter) => chapter.id === activeChapterId) || activeProject?.chapters[0] || null,
    [activeProject, activeChapterId]
  )

  useEffect(() => {
    if (!loaded || libraryState.projects.length === 0) return

    const project = libraryState.projects.find((item) => item.id === activeProjectId) || libraryState.projects[0]
    if (!project) return

    if (project.id !== activeProjectId) {
      setActiveProjectId(project.id)
      setActiveChapterId(project.chapters[0]?.id || null)
      return
    }

    const chapter = project.chapters.find((item) => item.id === activeChapterId) || project.chapters[0]
    if ((chapter?.id || null) !== activeChapterId) {
      setActiveChapterId(chapter?.id || null)
    }
  }, [activeChapterId, activeProjectId, libraryState.projects, loaded])

  const mutateProject = useCallback((projectId, updater) => {
    setLibrary((prev) => ({
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? { ...updater(project), updatedAt: now() }
          : project
      )
    }))
  }, [])

  const createProject = useCallback(() => {
    const stamp = now()
    const projectId = makeId('project')
    const chapterId = makeId('chapter')
    const project = {
      id: projectId,
      title: '새 작품',
      notes: '',
      createdAt: stamp,
      updatedAt: stamp,
      chapters: [
        {
          id: chapterId,
          title: '1화',
          content: '',
          createdAt: stamp,
          updatedAt: stamp
        }
      ]
    }
    setLibrary((prev) => ({ projects: [...prev.projects, project] }))
    setActiveProjectId(projectId)
    setActiveChapterId(chapterId)
    return { projectId, chapterId }
  }, [])

  const renameProject = useCallback((projectId, title) => {
    const clean = title.trim()
    if (!clean) return
    mutateProject(projectId, (project) => ({ ...project, title: clean }))
  }, [mutateProject])

  const deleteProject = useCallback((projectId) => {
    setLibrary((prev) => {
      if (prev.projects.length <= 1) return prev
      return {
        projects: prev.projects.filter((project) => project.id !== projectId)
      }
    })
  }, [])

  const createChapter = useCallback((projectId) => {
    const stamp = now()
    const chapter = {
      id: makeId('chapter'),
      title: '새 챕터',
      content: '',
      createdAt: stamp,
      updatedAt: stamp
    }
    mutateProject(projectId, (project) => ({
      ...project,
      chapters: [...project.chapters, chapter]
    }))
    setActiveProjectId(projectId)
    setActiveChapterId(chapter.id)
    return chapter
  }, [mutateProject])

  const renameChapter = useCallback((projectId, chapterId, title) => {
    const clean = title.trim()
    if (!clean) return
    mutateProject(projectId, (project) => ({
      ...project,
      chapters: project.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, title: clean, updatedAt: now() } : chapter
      )
    }))
  }, [mutateProject])

  const deleteChapter = useCallback((projectId, chapterId) => {
    mutateProject(projectId, (project) => {
      if (project.chapters.length <= 1) return project
      const chapters = project.chapters.filter((chapter) => chapter.id !== chapterId)
      return { ...project, chapters }
    })
  }, [mutateProject])

  const updateActiveChapterContent = useCallback((content) => {
    if (!activeProjectId || !activeChapterId) return
    mutateProject(activeProjectId, (project) => ({
      ...project,
      chapters: project.chapters.map((chapter) =>
        chapter.id === activeChapterId ? { ...chapter, content, updatedAt: now() } : chapter
      )
    }))
  }, [activeChapterId, activeProjectId, mutateProject])

  const updateProjectNotes = useCallback((projectId, notes) => {
    mutateProject(projectId, (project) => ({ ...project, notes }))
  }, [mutateProject])

  return {
    library: libraryState,
    loaded,
    saving,
    activeProject,
    activeChapter,
    activeProjectId,
    activeChapterId,
    setActiveProjectId,
    setActiveChapterId,
    saveNow,
    createProject,
    renameProject,
    deleteProject,
    createChapter,
    renameChapter,
    deleteChapter,
    updateActiveChapterContent,
    updateProjectNotes
  }
}
