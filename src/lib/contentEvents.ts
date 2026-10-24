import { useEffect, useRef } from 'react'

/** Se dispara cuando se crea un post, beta o encuesta desde cualquier compositor. */
export const CONTENT_CREATED_EVENT = 'devplay:created'

export function emitContentCreated(kind: 'post' | 'beta' | 'poll') {
  window.dispatchEvent(new CustomEvent(CONTENT_CREATED_EVENT, { detail: { kind } }))
}

export function useContentCreated(callback: () => void) {
  const ref = useRef(callback)
  ref.current = callback

  useEffect(() => {
    const handler = () => ref.current()
    window.addEventListener(CONTENT_CREATED_EVENT, handler)
    return () => window.removeEventListener(CONTENT_CREATED_EVENT, handler)
  }, [])
}
