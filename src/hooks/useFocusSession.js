import { useEffect, useRef, useState } from 'react'

export default function useFocusSession(active, onSessionEnd) {
  const [seconds, setSeconds] = useState(0)
  const activeRef = useRef(false)
  const secondsRef = useRef(0)
  const onSessionEndRef = useRef(onSessionEnd)

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd
  }, [onSessionEnd])

  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  useEffect(() => {
    if (!active) {
      if (activeRef.current && secondsRef.current >= 60) onSessionEndRef.current?.()
      activeRef.current = false
      return undefined
    }

    activeRef.current = true
    const id = setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  const reset = () => setSeconds(0)

  return { seconds, reset }
}
