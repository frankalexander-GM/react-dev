import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Compass,
  Gamepad2,
  Home,
  Info,
  LogOut,
  Map,
  MessageSquare,
  PenSquare,
  Rocket,
  Settings,
  ShieldAlert,
  Store,
  Coins,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../lib/services'
import { Avatar } from '../ui/Avatar'
import { compact } from '../../lib/format'
import { useCreate } from '../create/CreateProvider'
import { SearchBox } from './SearchBox'

const MAIN_NAV = [
  { to: '/discover', label: 'Descubrir', icon: Compass, hint: 'Novedades y trending' },
  { to: '/', label: 'Inicio', icon: Home, hint: 'Feed principal', end: true },
  { to: '/betas', label: 'Betas', icon: Gamepad2, hint: 'Centro de betas' },
  { to: '/chat', label: 'Chat Mundial', icon: MessageSquare, hint: 'Habla con la comunidad' },
  { to: '/store', label: 'Tienda', icon: Store, hint: 'DevCoins y artículos' },
]

const HELP_NAV = [
  { to: '/about', label: 'Acerca de DevPlay', icon: Info },
  { to: '/reports', label: 'Reportes', icon: ShieldAlert },
]

function Brand({ compactMode = false }: { compactMode?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="DevPlay, ir al inicio">
      <span
        className="grid h-9 w-9 place-items-center rounded-[10px] shadow-[0_8px_24px_-10px_rgba(0,240,255,0.8)]"
        style={{ background: 'linear-gradient(135deg, #00F0FF 0%, #3B82F6 55%, #8B5CF6 100%)' }}
      >
        <Gamepad2 size={19} className="text-[#04121a]" strokeWidth={2.4} />
      </span>
      {!compactMode && (
        <span className="font-display text-[21px] font-bold tracking-tight text-fg">
          Dev<span className="text-grad">Play</span>
        </span>
      )}
    </Link>
  )
}

