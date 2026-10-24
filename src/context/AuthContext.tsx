import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '../lib/api'
import { authApi, type RegisterResult } from '../lib/services'
import { guestUser, session } from '../lib/session'
import type { UserMe } from '../lib/types'

interface AuthContextValue {
  user: UserMe | null
  loading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  canWrite: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    email: string
    username: string
    password: string
    fullName: string
    age: number
    website?: string
  }) => Promise<RegisterResult>
  verifyAndLogin: (email: string, password: string, code: string) => Promise<void>
  loginAsGuest: () => Promise<void>
  logout: () => void
  setUser: (user: UserMe) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'Algo salió mal. Inténtalo otra vez.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  const setUser = useCallback((next: UserMe) => {
    setUserState(next)
    session.saveUser(next)
  }, [])

  const logout = useCallback(() => {
    session.clear()
    setUserState(null)
  }, [])

  // Arranque: valida el token guardado contra /auth/me.
  useEffect(() => {
    let cancelled = false
    const token = session.accessToken()
    if (!token) {
      setLoading(false)
      return
    }

    const cached = session.cachedUser()
    if (cached) {
      // Pintar la sesión cacheada al instante y refrescar en segundo plano.
      setUserState(cached)
      setLoading(false)
    }
    if (cached?.isGuest) return

    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch((error: unknown) => {
        // Solo un 401 invalida la sesión; un fallo de red conserva la caché.
        if (!cancelled && error instanceof ApiError && error.status === 401) {
          session.clear()
          setUserState(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setUser])

  // El cliente HTTP avisa cuando el refresh token ya no sirve.
  useEffect(() => {
    const onUnauthorized = () => setUserState(null)
    window.addEventListener('devplay:unauthorized', onUnauthorized)
    return () => window.removeEventListener('devplay:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await authApi.login(email, password)
        session.saveTokens(result.accessToken, result.refreshToken)
        setUser(result.user)
      } catch (error) {
        throw new Error(errorText(error))
      }
    },
    [setUser],
  )

  const register = useCallback<AuthContextValue['register']>(async (payload) => {
    try {
      return await authApi.register(payload)
    } catch (error) {
      throw new Error(errorText(error))
    }
  }, [])

  const verifyAndLogin = useCallback(
    async (email: string, password: string, code: string) => {
      try {
        await authApi.verifyRegister(email, code)
        const result = await authApi.login(email, password)
        session.saveTokens(result.accessToken, result.refreshToken)
        setUser(result.user)
      } catch (error) {
        throw new Error(errorText(error))
      }
    },
    [setUser],
  )

  const loginAsGuest = useCallback(async () => {
    try {
      const result = await authApi.guest()
      session.saveTokens(result.accessToken, result.refreshToken)
      setUser(guestUser(result.id, result.username, result.isGuest))
    } catch (error) {
      throw new Error(errorText(error))
    }
  }, [setUser])

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      /* la sesión se resolverá en el siguiente 401 */
    }
  }, [setUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isGuest: Boolean(user?.isGuest),
      canWrite: Boolean(user) && !user?.isGuest,
      login,
      register,
      verifyAndLogin,
      loginAsGuest,
      logout,
      setUser,
      refreshUser,
    }),
    [user, loading, login, register, verifyAndLogin, loginAsGuest, logout, setUser, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
