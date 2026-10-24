import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Send, Trash2 } from 'lucide-react'
import { postsApi } from '../lib/services'
import type { Comment, Post } from '../lib/types'
import { authorName } from '../lib/types'
import { relativeTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PostCard } from '../components/post/PostCard'
import { Avatar } from '../components/ui/Avatar'
import { PostSkeleton, Skeleton } from '../components/ui/Primitives'

export function PostPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) return
    let alive = true
    setLoading(true)
    postsApi
      .get(postId)
      .then((data) => {
        if (alive) {
          setPost(data)
          document.title = `Publicación de @${data.author?.username ?? 'devplay'} · DevPlay`
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'No se pudo cargar la publicación')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [postId])

  if (loading) {
    return (
      <div className="space-y-3">
        <PostSkeleton />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-[13px] text-red-300">{error ?? 'Publicación no encontrada'}</p>
        <Link to="/" className="btn btn-ghost btn-sm mt-3">
          Volver al feed
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-cyan">
        <ArrowLeft size={14} /> Volver al feed
      </Link>

      <PostCard post={post} onRemoved={() => navigate('/')} />

      {postId && <CommentsPanel postId={postId} />}
    </div>
  )
}

function CommentsPanel({ postId }: { postId: string }) {
  const { user, canWrite } = useAuth()
  const toast = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let alive = true
    postsApi
      .comments(postId)
      .then((items) => {
        if (alive) setComments(items)
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [postId])

  const submit = async () => {
    const content = text.trim()
    if (!content || sending) return
    if (!canWrite) {
      toast.info('Entra con tu cuenta para comentar.')
      return
    }
    setSending(true)
    try {
      const created = await postsApi.addComment(postId, content)
      setComments((current) => [...current, created])
      setText('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo comentar')
    } finally {
      setSending(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await postsApi.deleteComment(postId, id)
      setComments((current) => current.filter((comment) => comment.id !== id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar')
    }
  }

  return (
    <section className="glass p-4">
      <h2 className="flex items-center gap-1.5 font-display text-[15px] font-bold text-fg">
        <MessageCircle size={15} className="text-cyan" /> Comentarios
        <span className="mono ml-1 text-[11px] font-normal text-dim">{comments.length}</span>
      </h2>

      <div className="mt-3 flex items-end gap-2">
        {user && <Avatar name={user.username} src={user.avatar} size={32} />}
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void submit()
          }}
          rows={1}
          maxLength={2000}
          disabled={!canWrite}
          placeholder={canWrite ? 'Añade un comentario…' : 'Entra para comentar'}
          className="field max-h-28 min-h-[40px] flex-1 resize-y py-2.5"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || sending || !canWrite}
          className="btn btn-grad h-[40px] px-3.5"
          aria-label="Enviar comentario"
        >
          <Send size={15} />
        </button>
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-16" />
        ) : comments.length === 0 ? (
          <p className="py-5 text-center text-[12px] text-dim">
            Sin comentarios todavía. Sé el primero.
          </p>
        ) : (
          <ul className="space-y-1">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="group flex gap-2.5 rounded-xl px-1 py-2 hover:bg-white/[0.03]"
              >
                <Link to={comment.author ? `/u/${comment.author.id}` : '#'} className="shrink-0">
                  <Avatar
                    name={comment.author?.username ?? 'devplay'}
                    src={comment.author?.avatar}
                    size={30}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-semibold text-fg">
                      {authorName(comment.author)}
                    </span>
                    <span className="text-[10px] text-dim">· {relativeTime(comment.createdAt)}</span>
                    {user?.id === comment.author?.id && (
                      <button
                        type="button"
                        onClick={() => void remove(comment.id)}
                        className="ml-auto text-dim opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                        aria-label="Eliminar comentario"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[12.5px] leading-snug text-fg/85">
                    {comment.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
