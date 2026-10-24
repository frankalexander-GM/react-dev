import { session } from './session'

/**
 * Cliente HTTP contra la API FastAPI (`/api/v1`).
 *
 * - Guarda el par de JWT y los refresca una sola vez cuando el access caduca.
 * - Traduce `detail` de FastAPI (string o lista de errores 422) a un mensaje
 *   legible en español.
 * - Emite `devplay:unauthorized` cuando la sesión ya no se puede recuperar.
 */

const DEFAULT_BASE = 'http://localhost:8000/api/v1'

export const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_BASE
).replace(/\/+$/, '')

export const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, '')

export class ApiError extends Error {
  status: number
  detail: string
  payload: unknown

  constructor(status: number, detail: string, payload?: unknown) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.payload = payload
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  const refreshToken = session.refreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as Record<string, unknown>
    const access = typeof data.access_token === 'string' ? data.access_token : ''
    if (!access) return false
    session.saveTokens(access, typeof data.refresh_token === 'string' ? data.refresh_token : null)
    return true
  } catch {
    return false
  }
}

function ensureRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/** Traduce los mensajes más comunes del backend (en inglés) al español. */
const DETAIL_ES: [RegExp, string][] = [
  [/invalid credentials/i, 'Correo o contraseña incorrectos.'],
  [/not authenticated/i, 'Inicia sesión para continuar.'],
  [/email already/i, 'Ese correo ya tiene una cuenta.'],
  [/username .*taken|already exists/i, 'Ese nombre de usuario ya está ocupado.'],
  [/already reposted/i, 'Ya habías reposteado esta publicación.'],
  [/already voted/i, 'Ya votaste en esta encuesta.'],
  [/poll is closed/i, 'La encuesta está cerrada.'],
  [/cannot message yourself/i, 'No puedes enviarte un mensaje a ti mismo.'],
  [/invalid or expired code|invalid code/i, 'El código no es válido o caducó.'],
  [/not the author/i, 'Solo el autor puede hacer esto.'],
  [/rate limit|too many/i, 'Vas muy rápido. Espera un momento.'],
]

function humanize(detail: string): string {
  const match = DETAIL_ES.find(([pattern]) => pattern.test(detail))
  return match ? match[1] : detail
}

/** Convierte el `detail` de FastAPI en un texto presentable. */
export function messageFromDetail(detail: unknown, status: number): string {
  if (typeof detail === 'string' && detail.trim()) return humanize(detail)
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === 'object') {
          const msg = (item as Record<string, unknown>).msg
          const loc = (item as Record<string, unknown>).loc
          const field = Array.isArray(loc) ? loc.filter((l) => l !== 'body').join('.') : ''
          return typeof msg === 'string' ? `${field ? `${field}: ` : ''}${msg}` : ''
        }
        return ''
      })
      .filter(Boolean)
    if (messages.length) return messages.slice(0, 3).join(' · ')
  }
  if (status === 401) return 'Tu sesión expiró. Vuelve a entrar.'
  if (status === 403) return 'No tienes permiso para hacer esto.'
  if (status === 404) return 'No encontramos lo que buscabas.'
  if (status === 409) return 'Ese contenido ya existe o entra en conflicto.'
  if (status === 422) return 'Revisa los datos: hay campos inválidos.'
  if (status === 429) return 'Vas muy rápido. Espera un momento.'
  return `Error ${status} del servidor.`
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, auth = true, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? session.accessToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true
  let res = await send(path, options)

  if (res.status === 401 && auth && session.refreshToken()) {
    const refreshed = await ensureRefresh()
    if (refreshed) {
      res = await send(path, options)
    }
  }

  const payload = await parseBody(res)

  if (res.status === 401 && auth) {
    session.clear()
    window.dispatchEvent(new Event('devplay:unauthorized'))
  }

  if (!res.ok) {
    const detail =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>).detail
        : undefined
    throw new ApiError(res.status, messageFromDetail(detail, res.status), payload)
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, auth = true, signal?: AbortSignal) =>
    request<T>(path, { auth, signal }),

  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }),

  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'PATCH', body, auth }),

  del: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'DELETE', body, auth }),
}

/** Convierte rutas relativas del backend (`/uploads/...`) en absolutas. */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`
  return url
}
