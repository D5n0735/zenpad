import { useCallback, useEffect, useState } from 'react'

const STORE_KEY = 'zenpad:prefs:v2'

const DEFAULT_PREFS = {
  dark: true,
  font: 'myeongjo',
  fontSize: 19,
  backgroundUrl: '',
  backgroundPath: '',
  glassOpacity: 35,
  editorSize: { width: '100%', height: '100%' },
  noteStyle: 'plain',
  ratioEnabled: false,
  customRatios: [],
  targetCount: 3000,
  sidebarVisible: true,
  previewVisible: false,
  autosaveEnabled: true
}

function loadPrefs() {
  try {
    const legacy = JSON.parse(localStorage.getItem('glass-notes:prefs') || 'null')
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
    return {
      ...DEFAULT_PREFS,
      ...(legacy || {}),
      ...(saved || {}),
      backgroundUrl: saved?.backgroundUrl || legacy?.backgroundUrl || legacy?.background || '',
      backgroundPath: saved?.backgroundPath || legacy?.backgroundPath || ''
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export default function usePreferences() {
  const [prefs, setPrefs] = useState(loadPrefs)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(prefs))
    } catch {
      // Preference persistence should never block writing.
    }
  }, [prefs])

  const setPref = useCallback((key, value) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key], prev) : value
    }))
  }, [])

  const updatePrefs = useCallback((patch) => {
    setPrefs((prev) => ({
      ...prev,
      ...(typeof patch === 'function' ? patch(prev) : patch)
    }))
  }, [])

  return { prefs, setPref, updatePrefs }
}
