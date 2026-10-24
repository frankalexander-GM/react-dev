import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Compass,
  Flame,
  FlaskConical,
  Hash,
  Radio,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { discoveryApi, postsApi, usersApi } from '../lib/services'
import type { DiscoverData, Post } from '../lib/types'
import { compact } from '../lib/format'
import { mediaUrl } from '../lib/api'
import { useContentCreated } from '../lib/contentEvents'
import { InlineComposer } from '../components/post/InlineComposer'
import { PostList } from '../components/post/PostList'
import { UserRow } from '../components/user/UserRow'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Tabs } from '../components/ui/Primitives'
import { useCreate } from '../components/create/CreateProvider'

const PAGE_SIZE = 12

type FeedTab = 'recent' | 'top' | 'betas'

export function HomePage() {
  const { user, canWrite } = useAuth()
  const { open } = useCreate()
  const toast = useToast()

  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<FeedTab>('recent')
  const [discover, setDiscover] = useState<DiscoverData | null>(null)
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const [followBusy, setFollowBusy] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Inicio · DevPlay'
  }, [])

  const load = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }
    try {
      const page = await postsApi.list({
        skip: reset ? 0 : posts.length,
        limit: PAGE_SIZE,
      })
      setTotal(page.total)
      setPosts((current) => (reset ? page.items : [...current, ...page.items]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el feed')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [posts.length])

  useEffect(() => {
    void load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    discoveryApi
      .discover()
      .then(setDiscover)
      .catch(() => setDiscover(null))
  }, [])

  useContentCreated(() => {
    void load(true)
    discoveryApi.discover().then(setDiscover).catch(() => undefined)
  })

  const visiblePosts = useMemo(() => {
    if (tab === 'top') {
      return [...posts].sort(
        (a, b) => b.likesCount + b.commentsCount - (a.likesCount + a.commentsCount),
      )
    }
    if (tab === 'betas') return posts.filter((post) => post.type === 'BETA')
    return posts
  }, [posts, tab])

  const betasCount = posts.filter((post) => post.type === 'BETA').length

  const follow = async (userId: string, username: string) => {
    if (!canWrite) {
      toast.info('Entra con una cuenta para seguir devs.')
      return
    }
    setFollowBusy(userId)
    try {
      const active = following[userId]
      if (active) {
        await usersApi.unfollow(userId)
        setFollowing((current) => ({ ...current, [userId]: false }))
      } else {
        await usersApi.follow(userId)
        setFollowing((current) => ({ ...current, [userId]: true }))
        toast.success(`Ahora sigues a @${username}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el seguimiento')
    } finally {
      setFollowBusy(null)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_312px]">
      <div className="min-w-0 space-y-4">
        {/* --------------------------------------------------------------- hero */}
        <section className="glass relative overflow-hidden p-5 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, #00F0FF, transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }}
          />

          <div className="relative grid gap-6 md:grid-cols-[1fr_240px] md:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge border-cyan/30 bg-cyan/10 text-cyan">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan" />
                  Comunidad indie
                </span>
                <span className="badge text-muted">builds tempranas</span>
              </div>

              <h1 className="max-w-[540px] font-display text-[28px] font-extrabold leading-[1.12] text-fg sm:text-[38px]">
                Donde tus juegos <span className="text-grad">encuentran testers.</span>
              </h1>
              <p className="mt-2.5 max-w-[500px] text-[13px] leading-relaxed text-muted sm:text-[14px]">
                Comparte builds, recibe feedback de verdad y descubre lo que la comunidad está
                creando ahora mismo. Sin ruido, sin métricas vacías.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => (canWrite ? open('beta') : toast.info('Entra para publicar tu beta.'))}
                  className="btn btn-grad"
                >
                  <Rocket size={15} />
                  Publicar mi juego
                </button>
                <Link to="/discover" className="btn btn-ghost">
                  <Compass size={15} />
                  Explorar tendencias
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="rounded-xl border border-line bg-black/40 p-3 font-mono text-[10.5px] leading-relaxed text-muted/90">
                <p className="mb-1.5 flex items-center gap-1.5 text-cyan">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan" />
                  devplay@api ~ %
                </p>
                <p>
                  <span className="text-violet">$</span> devplay status
                </p>
                <p className="text-dim">api · · · · · · · online</p>
                <p className="text-dim">posts · · · · · {compact(total)}</p>
                <p className="text-dim">betas · · · · · {compact(discover?.popularBetas.length ?? 0)}</p>
                <p className="text-dim">tags · · · · · · {compact(discover?.popularTags.length ?? 0)}</p>
                <p className="mt-1 text-emerald-300">✔ listo para testear</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- composer */}
        {user && <InlineComposer />}

        {/* -------------------------------------------------------- beta strip */}
        {discover && discover.popularBetas.length > 0 && (
          <section>
            <SectionHeader
              icon={FlaskConical}
              title="Betas que deberías probar"
              subtitle="Builds tempranas que buscan testers"
              action={
                <Link to="/betas" className="flex items-center gap-1 text-[11.5px] font-semibold text-cyan hover:underline">
                  Ver todas <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {discover.popularBetas.slice(0, 2).map((beta) => (
                <Link
                  key={beta.id}
                  to={`/betas/${beta.id}`}
                  className="glass-soft group flex gap-3 p-2.5 transition hover:border-cyan/30"
                >
                  <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-raised">
                    {mediaUrl(beta.coverImage) ? (
                      <img
                        src={mediaUrl(beta.coverImage) as string}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-violet">
                        <FlaskConical size={22} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="truncate text-[13px] font-semibold text-fg group-hover:text-cyan">
                      {beta.title}
                    </p>
                    <p className="line-clamp-2 text-[11px] leading-snug text-muted">
                      {beta.description}
                    </p>
                    <p className="mt-1 text-[10px] text-dim">
                      {beta.genre ?? 'Indie'} · {compact(beta.downloads)} descargas
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- feed */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-[17px] font-bold text-fg">Tu feed</h2>
            <Tabs
              tabs={[
                { id: 'recent', label: 'Recientes' },
                { id: 'top', label: 'Destacados' },
                { id: 'betas', label: 'Betas', count: betasCount },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>

          <PostList
            posts={visiblePosts}
            loading={loading}
            error={error}
            onRetry={() => void load(true)}
            onRemoved={(id) => {
              setPosts((current) => current.filter((post) => post.id !== id))
              setTotal((value) => Math.max(0, value - 1))
            }}
            emptyTitle={tab === 'betas' ? 'Aún no hay betas en el feed' : 'El feed está vacío'}
            emptyDescription={
              tab === 'betas'
                ? 'Sé el primero en publicar una build temprana.'
                : 'Publica algo o vuelve en un rato: la comunidad está despertando.'
            }
            emptyAction={
              canWrite ? (
                <button type="button" className="btn btn-grad btn-sm" onClick={() => open('post')}>
                  <Sparkles size={14} /> Crear publicación
                </button>
              ) : undefined
            }
          />

          {!loading && !error && posts.length < total && tab !== 'betas' && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void load(false)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Cargando…' : `Cargar más (${posts.length}/${total})`}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ---------------------------------------------------------------- rail */}
      <aside className="hidden space-y-3 xl:block">
        <div className="sticky top-[78px] space-y-3">
          <div className="glass p-3.5">
            <SectionHeader icon={Users} title="Devs recomendados" />
            <div className="space-y-0.5">
              {(discover?.recommendedUsers ?? []).slice(0, 5).map((person) => (
                <UserRow
                  key={person.id}
                  user={person}
                  compactMode
                  following={following[person.id]}
                  busy={followBusy === person.id}
                  onFollow={() => void follow(person.id, person.username)}
                />
              ))}
              {!discover?.recommendedUsers.length && (
                <p className="px-1 py-2 text-[12px] text-dim">
                  Cuando haya más movimiento verás devs aquí.
                </p>
              )}
            </div>
            {discover?.recommendedUsers.length ? (
              <Link
                to="/discover"
                className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-cyan hover:underline"
              >
                Descubrir más <ArrowRight size={12} />
              </Link>
            ) : null}
          </div>

          <div className="glass p-3.5">
            <SectionHeader icon={Hash} title="Tags populares" />
            <div className="flex flex-wrap gap-1.5">
              {(discover?.popularTags ?? []).slice(0, 10).map((tag) => (
                <Link
                  key={tag.tag}
                  to={`/search?q=${encodeURIComponent(tag.tag)}`}
                  className="chip"
                >
                  #{tag.tag}
                  <span className="mono text-[10px] opacity-60">{tag.count}</span>
                </Link>
              ))}
              {!discover?.popularTags.length && (
                <p className="text-[12px] text-dim">Todavía no hay tags.</p>
              )}
            </div>
          </div>

          <div className="glass p-3.5">
            <SectionHeader icon={Flame} title="Betas populares" />
            <div className="space-y-1">
              {(discover?.popularBetas ?? []).slice(0, 3).map((beta) => (
                <Link
                  key={beta.id}
                  to={`/betas/${beta.id}`}
                  className="flex items-center gap-2 rounded-lg px-1 py-1.5 transition hover:bg-white/[0.04]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-violet/15 text-violet">
                    <FlaskConical size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-fg">
                      {beta.title}
                    </span>
                    <span className="block text-[10px] text-dim">
                      {compact(beta.downloads)} descargas
                    </span>
                  </span>
                </Link>
              ))}
              {!discover?.popularBetas.length && (
                <p className="text-[12px] text-dim">Sin betas destacadas aún.</p>
              )}
            </div>
          </div>

          <div className="glass-soft flex items-start gap-2 p-3">
            <Radio size={15} className="mt-0.5 shrink-0 text-cyan" />
            <p className="text-[11px] leading-relaxed text-dim">
              Feed en vivo contra <span className="mono text-muted">/api/v1/posts</span>. Los likes,
              guardados y encuestas son toggles reales.
            </p>
          </div>
        </div>
      </aside>

    </div>
  )
}
