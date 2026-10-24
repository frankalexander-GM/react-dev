import { useEffect, useState } from 'react'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Comment } from '../../lib/types'
import { authorName } from '../../lib/types'
import { postsApi } from '../../lib/services'
import { relativeTime } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { PostSkeleton } from '../ui/Primitives'

interface CommentSheetProps {
  open: boolean
  onClose: () => void
  postId: string
  onAdded: () => void
  onDeleted: () => void
}

export function CommentSheet({ open, onClose, postId, onAdded, onDeleted }: CommentSheetProps) {
  const { user, canWrite } = useAuth()
  const toast = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    postsApi
      .comments(postId)
      .then((items) => {
        if (alive) setComments(items)
      })
      .catch((error: unknown) => {
        if (alive) {
          toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los comentarios')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [open, postId, toast])

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
      onAdded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo comentar')
    } finally {
      setSending(false)
    }
  }

  const remove = async (comment: Comment) => {
    try {
      await postsApi.deleteComment(postId, comment.id)
      setComments((current) => current.filter((item) => item.id !== comment.id))
      onDeleted()
      toast.success('Comentario eliminado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comentarios"
      subtitle={`${comments.length} en esta publicación`}
      size="md"
      footer={
        <div className="flex w-full items-end gap-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void submit()
            }}
            rows={1}
            maxLength={2000}
            placeholder={canWrite ? 'Escribe un comentario…' : 'Entra para comentar'}
            disabled={!canWrite}
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
      }
    >
      {user && (
        <div className="mb-4 flex items-center gap-2 text-[11.5px] text-dim">
          <Avatar name={user.username} src={user.avatar} size={24} />
          Comentando como <span className="text-muted">@{user.username}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
            <MessageCircle size={20} />
          </span>
          <p className="text-[13px] font-semibold text-fg">Todavía no hay comentarios</p>
          <p className="text-[12px] text-muted">Sé el primero en aportar algo útil.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="group flex gap-2.5 rounded-xl px-1 py-2 hover:bg-white/[0.03]">
              <Link to={comment.author ? `/u/${comment.author.id}` : '#'} className="shrink-0">
                <Avatar
                  name={comment.author?.username ?? 'devplay'}
                  src={comment.author?.avatar}
                  size={32}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[12.5px] font-semibold text-fg">
                    {authorName(comment.author)}
                  </span>
                  <span className="text-[10.5px] text-dim">· {relativeTime(comment.createdAt)}</span>
                  {user?.id === comment.author?.id && (
                    <button
                      type="button"
                      onClick={() => remove(comment)}
                      className="ml-auto text-dim opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                      aria-label="Eliminar comentario"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-snug text-fg/85">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
