import { useEffect, useState } from 'react'
import { betasApi } from './services'
import type { Beta } from './types'

/**
 * Índice ligero `postId → Beta` para pintar la ficha dentro del feed.
 * El `PostOut` de FastAPI no incluye la beta embebida, así que se resuelve
 * con una sola llamada a `/betas` cacheada durante un minuto.
 */
let cache: Promise<Beta[]> | null = null
let fetchedAt = 0

export function invalidateBetasIndex() {
  cache = null
  fetchedAt = 0
}

export function loadBetasIndex(force = false): Promise<Beta[]> {
  if (!force && cache && Date.now() - fetchedAt < 60_000) return cache
  fetchedAt = Date.now()
  cache = betasApi.list({ limit: 100 }).catch(() => [])
  return cache
}

export function useBetaForPost(postId: string | null | undefined, enabled = true) {
  const [beta, setBeta] = useState<Beta | null>(null)

  useEffect(() => {
    if (!postId || !enabled) {
      setBeta(null)
      return
    }
    let alive = true
    loadBetasIndex().then((items) => {
      if (alive) setBeta(items.find((item) => item.postId === postId) ?? null)
    })
    return () => {
      alive = false
    }
  }, [postId, enabled])

  return beta
}
