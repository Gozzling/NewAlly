import { useEffect, useState } from 'react'

/** Typing animation for search placeholders (matches Items / Units / Traits / Augments guides). */
export function useTypewriterPlaceholder(words: string[], pause = false) {
  const [typingText, setTypingText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const wordsKey = words.join('\0')

  useEffect(() => {
    if (pause || words.length === 0) return

    let wordIndex = 0
    let charIndex = 0
    let isDeleting = false
    let timeout: ReturnType<typeof setTimeout>

    const type = () => {
      const currentWord = words[wordIndex % words.length]

      if (isDeleting) {
        setTypingText(currentWord.substring(0, charIndex - 1))
        charIndex--
        if (charIndex === 0) {
          isDeleting = false
          wordIndex = (wordIndex + 1) % words.length
          timeout = setTimeout(type, 500)
        } else {
          timeout = setTimeout(type, 50)
        }
      } else {
        setTypingText(currentWord.substring(0, charIndex + 1))
        charIndex++
        if (charIndex === currentWord.length) {
          isDeleting = true
          timeout = setTimeout(type, 2800)
        } else {
          timeout = setTimeout(type, 80)
        }
      }
    }

    type()

    return () => clearTimeout(timeout)
  }, [wordsKey, words.length, pause])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  const placeholderAnimated = typingText ? `${typingText}${showCursor ? '|' : ''}` : ''
  return { placeholderAnimated }
}
