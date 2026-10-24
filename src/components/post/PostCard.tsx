import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Bookmark,
  Download,
  ExternalLink,
  FlaskConical,
  Heart,
  ImageOff,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
  Trash2,
  Video,
  Flag,
  Link2,
  FileText,
} from 'lucide-react'
import clsx from 'clsx'
import type { Post } from '../../lib/types'
import { authorName } from '../../lib/types'
import { compact, copyText, relativeTime } from '../../lib/format'
import { mediaUrl } from '../../lib/api'
import { postsApi } from '../../lib/services'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useBetaForPost } from '../../lib/betasIndex'
import { Avatar } from '../ui/Avatar'
import { Modal } from '../ui/Modal'
import { PollBlock } from './PollBlock'
import { CommentSheet } from './CommentSheet'
import { ReportModal } from './ReportModal'

const TYPE_META = {
  POST: { label: 'Publicación', icon: FileText },
  BETA: { label: 'Beta', icon: FlaskConical },
  STREAM: { label: 'Directo', icon: Video },
  POLL: { label: 'Encuesta', icon: BarChart3 },
} as const

interface PostCardProps {
  post: Post
  onRemoved?: (id: string) => void
  onChanged?: (post: Post) => void
}

export function PostCard({ post, onRemoved }: PostCardProps) {
  const { user, canWrite } = useAuth()
  const toast = useToast()

  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likesCount)
  const [saved, setSaved] = useState(post.bookmarked)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [pop, setPop] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reposting, setReposting] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const beta = useBetaForPost(post.id, post.type === 'BETA')
  const meta = TYPE_META[post.type] ?? TYPE_META.POST
  const TypeIcon = meta.icon
  const author = post.author
  const isOwn = Boolean(user && author && user.id === author.id)

  const requireAccount = () => {
    if (!canWrite) {
      toast.info('Inicia sesión con una cuenta para interactuar.')
      return false
    }
    return true
  }

  const toggleLike = async () => {
    if (!requireAccount()) return
    const next = !liked
    setLiked(next)
    setLikes((value) => Math.max(0, value + (next ? 1 : -1)))
    if (next) {
      setPop(true)
      window.setTimeout(() => setPop(false), 450)
    }
    try {
      const result = await postsApi.like(post.id)
      setLiked(result.active)
      setLikes(result.count)
    } catch (error) {
      setLiked(!next)
      setLikes((value) => Math.max(0, value + (next ? -1 : 1)))
      toast.error(error instanceof Error ? error.message : 'No se pudo dar me gusta')
    }
  }

  const toggleBookmark = async () => {
    if (!requireAccount()) return
    const next = !saved
    setSaved(next)
    try {
      const result = await postsApi.bookmark(post.id)
      setSaved(result.active)
      toast.success(result.active ? 'Guardado en tu colección' : 'Quitado de guardados')
    } catch (error) {
      setSaved(!next)
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    }
  }

  const repost = async () => {
    if (!requireAccount() || reposting) return
    setReposting(true)
    try {
      await postsApi.repost(post.id)
      toast.success('Republicado en tu perfil')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo repostear'
      toast.info(message.includes('Already') ? 'Ya habías reposteado esta publicación' : message)
    } finally {
      setReposting(false)
    }
  }

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    const ok = await copyText(url)
    toast[ok ? 'success' : 'error'](ok ? 'Enlace copiado al portapapeles' : 'No se pudo copiar')
  }

  const remove = async () => {
    try {
      await postsApi.remove(post.id)
      toast.success('Publicación eliminada')
      setDeleteOpen(false)
      onRemoved?.(post.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar')
    }
  }

  const longContent = post.content.length > 520
  const body =
    longContent && !expanded ? `${post.content.slice(0, 520).trimEnd()}…` : post.content

  return (
    <article className="glass animate-in p-4 sm:p-[18px]">
      {post.repostOf && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] text-cyan/80">
          <Repeat2 size={13} /> Republicado de @{post.repostOf.author?.username ?? 'devplay'}
        </p>
      )}

      <header className="flex items-start gap-2.5">
        <Link to={author ? `/u/${author.id}` : '/discover'} aria-label={`Perfil de ${authorName(author)}`}>
          <Avatar name={author?.username ?? 'devplay'} src={author?.avatar} size={40} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Link
              to={author ? `/u/${author.id}` : '/discover'}
              className="truncate text-[13.5px] font-semibold text-fg hover:text-cyan"
            >
              {authorName(author)}
            </Link>
            <span className="truncate text-[11.5px] text-dim">@{author?.username ?? 'devplay'}</span>
            <span className="text-dim">·</span>
            <Link to={`/post/${post.id}`} className="text-[11.5px] text-dim hover:text-muted">
              {relativeTime(post.createdAt)}
            </Link>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="badge">
              <TypeIcon size={10} />
              {meta.label}
            </span>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Más opciones"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={17} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line p-1 shadow-2xl"
                style={{ background: '#0d1728' }}
                role="menu"
              >
                <MenuItem
                  icon={Link2}
                  label="Copiar enlace"
                  onClick={() => {
                    setMenuOpen(false)
                    void share()
                  }}
                />
                <MenuItem
                  icon={Flag}
                  label="Reportar publicación"
                  onClick={() => {
                    setMenuOpen(false)
                    setReportOpen(true)
                  }}
                />
                {isOwn && (
                  <MenuItem
                    icon={Trash2}
                    label="Eliminar publicación"
                    danger
                    onClick={() => {
                      setMenuOpen(false)
                      setDeleteOpen(true)
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {post.content && (
        <div className="mt-2.5">
          <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-fg/90">
            {body}
          </p>
          {longContent && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-1 text-[11.5px] font-semibold text-cyan hover:underline"
            >
              {expanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}

      {post.media.length > 0 && (
        <div
          className={clsx(
            'mt-3 grid gap-1.5 overflow-hidden rounded-xl',
            post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
          )}
        >
          {post.media.slice(0, 4).map((item, index) => {
            const src = mediaUrl(item.url)
            if (!src) return null
            const more = index === 3 && post.media.length > 4 ? post.media.length - 4 : 0
            return (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => setPreview(src)}
                className={clsx(
                  'group relative overflow-hidden border border-line bg-black/40',
                  post.media.length === 1 ? 'aspect-[16/10] rounded-xl' : 'aspect-video',
                  index === 0 && post.media.length === 1 && 'rounded-xl',
                )}
              >
                {item.kind === 'video' ? (
                  <>
                    <video
                      src={src}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/30">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur">
                        <Video size={18} />
                      </span>
                    </span>
                  </>
                ) : (
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                      event.currentTarget.parentElement?.classList.add('grid', 'place-items-center')
                    }}
                  />
                )}
                {more > 0 && (
                  <span className="absolute inset-0 grid place-items-center bg-black/60 font-display text-xl text-white">
                    +{more}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {post.type === 'POLL' && <PollBlock postId={post.id} />}

      {post.type === 'BETA' && beta && (
        <Link
          to={`/betas/${beta.id}`}
          className="mt-3 flex gap-3 overflow-hidden rounded-xl border border-line bg-black/25 p-2.5 transition hover:border-cyan/30"
        >
          <div className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-lg bg-raised">
            {mediaUrl(beta.coverImage) ? (
              <img
                src={mediaUrl(beta.coverImage) as string}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-violet">
                <FlaskConical size={24} />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex items-center gap-2">
              <p className="truncate text-[13px] font-semibold text-fg">{beta.title}</p>
              {beta.version && (
                <span className="mono shrink-0 text-[10px] text-dim">v{beta.version}</span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted">
              {beta.description}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-dim">
              <span className="flex items-center gap-1">
                <Download size={11} /> {compact(beta.downloads)}
              </span>
              {beta.genre && <span>{beta.genre}</span>}
              <span className="ml-auto flex items-center gap-1 text-cyan">
                Ver beta <ExternalLink size={10} />
              </span>
            </div>
          </div>
        </Link>
      )}

      {post.type === 'BETA' && !beta && (
        <Link to="/betas" className="mt-3 flex items-center gap-2 text-[12px] text-cyan hover:underline">
          <FlaskConical size={14} /> Ver ficha de la beta
        </Link>
      )}

      <footer className="mt-3.5 flex items-center gap-0.5 border-t border-line/70 pt-2.5">
        <ActionButton
          active={liked}
          activeClass="text-red-300"
          label={`${compact(likes)} me gusta`}
          onClick={toggleLike}
        >
          <Heart size={17} className={clsx(pop && 'heart-pop')} fill={liked ? 'currentColor' : 'none'} />
          <span className={clsx('mono text-[11.5px]', liked ? 'text-red-300' : 'text-dim')}>
            {compact(likes)}
          </span>
        </ActionButton>

        <ActionButton
          label="Comentarios"
          onClick={() => setCommentsOpen(true)}
        >
          <MessageCircle size={17} />
          <span className="mono text-[11.5px] text-dim">{compact(commentsCount)}</span>
        </ActionButton>

        <ActionButton label="Repostear" onClick={repost}>
          <Repeat2 size={17} className={clsx(reposting && 'opacity-50')} />
        </ActionButton>

        <ActionButton active={saved} activeClass="text-cyan" label="Guardar" onClick={toggleBookmark}>
          <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
        </ActionButton>

        <ActionButton label="Compartir" onClick={share} className="ml-auto">
          <Share2 size={16} />
        </ActionButton>
      </footer>

      <CommentSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        onAdded={() => setCommentsCount((value) => value + 1)}
        onDeleted={() => setCommentsCount((value) => Math.max(0, value - 1))}
      />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        entityType="POST"
        entityId={post.id}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar publicación"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={remove}>
              <Trash2 size={14} /> Eliminar
            </button>
          </>
        }
      >
        <p className="text-[13px] text-muted">
          Esta acción no se puede deshacer. La publicación y sus comentarios dejarán de estar
          disponibles.
        </p>
      </Modal>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="Vista previa" size="xl">
        {preview && (
          <div className="grid place-items-center">
            {/\.(mp4|webm)(\?|$)/i.test(preview) ? (
              <video src={preview} controls className="max-h-[64vh] w-full rounded-lg" />
            ) : (
              <img src={preview} alt="Vista previa" className="max-h-[64vh] rounded-lg object-contain" />
            )}
            <a
              href={preview}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-1.5 text-[12px] text-cyan hover:underline"
            >
              <ExternalLink size={13} /> Abrir original
            </a>
          </div>
        )}
      </Modal>
    </article>
  )
}

function ActionButton({
  children,
  label,
  onClick,
  active = false,
  activeClass = '',
  className,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  activeClass?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={clsx(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted transition hover:bg-white/5 hover:text-fg',
        active && activeClass,
        className,
      )}
    >
      {children}
    </button>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition',
        danger
          ? 'text-red-300 hover:bg-red-500/10'
          : 'text-muted hover:bg-white/5 hover:text-fg',
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

export { ImageOff }
