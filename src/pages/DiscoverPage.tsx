import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Flame, Hash, Sparkles, TrendingUp, Users } from 'lucide-react'
import { discoveryApi, usersApi } from '../lib/services'
import type { DiscoverData } from '../lib/types'
import { compact } from '../lib/format'
import { useContentCreated } from '../lib/contentEvents'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PostList } from '../components/post/PostList'
import { BetaCard } from '../components/beta/BetaCard'
import { UserRow } from '../components/user/UserRow'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Skeleton } from '../components/ui/Primitives'

export function DiscoverPage() {
  const { canWrite } = useAuth()
  const toast = useToast()
  const [data, setData] = useState<DiscoverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Descubrir · DevPlay'
  }, [])

  const load = () => {
    setLoading(true)
    setError(null)
    discoveryApi
      .discover()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar Descubrir'),
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useContentCreated(load)

  const tags = useMemo(() => data?.popularTags.slice(0, 14) ?? [], [data])

  const follow = async (id: string, username: string) => {
    if (!canWrite) {
      toast.info('Entra con una cuenta para seguir devs.')
      return
    }
    setBusy(id)
    try {
      if (following[id]) {
        await usersApi.unfollow(id)
        setFollowing((current) => ({ ...current, [id]: false }))
      } else {
        await usersApi.follow(id)
        setFollowing((current) => ({ ...current, [id]: true }))
        toast.success(`Ahora sigues a @${username}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo seguir')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="glass relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="badge border-violet/30 bg-violet/10 text-violet-200">
              <Compass size={10} /> Descubrir
            </span>
            <h1 className="mt-2.5 font-display text-[28px] font-extrabold leading-tight text-fg sm:text-[34px]">
              Lo que se cuece <span className="text-grad">antes del lanzamiento</span>
            </h1>
            <p className="mt-1.5 max-w-[520px] text-[13px] text-muted">
              Tendencias, devs que merecen seguirse y builds que todavía no son famosas.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="chip">
              <TrendingUp size={13} /> {compact(data?.trending.length ?? 0)} en tendencia
            </span>
            <span className="chip">
              <Users size={13} /> {compact(data?.recommendedUsers.length ?? 0)} devs
            </span>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : error ? (
        <div className="glass p-6 text-center">
          <p className="text-[13px] text-red-300">{error}</p>
          <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <section>
            <SectionHeader
              icon={Flame}
              title="En tendencia"
              subtitle="Lo que más está moviendo a la comunidad"
            />
            <PostList
              posts={data?.trending ?? []}
              emptyTitle="Sin tendencias todavía"
              emptyDescription="Publica algo y empuja el feed."
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <section>
              <SectionHeader
                icon={Sparkles}
                title="Betas populares"
                subtitle="Builds que buscan testers"
                action={
                  <Link to="/betas" className="flex items-center gap-1 text-[11.5px] font-semibold text-cyan hover:underline">
                    Ver todas <ArrowRight size={12} />
                  </Link>
                }
              />
              {data?.popularBetas.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.popularBetas.slice(0, 4).map((beta) => (
                    <BetaCard key={beta.id} beta={beta} />
                  ))}
                </div>
              ) : (
                <div className="glass px-4 py-8 text-center text-[12.5px] text-muted">
                  Aún no hay betas populares. Sube la tuya y aparece aquí.
                </div>
              )}
            </section>

            <div className="space-y-3">
              <div className="glass p-3.5">
                <SectionHeader icon={Users} title="Devs para seguir" />
                <div className="space-y-0.5">
                  {(data?.recommendedUsers ?? []).map((person) => (
                    <UserRow
                      key={person.id}
                      user={person}
                      compactMode
                      following={following[person.id]}
                      busy={busy === person.id}
                      onFollow={() => void follow(person.id, person.username)}
                    />
                  ))}
                  {!data?.recommendedUsers.length && (
                    <p className="text-[12px] text-dim">Sin recomendaciones por ahora.</p>
                  )}
                </div>
              </div>

              <div className="glass p-3.5">
                <SectionHeader icon={Hash} title="Tags de la semana" />
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Link
                      key={tag.tag}
                      to={`/search?q=${encodeURIComponent(tag.tag)}`}
                      className="chip"
                    >
                      #{tag.tag}
                      <span className="mono text-[10px] opacity-60">{tag.count}</span>
                    </Link>
                  ))}
                  {!tags.length && <p className="text-[12px] text-dim">Sin tags aún.</p>}
                </div>
              </div>
            </div>
          </div>

          <section>
            <SectionHeader icon={Sparkles} title="Recién llegado" subtitle="Lo último del feed" />
            <PostList posts={data?.recent ?? []} />
          </section>
        </>
      )}
    </div>
  )
}
