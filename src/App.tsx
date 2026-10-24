import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Gamepad2, Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyPage } from './pages/VerifyPage'
import { HomePage } from './pages/HomePage'
import { DiscoverPage } from './pages/DiscoverPage'
import { BetasPage } from './pages/BetasPage'
import { BetaDetailPage } from './pages/BetaDetailPage'
import { ChatPage } from './pages/ChatPage'
import { StorePage } from './pages/StorePage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SearchPage } from './pages/SearchPage'
import { PostPage } from './pages/PostPage'
import { AboutPage } from './pages/AboutPage'
import { ReportsPage } from './pages/ReportsPage'
import { NotFoundPage } from './pages/NotFoundPage'

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span
          className="grid h-12 w-12 place-items-center rounded-2xl shadow-[0_0_40px_-8px_rgba(0,240,255,0.8)]"
          style={{ background: 'linear-gradient(135deg, #00F0FF, #3B82F6 55%, #8B5CF6)' }}
        >
          <Gamepad2 size={24} className="text-[#04121a]" />
        </span>
        <p className="font-display text-[18px] font-bold text-fg">
          Dev<span className="text-grad">Play</span>
        </p>
        <Loader2 size={18} className="spin-slow text-cyan" />
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Splash />
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="betas" element={<BetasPage />} />
        <Route path="betas/:betaId" element={<BetaDetailPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:peerId" element={<ChatPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="u/:userId" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="post/:postId" element={<PostPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

/** Evita que un error de render deje la app en blanco. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DevPlay:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="glass max-w-md p-7 text-center">
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-red-300">
            algo se rompió
          </p>
          <h1 className="mt-2 font-display text-[22px] font-bold text-fg">
            DevPlay necesita recargar
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            {this.state.error.message || 'Error inesperado en la interfaz.'}
          </p>
          <button
            type="button"
            className="btn btn-grad btn-sm mt-4"
            onClick={() => window.location.assign('/')}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }
}
