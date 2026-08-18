import { useMemo } from 'react'

export function countText(content) {
  const text = String(content ?? '')
  const withSpaces = text.length
  const withoutSpaces = text.replace(/\s/g, '').length
  const lines = text === '' ? 0 : text.split('\n').length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return { withSpaces, withoutSpaces, lines, words }
}

export default function useEditorStats(content, targetCount) {
  return useMemo(() => {
    const counts = countText(content)
    const target = Math.max(0, Number(targetCount) || 0)
    const progress = target > 0 ? Math.min(100, Math.round((counts.withSpaces / target) * 100)) : 0
    const remaining = Math.max(0, target - counts.withSpaces)
    return { ...counts, target, progress, remaining }
  }, [content, targetCount])
}
