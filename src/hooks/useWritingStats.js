import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const STORE_KEY = 'zenpad:writing-stats:v1'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {}
  } catch {
    return {}
  }
}

export default function useWritingStats(content, documentKey) {
  const [stats, setStats] = useState(loadStats)
  const baselineRef = useRef(null)
  const keyRef = useRef(documentKey)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(stats))
    } catch {
      // Tiny analytic data can be dropped without interrupting writing.
    }
  }, [stats])

  useEffect(() => {
    keyRef.current = documentKey
    baselineRef.current = String(content ?? '').length
  }, [documentKey])

  useEffect(() => {
    const length = String(content ?? '').length
    if (baselineRef.current == null) {
      baselineRef.current = length
      return
    }

    const diff = length - baselineRef.current
    baselineRef.current = length
    if (diff <= 0) return

    const day = todayKey()
    setStats((prev) => ({
      ...prev,
      [day]: {
        chars: (prev[day]?.chars || 0) + diff,
        sessions: prev[day]?.sessions || 0
      }
    }))
  }, [content])

  const today = stats[todayKey()] || { chars: 0, sessions: 0 }
  const weekTotal = useMemo(() => {
    const now = new Date()
    return Object.entries(stats).reduce((sum, [date, value]) => {
      const time = new Date(`${date}T00:00:00`).getTime()
      return now.getTime() - time <= 6 * 24 * 60 * 60 * 1000 ? sum + (value?.chars || 0) : sum
    }, 0)
  }, [stats])

  const recordSession = useCallback(() => {
    const day = todayKey()
    setStats((prev) => ({
      ...prev,
      [day]: {
        chars: prev[day]?.chars || 0,
        sessions: (prev[day]?.sessions || 0) + 1
      }
    }))
  }, [])

  return {
    todayChars: today.chars || 0,
    todaySessions: today.sessions || 0,
    weekTotal,
    recordSession
  }
}
