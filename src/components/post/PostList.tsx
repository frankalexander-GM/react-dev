import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'
import type { Post } from '../../lib/types'
import { PostCard } from './PostCard'
import { PostSkeleton } from '../ui/Primitives'

export function PostList({
  posts,
  loading,
  error,
  onRetry,
  onRemoved,
  emptyTitle = 'Todavía no hay publicaciones',
  emptyDescription = 'Cuando la comunidad publique algo, aparecerá aquí.',
  emptyAction,
}: {
  posts: Post[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onRemoved?: (id: string) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass flex flex-col items-center gap-2 px-6 py-10 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-red-400/25 bg-red-500/10 text-red-300">
          <AlertTriangle size={20} />
        </span>
        <p className="text-[13px] font-semibold text-fg">No se pudo cargar el feed</p>
        <p className="max-w-sm text-[12px] text-muted">{error}</p>
        {onRetry && (
          <button type="button" className="btn btn-ghost btn-sm mt-1" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
          <Inbox size={20} />
        </span>
        <p className="font-display text-[15px] font-bold text-fg">{emptyTitle}</p>
        <p className="max-w-sm text-[12.5px] text-muted">{emptyDescription}</p>
        {emptyAction && <div className="mt-2">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onRemoved={onRemoved} />
      ))}
    </div>
  )
}
