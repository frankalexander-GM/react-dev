import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, UserSearch, FileText } from 'lucide-react'
import { discoveryApi } from '../lib/services'
import type { SearchData } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { SearchBox } from '../components/layout/SearchBox'
import { PostList } from '../components/post/PostList'
import { UserRow } from '../components/user/UserRow'
import { EmptyState, Skeleton, Tabs } from '../components/ui/Primitives'

type ResultTab = 'all' | 'users' | 'posts'

export function SearchPage() {
  const [params] = useSearchParams()
  const { canWrite } = useAuth()
  const q = (params.get('q') ?? '').trim()

  const [data, setData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<ResultTab>('all')

  useEffect(() => {
    document.title = q ? `Buscar “${q}” · DevPlay` : 'Buscar · DevPlay'
  }, [q])

  useEffect(() => {
    if (q.length < 2) {
      setData(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    discoveryApi
      .search(q, controller.signal)
      .then((result) => setData(result))
      .catch((error: unknown) => {
        if ((error as Error)?.name !== 'AbortError') {
          setData(null)
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [q])

  const users = data?.users ?? []
  const posts = data?.posts ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[24px] font-bold text-fg">Buscar</h1>
        <p className="text-[12px] text-muted">
          Devs, publicaciones y betas. Escribe al menos 2 caracteres.
        </p>
      </div>

      <div className="glass p-3.5">
        <SearchBox autoFocus />
      </div>

      {q.length < 2 ? (
        <EmptyState
          icon={SearchIcon}
          title="¿Qué quieres encontrar?"
          description="Prueba con un nombre de usuario, un género o el título de una beta."
        />
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-muted">
              Resultados para <span className="font-semibold text-fg">“{data?.q ?? q}”</span>
            </p>
            <Tabs
              tabs={[
                { id: 'all', label: 'Todo', count: users.length + posts.length },
                { id: 'users', label: 'Devs', count: users.length },
                { id: 'posts', label: 'Publicaciones', count: posts.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>

          {(tab === 'all' || tab === 'users') && (
            <section className="glass p-3.5">
              <h2 className="mb-1 flex items-center gap-1.5 font-display text-[15px] font-bold text-fg">
                <UserSearch size={15} className="text-cyan" /> Devs
              </h2>
              {users.length ? (
                <div className="space-y-0.5">
                  {users.map((person) => (
                    <UserRow key={person.id} user={person} />
                  ))}
                </div>
              ) : (
                <p className="px-1 py-3 text-[12px] text-dim">Ningún dev coincide.</p>
              )}
            </section>
          )}

          {(tab === 'all' || tab === 'posts') && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 font-display text-[15px] font-bold text-fg">
                <FileText size={15} className="text-cyan" /> Publicaciones
              </h2>
              {posts.length ? (
                <PostList posts={posts} />
              ) : (
                <div className="glass px-4 py-6 text-center text-[12px] text-dim">
                  Ninguna publicación coincide con “{q}”.
                </div>
              )}
            </section>
          )}

          {!loading && users.length === 0 && posts.length === 0 && (
            <p className="text-center text-[11.5px] text-dim">
              {canWrite ? 'Prueba otras palabras.' : 'Entra para buscar en toda la comunidad.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
