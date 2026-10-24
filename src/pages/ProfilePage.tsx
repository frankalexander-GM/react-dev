import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Award,
  Bookmark,
  CalendarDays,
  Coins,
  Download,
  Globe,
  Heart,
  Images,
  Lock,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  ShieldAlert,
  ShieldBan,
  UserMinus,
  UserPlus,
  Users,
  Zap,
  Briefcase,
} from 'lucide-react'
import clsx from 'clsx'
import { securityApi, usersApi } from '../lib/services'
import type { Achievement, FollowUser, Post, ProfileUser, UserStats } from '../lib/types'
import { compact, fullDate } from '../lib/format'
import { mediaUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useContentCreated } from '../lib/contentEvents'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { EmptyState, Skeleton, Tabs } from '../components/ui/Primitives'
import { PostList } from '../components/post/PostList'
import { ReportModal } from '../components/post/ReportModal'
import { EditProfileModal } from '../components/profile/EditProfileModal'

type ProfileTab = 'posts' | 'media' | 'saved' | 'achievements'

const ROLE_LABEL: Record<string, string> = {
  DEV: 'Desarrollador',
  USER: 'Jugador',
  ADMIN: 'Admin',
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, canWrite } = useAuth()
  const toast = useToast()

  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [status, setStatus] = useState<{ following: boolean; followersCount: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<ProfileTab>('posts')
  const [followBusy, setFollowBusy] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [saved, setSaved] = useState<Post[] | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteBlockOpen, setDeleteBlockOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [followList, setFollowList] = useState<{
    title: string
    loading: boolean
    items: FollowUser[]
  } | null>(null)

  const isOwn = Boolean(user && userId && user.id === userId)
  const editOpen = searchParams.get('edit') === '1'

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [data, follow] = await Promise.all([
        usersApi.profile(userId),
        usersApi.followStatus(userId).catch(() => null),
      ])
      setProfile(data.user)
      setPosts(data.posts)
      setStatus(follow ? { following: follow.following, followersCount: follow.followersCount } : null)
      document.title = `${data.user.fullName || data.user.username} · DevPlay`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  useContentCreated(() => void load())

  useEffect(() => {
    if (!isOwn || !canWrite) return
    usersApi
      .stats()
      .then(setStats)
      .catch(() => setStats(null))
    usersApi
      .achievements()
      .then((data) => setAchievements(data.items))
      .catch(() => setAchievements([]))
  }, [isOwn, canWrite])

  useEffect(() => {
    if (tab !== 'saved' || !isOwn || saved) return
    usersApi
      .bookmarks()
      .then(setSaved)
      .catch(() => setSaved([]))
  }, [tab, isOwn, saved])

  const media = useMemo(
    () =>
      posts.flatMap((post) =>
        post.media
          .filter((item) => item.kind === 'image')
          .map((item) => ({ url: item.url, postId: post.id, key: `${post.id}-${item.url}` })),
      ),
    [posts],
  )

  if (!userId) return null

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-[13px] text-red-300">{error ?? 'Perfil no encontrado'}</p>
        <Link to="/discover" className="btn btn-ghost btn-sm mt-3">
          Volver a Descubrir
        </Link>
      </div>
    )
  }

  const banner = mediaUrl(profile.banner)
  const followers = status?.followersCount ?? profile.followersCount
  const following = profile.followingCount

  const toggleFollow = async () => {
    if (!canWrite) {
      toast.info('Entra con una cuenta para seguir devs.')
      return
    }
    setFollowBusy(true)
    const next = !(status?.following ?? profile.isFollowing)
    try {
      if (next) await usersApi.follow(profile.id)
      else await usersApi.unfollow(profile.id)
      setStatus({
        following: next,
        followersCount: Math.max(0, followers + (next ? 1 : -1)),
      })
      setProfile((current) =>
        current
          ? {
              ...current,
              isFollowing: next,
              followersCount: Math.max(0, current.followersCount + (next ? 1 : -1)),
            }
          : current,
      )
      toast.success(next ? `Sigues a @${profile.username}` : `Dejaste de seguir a @${profile.username}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el seguimiento')
    } finally {
      setFollowBusy(false)
    }
  }

  const openList = async (kind: 'followers' | 'following') => {
    setFollowList({
      title: kind === 'followers' ? 'Seguidores' : 'Siguiendo',
      loading: true,
      items: [],
    })
    try {
      const items =
        kind === 'followers'
          ? await usersApi.followers(profile.id)
          : await usersApi.following(profile.id)
      setFollowList({
        title: kind === 'followers' ? 'Seguidores' : 'Siguiendo',
        loading: false,
        items,
      })
    } catch {
      setFollowList({ title: 'Lista', loading: false, items: [] })
    }
  }

  const block = async () => {
    try {
      if (profile.isBlocked) await securityApi.unblock(profile.id)
      else await securityApi.block(profile.id)
      setProfile({ ...profile, isBlocked: !profile.isBlocked })
      toast.success(profile.isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado')
      setDeleteBlockOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo bloquear')
    }
  }

  const tabs: { id: ProfileTab; label: string; count?: number }[] = [
    { id: 'posts', label: 'Publicaciones', count: posts.length },
    { id: 'media', label: 'Multimedia', count: media.length },
  ]
  if (isOwn) {
    tabs.push({ id: 'saved', label: 'Guardados', count: saved?.length })
    tabs.push({ id: 'achievements', label: 'Logros', count: achievements.filter((a) => a.unlocked).length })
  }

  return (
    <div className="space-y-4">
      <section className="glass overflow-hidden">
        <div
          className="relative h-[170px] w-full sm:h-[210px]"
          style={{
            background: banner
              ? undefined
              : 'radial-gradient(600px 260px at 10% 0%, rgba(0,240,255,0.35), transparent 65%), radial-gradient(600px 300px at 90% 100%, rgba(139,92,246,0.4), transparent 65%), #0b1526',
          }}
        >
          {banner && <img src={banner} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220] via-transparent to-transparent" />

          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {isOwn ? (
              <Link
                to={`/u/${profile.id}?edit=1`}
                className="btn btn-ghost btn-sm bg-black/40 backdrop-blur"
              >
                <Pencil size={13} /> Editar perfil
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="icon-btn bg-black/40 backdrop-blur"
                  aria-label="Más opciones del perfil"
                >
                  <MoreHorizontal size={17} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div
                      className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-line p-1 shadow-2xl"
                      style={{ background: '#0d1728' }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setReportOpen(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-muted hover:bg-white/5 hover:text-fg"
                      >
                        <ShieldAlert size={14} /> Reportar usuario
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setDeleteBlockOpen(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-red-300 hover:bg-red-500/10"
                      >
                        <ShieldBan size={14} />
                        {profile.isBlocked ? 'Desbloquear' : 'Bloquear usuario'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-5">
          <div className="-mt-11 flex flex-wrap items-end gap-3">
            <Avatar
              name={profile.username}
              src={profile.avatar}
              size={88}
              ring
              className="border-4 border-[#0b1424]"
            />
            <div className="mb-1 flex flex-1 flex-wrap items-center gap-2">
              <div className="min-w-0">
                <h1 className="truncate font-display text-[24px] font-extrabold leading-tight text-fg">
                  {profile.fullName || profile.username}
                </h1>
                <p className="truncate text-[12.5px] text-dim">@{profile.username}</p>
              </div>
              <span className="badge border-violet/30 bg-violet/10 text-violet-200">
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
              {profile.isGuest && <span className="badge text-muted">Invitado</span>}
              {profile.isBlocked && (
                <span className="badge border-red-400/30 bg-red-500/10 text-red-300">
                  <ShieldBan size={10} /> Bloqueado
                </span>
              )}
            </div>

            <div className="mb-1 flex items-center gap-2">
              {!isOwn && (
                <>
                  <button
                    type="button"
                    className={clsx('btn btn-sm', status?.following ?? profile.isFollowing ? 'btn-ghost' : 'btn-grad')}
                    onClick={() => void toggleFollow()}
                    disabled={followBusy}
                  >
                    {status?.following ?? profile.isFollowing ? (
                      <>
                        <UserMinus size={13} /> Siguiendo
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} /> Seguir
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/chat/${profile.id}`)}
                  >
                    <MessageSquare size={13} /> Mensaje
                  </button>
                </>
              )}
            </div>          </div>

          {profile.bio && (
            <p className="mt-3 max-w-[680px] whitespace-pre-wrap text-[13px] leading-relaxed text-fg/85">
              {profile.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-dim">
            {profile.profession && (
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} /> {profile.profession}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-cyan/90 hover:underline"
              >
                <Globe size={13} /> {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} /> Se unió en {fullDate(profile.createdAt)}
            </span>
          </div>

          {profile.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.tags.map((tag) => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="chip py-0.5 text-[10.5px]">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-line/70 pt-3">
            <span className="text-[12px] text-muted">
              <strong className="text-fg">{compact(posts.length || profile.postsCount)}</strong>{' '}
              publicaciones
            </span>
            <button
              type="button"
              onClick={() => void openList('followers')}
              className="text-[12px] text-muted hover:text-cyan"
            >
              <strong className="text-fg">{compact(followers)}</strong> seguidores
            </button>
            <button
              type="button"
              onClick={() => void openList('following')}
              className="text-[12px] text-muted hover:text-cyan"
            >
              <strong className="text-fg">{compact(following)}</strong> siguiendo
            </button>
            {profile.blockedMe && (
              <span className="flex items-center gap-1 text-[11px] text-orange-300">
                <Lock size={12} /> Perfil privado
              </span>
            )}
          </div>
        </div>
      </section>

      {isOwn && stats && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard icon={Zap} label="Nivel" value={`${stats.level}`} hint={`${stats.points} pts`} />
          <StatCard
            icon={Heart}
            label="Likes recibidos"
            value={compact(stats.totalLikesReceived)}
            hint={`${compact(stats.likes)} dados`}
          />
          <StatCard
            icon={Download}
            label="Descargas"
            value={compact(stats.totalDownloads)}
            hint={`${compact(stats.betas)} betas`}
          />
          <StatCard
            icon={Coins}
            label="DevCoins"
            value={compact(user?.devCoins ?? 0)}
            hint={`${compact(stats.bookmarks)} guardados`}
          />
        </div>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'posts' && (
        <PostList
          posts={posts}
          emptyTitle="Sin publicaciones todavía"
          emptyDescription={
            isOwn ? 'Publica tu primer avance para empezar.' : 'Este perfil aún no ha publicado nada.'
          }
          onRemoved={(id) => setPosts((current) => current.filter((post) => post.id !== id))}
        />
      )}

      {tab === 'media' &&
        (media.length === 0 ? (
          <EmptyState icon={Images} title="Sin multimedia" description="Las imágenes de sus posts aparecerán aquí." />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {media.map((item) => (
              <Link
                key={item.key}
                to={`/post/${item.postId}`}
                className="aspect-square overflow-hidden rounded-xl border border-line bg-black/30"
              >
                <img
                  src={mediaUrl(item.url) ?? item.url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition hover:scale-[1.02]"
                />
              </Link>
            ))}
          </div>
        ))}

      {tab === 'saved' &&
        (saved === null ? (
          <Skeleton className="h-28" />
        ) : (
          <PostList
            posts={saved}
            emptyTitle="Nada guardado"
            emptyDescription="Guarda publicaciones con el marcador para leerlas luego."
          />
        ))}

      {tab === 'achievements' && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {achievements.map((achievement) => {
            const pct = achievement.target
              ? Math.min(100, Math.round((achievement.progress / achievement.target) * 100))
              : 0
            return (
              <div
                key={achievement.id}
                className={clsx(
                  'glass flex gap-3 p-3.5',
                  !achievement.unlocked && 'opacity-70',
                )}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/10 text-[20px]">
                  {achievement.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-fg">{achievement.label}</p>
                    {achievement.unlocked && <Award size={13} className="shrink-0 text-cyan" />}
                  </div>
                  <p className="line-clamp-1 text-[11px] text-muted">{achievement.description}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
                      style={{ width: `${achievement.unlocked ? 100 : pct}%` }}
                    />
                  </div>
                  <p className="mono mt-1 text-[9.5px] text-dim">
                    {achievement.progress}/{achievement.target} · {achievement.tier}
                  </p>
                </div>
              </div>
            )
          })}
          {achievements.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState icon={Award} title="Sin logros aún" description="Publica, comenta y comparte para desbloquearlos." />
            </div>
          )}
        </div>
      )}

      {isOwn && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setSearchParams({}, { replace: true })}
          profile={profile}
          onSaved={() => void load()}
        />
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        entityType="USER"
        entityId={profile.id}
      />

      <Modal
        open={deleteBlockOpen}
        onClose={() => setDeleteBlockOpen(false)}
        title={profile.isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteBlockOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={block}>
              <ShieldBan size={14} /> {profile.isBlocked ? 'Desbloquear' : 'Bloquear'}
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-muted">
          {profile.isBlocked
            ? 'Volverás a ver su contenido y podrá seguirte.'
            : 'Dejarás de ver su contenido y no podrá interactuar contigo.'}
        </p>
      </Modal>

      <Modal
        open={Boolean(followList)}
        onClose={() => setFollowList(null)}
        title={followList?.title ?? 'Lista'}
        size="sm"
      >
        {followList?.loading ? (
          <Skeleton className="h-24" />
        ) : followList?.items.length ? (
          <ul className="space-y-1">
            {followList.items.map((person) => (
              <li key={person.id}>
                <Link
                  to={`/u/${person.id}`}
                  onClick={() => setFollowList(null)}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-2 hover:bg-white/[0.04]"
                >
                  <Avatar name={person.username} src={person.avatar} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-fg">@{person.username}</p>
                    <p className="truncate text-[10.5px] text-dim">
                      {person.bio || `${compact(person.followersCount)} seguidores`}
                    </p>
                  </div>
                  <Users size={13} className="text-dim" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-[12px] text-dim">Todavía no hay nadie aquí.</p>
        )}
      </Modal>

      <div className="flex items-center justify-center gap-1.5 pb-2 text-[10.5px] text-dim">
        <Bookmark size={11} /> Perfil público servido por{' '}
        <span className="mono">/api/v1/users/{profile.id.slice(0, 6)}…</span>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Zap
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="glass-soft flex items-center gap-2.5 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan/10 text-cyan">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-wide text-dim">{label}</p>
        <p className="mono truncate text-[15px] font-bold text-fg">{value}</p>
        <p className="truncate text-[9.5px] text-dim">{hint}</p>
      </div>
    </div>
  )
}
