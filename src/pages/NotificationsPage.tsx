import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  Radio,
  Trash2,
  UserPlus,
} from 'lucide-react'
import clsx from 'clsx'
import { chatApi } from '../lib/services'
import type { AppNotification } from '../lib/types'
import { relativeTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { EmptyState, Skeleton } from '../components/ui/Primitives'

const ICONS = {
  LIVE: Radio,
  FOLLOW: UserPlus,
  COMMENT: MessageCircle,
  LIKE: Heart,
} as const

export function NotificationsPage() {
  const { canWrite } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Notificaciones · DevPlay'
  }, [])

  const load = async () => {
    if (!canWrite) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const page = await chatApi.notifications(40)
      setItems(page.items)
      setUnread(page.unreadCount)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los avisos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canWrite])

  const markAll = async () => {
    setBusy(true)
    try {
      await chatApi.markAllRead()
      setItems((current) => current.map((item) => ({ ...item, read: true })))
      setUnread(0)
      window.dispatchEvent(new Event('devplay:notifications-read'))
      toast.success('Todo marcado como leído')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo marcar')
    } finally {
      setBusy(false)
    }
  }

  const open = async (notification: AppNotification) => {
    if (!notification.read) {
      try {
        await chatApi.markNotificationRead(notification.id)
        setItems((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        )
        setUnread((value) => Math.max(0, value - 1))
      } catch {
        /* se navega igual */
      }
    }

    if (notification.type === 'FOLLOW') {
      navigate(`/u/${notification.entityId ?? notification.fromUserId}`)
    } else if (notification.entityId) {
      navigate(`/post/${notification.entityId}`)
    }
  }

  const remove = async (id: string) => {
    try {
      await chatApi.removeNotification(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo borrar')
    }
  }

  if (!canWrite) {
    return (
      <EmptyState
        icon={Bell}
        title="Las notificaciones son para miembros"
        description="Entra con tu cuenta para ver quién te sigue, comenta o da like."
        action={
          <Link to="/login" className="btn btn-grad btn-sm">
            Iniciar sesión
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-[24px] font-bold text-fg">Notificaciones</h1>
          <p className="text-[12px] text-muted">
            {unread > 0 ? `${unread} sin leer` : 'Estás al día'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={markAll}
          disabled={busy || unread === 0}
        >
          <CheckCheck size={14} /> Marcar todo leído
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sin notificaciones"
          description="Cuando alguien te siga, comente o reaccione, lo verás aquí."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((notification) => {
            const Icon = ICONS[notification.type as keyof typeof ICONS] ?? Bell
            return (
              <li
                key={notification.id}
                className={clsx(
                  'group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition',
                  notification.read
                    ? 'border-line bg-card/50'
                    : 'border-cyan/25 bg-cyan/[0.06]',
                )}
              >
                <span
                  className={clsx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                    notification.read ? 'bg-white/5 text-muted' : 'bg-cyan/15 text-cyan',
                  )}
                >
                  <Icon size={16} />
                </span>

                <button
                  type="button"
                  onClick={() => void open(notification)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[12.5px] text-fg/90">
                    <span className="font-semibold text-fg">@{notification.fromUsername}</span>{' '}
                    {notification.message}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-dim">
                    {relativeTime(notification.createdAt)}
                  </p>
                </button>

                {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan" />}

                <button
                  type="button"
                  onClick={() => void remove(notification.id)}
                  className="text-dim opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                  aria-label="Borrar notificación"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
