import type { UserMe } from './types'
import { str, toUserMe } from './types'

const ACCESS_KEY = 'devplay.access'
const REFRESH_KEY = 'devplay.refresh'
const USER_KEY = 'devplay.user'

/** Acceso seguro a localStorage (el build se puede renderizar sin `window`). */
const store = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* modo privado: la sesión vive solo en memoria */
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  },
}

export const session = {
  accessToken: () => store.get(ACCESS_KEY),
  refreshToken: () => store.get(REFRESH_KEY),

  saveTokens(accessToken: string, refreshToken: string | null) {
    store.set(ACCESS_KEY, accessToken)
    if (refreshToken) store.set(REFRESH_KEY, refreshToken)
  },

  saveUser(user: UserMe) {
    store.set(USER_KEY, JSON.stringify(user))
  },

  cachedUser(): UserMe | null {
    const raw = store.get(USER_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return toUserMe(parsed)
    } catch {
      return null
    }
  },

  clear() {
    store.remove(ACCESS_KEY)
    store.remove(REFRESH_KEY)
    store.remove(USER_KEY)
  },
}

export function guestUser(id: string, username: string, isGuest: boolean): UserMe {
  return {
    id,
    email: '',
    username,
    fullName: null,
    bio: null,
    avatar: null,
    banner: null,
    role: 'USER',
    language: 'es',
    isGuest,
    isPrivate: false,
    tourCompleted: false,
    devCoins: 0,
    location: null,
    website: null,
    profession: null,
    tags: [],
    createdAt: new Date().toISOString(),
  }
}

export const guestName = (raw: Record<string, unknown>): string =>
  str(raw.username, 'invitado')
