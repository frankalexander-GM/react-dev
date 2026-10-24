import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, FlaskConical, Plus, Rocket } from 'lucide-react'
import { betasApi } from '../lib/services'
import { BETA_STATUS_LABEL, type Beta, type BetaStatus } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { useContentCreated } from '../lib/contentEvents'
import { useCreate } from '../components/create/CreateProvider'
import { BetaCard } from '../components/beta/BetaCard'
import { EmptyState, Skeleton } from '../components/ui/Primitives'
import { useToast } from '../context/ToastContext'

const FILTERS: { id: BetaStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'open_beta', label: BETA_STATUS_LABEL.open_beta },
  { id: 'closed_beta', label: BETA_STATUS_LABEL.closed_beta },
  { id: 'alpha', label: BETA_STATUS_LABEL.alpha },
  { id: 'early_access', label: BETA_STATUS_LABEL.early_access },
  { id: 'tech_test', label: BETA_STATUS_LABEL.tech_test },
  { id: 'coming_soon', label: BETA_STATUS_LABEL.coming_soon },
  { id: 'ended', label: BETA_STATUS_LABEL.ended },
]

export function BetasPage() {
  const { canWrite } = useAuth()
  const toast = useToast()
  const { open } = useCreate()
  const [betaStatus, setBetaStatus] = useState<BetaStatus | 'all'>('all')
  const [betas, setBetas] = useState<Beta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Centro de betas · DevPlay'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await betasApi.list({
        limit: 48,
        status: betaStatus === 'all' ? undefined : betaStatus,
      })
      setBetas(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las betas')
    } finally {
      setLoading(false)
    }
  }, [betaStatus])

  useEffect(() => {
    void load()
  }, [load])

  useContentCreated(() => void load())

  return (
    <div className="space-y-4">
      <section className="glass relative overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="badge border-violet/30 bg-violet/10 text-violet-200">
              <FlaskConical size={10} /> Laboratorio
            </span>
            <h1 className="mt-2 font-display text-[26px] font-extrabold text-fg sm:text-[32px]">
              Centro de <span className="text-grad">betas</span>
            </h1>
            <p className="mt-1 max-w-[520px] text-[12.5px] text-muted">
              Builds tempranas de la comunidad. Descarga, prueba y deja feedback que sirva.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-grad"
            onClick={() => {
              if (!canWrite) {
                toast.info('Entra con una cuenta para publicar tu beta.')
                return
              }
              open('beta')
            }}
          >
            <Rocket size={15} /> Publicar beta
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1.5 text-[11px] text-dim">
          <Filter size={13} /> Filtrar
        </span>
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setBetaStatus(filter.id)}
            className={`chip ${betaStatus === filter.id ? 'chip-active' : ''}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="glass p-6 text-center">
          <p className="text-[13px] text-red-300">{error}</p>
          <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : betas.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={betaStatus === 'all' ? 'Aún no hay betas publicadas' : 'No hay betas con ese estado'}
          description="Publica tu build y empieza a recibir feedback real."
          action={
            canWrite ? (
              <button type="button" className="btn btn-grad btn-sm" onClick={() => open('beta')}>
                <Plus size={14} /> Subir mi beta
              </button>
            ) : (
              <Link to="/login" className="btn btn-ghost btn-sm">
                Entrar para publicar
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {betas.map((beta) => (
            <BetaCard key={beta.id} beta={beta} />
          ))}
        </div>
      )}
    </div>
  )
}
