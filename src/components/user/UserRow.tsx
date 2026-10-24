import { Link } from 'react-router-dom'
import { UserPlus, UserCheck } from 'lucide-react'
import type { UserSearchItem } from '../../lib/types'
import { compact } from '../../lib/format'
import { Avatar } from '../ui/Avatar'

export function UserRow({
  user,
  following,
  onFollow,
  busy = false,
  compactMode = false,
}: {
  user: UserSearchItem
  following?: boolean
  onFollow?: () => void
  busy?: boolean
  compactMode?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-1 py-2 transition hover:bg-white/[0.03]">
      <Link to={`/u/${user.id}`} className="shrink-0">
        <Avatar name={user.username} src={user.avatar} size={compactMode ? 34 : 40} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/u/${user.id}`}
          className="block truncate text-[13px] font-semibold text-fg hover:text-cyan"
        >
          {user.fullName || user.username}
        </Link>
        <p className="truncate text-[11.5px] text-dim">
          @{user.username}
          {typeof user.followersCount === 'number' && (
            <span> · {compact(user.followersCount)} seguidores</span>
          )}
        </p>
        {!compactMode && user.bio && (
          <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted">{user.bio}</p>
        )}
      </div>

      {onFollow && (
        <button
          type="button"
          onClick={onFollow}
          disabled={busy}
          className={`btn btn-sm shrink-0 ${following ? 'btn-ghost' : 'btn-soft'}`}
        >
          {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
          {following ? 'Siguiendo' : 'Seguir'}
        </button>
      )}
    </div>
  )
}