function NavSection({ title }: { title: string }) {
  return <p className="label-caps mb-1.5 px-2.5 pt-1">{title}</p>
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {MAIN_NAV.map(({ to, label, icon: Icon, hint, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={hint}
          className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}
        >
          <Icon size={17} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function CreateSection({ onNavigate }: { onNavigate?: () => void }) {
  const { canWrite } = useAuth()
  const { open } = useCreate()
  if (!canWrite) return null

  const items = [
    { label: 'Publicar post', icon: PenSquare, action: () => open('post') },
    { label: 'Subir beta', icon: Rocket, action: () => open('beta') },
    { label: 'Crear encuesta', icon: BarChart3, action: () => open('poll') },
  ]

  return (
    <div className="mt-5">
      <NavSection title="Crear contenido" />
      <div className="flex flex-col gap-0.5">
        {items.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              action()
              onNavigate?.()
            }}
            className="nav-item w-full text-left"
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function UserCard() {
  const { user, isGuest, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="mt-auto pt-4">
      <div className="glass-soft p-3">
        <div className="flex items-center gap-2.5">
          <Link to={`/u/${user.id}`} className="shrink-0">
            <Avatar name={user.username} src={user.avatar} size={36} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/u/${user.id}`}
              className="block truncate text-[13px] font-semibold text-fg hover:text-cyan"
            >
              {user.fullName || `@${user.username}`}
            </Link>
            <p className="truncate text-[11px] text-dim">
              {isGuest ? 'Invitado · solo lectura' : `@${user.username}`}
            </p>
          </div>
          <Link
            to={`/u/${user.id}?edit=1`}
            className="icon-btn h-8 w-8"
            aria-label="Ajustes del perfil"
          >
            <Settings size={15} />
          </Link>
        </div>

        {!isGuest && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg border border-line bg-black/20 px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <Coins size={13} className="text-cyan" />
              DevCoins
            </span>
            <span className="mono text-[11px] font-semibold text-cyan">
              {compact(user.devCoins)}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-muted transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[258px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface/60 px-3.5 py-4 backdrop-blur-xl lg:flex">
      <div className="px-1.5 pb-5">
        <Brand />
      </div>
      <NavSection title="Menú principal" />
      <SideNav />
      <CreateSection />
      <div className="mt-5">
        <NavSection title="Ayuda" />
        <div className="flex flex-col gap-0.5">
          {HELP_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <UserCard />
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Topbar                                    */
/* -------------------------------------------------------------------------- */

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, isGuest } = useAuth()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || isGuest) return
    let cancelled = false
    const load = async () => {
      try {
        const data = await chatApi.unread()
        if (!cancelled) setUnread(data.notifications)
      } catch {
        /* sin badge si la API no responde */
      }
    }
    load()
    const timer = window.setInterval(load, 60_000)
    const onRead = () => {
      if (!cancelled) setUnread(0)
    }
    window.addEventListener('devplay:notifications-read', onRead)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('devplay:notifications-read', onRead)
    }
  }, [user, isGuest, location.pathname])

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <header className="sticky top-0 z-40 flex h-[62px] items-center gap-2 border-b border-line bg-surface/85 px-3 backdrop-blur-xl sm:px-4">
      <button type="button" onClick={onMenu} className="icon-btn lg:hidden" aria-label="Abrir menú">
        <Menu size={22} />
      </button>
      <div className="lg:hidden">
        <Brand />
      </div>

      <div className="ml-1 hidden flex-1 sm:block">
        <SearchBox />
      </div>
      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-1.5">
        {user && !isGuest && (
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="icon-btn relative"
            aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[17px] place-items-center rounded-full bg-gradient-to-r from-violet to-primary px-1 text-[9px] font-bold text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        )}

        {!user || isGuest ? (
          <Link to="/login" className="btn btn-grad btn-sm sm:px-4">
            Entrar
          </Link>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full p-0.5 transition hover:bg-white/5"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menú de usuario"
            >
              <Avatar name={user.username} src={user.avatar} size={34} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-line p-1.5 shadow-2xl"
                  style={{ background: '#0d1728' }}
                  role="menu"
                >
                  <div className="px-2.5 py-2">
                    <p className="truncate text-[13px] font-semibold text-fg">
                      {user.fullName || user.username}
                    </p>
                    <p className="truncate text-[11px] text-dim">@{user.username}</p>
                  </div>
                  <div className="divider my-1" />
                  <Link
                    to={`/u/${user.id}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-muted transition hover:bg-white/5 hover:text-fg"
                    role="menuitem"
                  >
                    <Home size={14} /> Mi perfil
                  </Link>
                  <Link
                    to={`/u/${user.id}?edit=1`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-muted transition hover:bg-white/5 hover:text-fg"
                    role="menuitem"
                  >
                    <Settings size={14} /> Editar perfil
                  </Link>
                  <Link
                    to="/reports"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-muted transition hover:bg-white/5 hover:text-fg"
                    role="menuitem"
                  >
                    <ShieldAlert size={14} /> Reportar contenido
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Drawer (móvil)                                */
/* -------------------------------------------------------------------------- */

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <div className={clsx('fixed inset-0 z-[70] lg:hidden', !open && 'pointer-events-none')}>
      <div
        className={clsx(
          'absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          'absolute inset-y-0 left-0 flex w-[290px] max-w-[86vw] flex-col overflow-y-auto border-r border-line px-3.5 py-4 transition-transform duration-250',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: 'linear-gradient(180deg, #0b1424, #081020)' }}
      >
        <div className="flex items-center justify-between px-1.5 pb-5">
          <Brand />
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>

        <NavSection title="Menú principal" />
        <SideNav onNavigate={onClose} />
        <CreateSection onNavigate={onClose} />
        <div className="mt-5">
          <NavSection title="Ayuda" />
          <div className="flex flex-col gap-0.5">
            {HELP_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {user && (
          <div className="mt-5 flex items-center gap-2 px-2.5 text-[11.5px] text-dim">
            <Map size={13} /> Sesión de {user.isGuest ? 'invitado' : 'miembro'}
          </div>
        )}

        <div className="mt-auto pt-4">
          <UserCard />
        </div>
      </div>
    </div>
  )
}

export { Brand }
