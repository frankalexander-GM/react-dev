import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileArchive,
  FlaskConical,
  HardDrive,
  Tag,
} from 'lucide-react'
import { betasApi } from '../lib/services'
import { BETA_STATUS_LABEL, type Beta } from '../lib/types'
import { compact, formatBytes, fullDate } from '../lib/format'
import { mediaUrl } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Primitives'

export function BetaDetailPage() {
  const { betaId } = useParams<{ betaId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [beta, setBeta] = useState<Beta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [download, setDownload] = useState<{ url: string; fileName?: string | null } | null>(null)

  useEffect(() => {
    if (!betaId) return
    let alive = true
    setLoading(true)
    betasApi
      .get(betaId)
      .then((data) => {
        if (alive) {
          setBeta(data)
          document.title = `${data.title} · Betas · DevPlay`
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'No se pudo cargar la beta')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [betaId])

  const startDownload = async () => {
    if (!beta || downloading) return
    if (!beta.externalUrl && !beta.fileUrl) {
      toast.info('Esta beta aún no tiene descarga publicada.')
      return
    }
    setDownloading(true)
    try {
      const result = await betasApi.download(beta.id)
      setBeta((current) => (current ? { ...current, downloads: result.downloads } : current))
      setDownload({ url: result.url, fileName: result.fileName })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo preparar la descarga')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !beta) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-[13px] text-red-300">{error ?? 'Beta no encontrada'}</p>
        <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => navigate('/betas')}>
          Volver al centro de betas
        </button>
      </div>
    )
  }

  const cover = mediaUrl(beta.coverImage)
  const tags = beta.tags
  const downloadable = Boolean(beta.externalUrl || beta.fileUrl)

  return (
    <div className="space-y-4">
      <Link to="/betas" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-cyan">
        <ArrowLeft size={14} /> Centro de betas
      </Link>

      <section className="glass relative overflow-hidden">
        <div className="relative h-[200px] w-full overflow-hidden bg-raised sm:h-[260px]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="grid h-full w-full place-items-center"
              style={{
                background:
                  'radial-gradient(600px 300px at 20% 0%, rgba(0,240,255,0.25), transparent), radial-gradient(600px 300px at 90% 100%, rgba(139,92,246,0.35), transparent), #0c1626',
              }}
            >
              <FlaskConical size={48} className="text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080f1c] via-[#080f1c]/55 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="badge border-violet/30 bg-violet/15 text-violet-200">
                  {BETA_STATUS_LABEL[beta.betaStatus] ?? beta.betaStatus}
                </span>
                {beta.version && <span className="badge mono normal-case">v{beta.version}</span>}
                {beta.genre && <span className="badge">{beta.genre}</span>}
              </div>
              <h1 className="font-display text-[26px] font-extrabold leading-tight text-white sm:text-[34px]">
                {beta.title}
              </h1>
            </div>
            <button
              type="button"
              className="btn btn-grad"
              onClick={startDownload}
              disabled={downloading || !downloadable}
            >
              <Download size={16} />
              {!downloadable ? 'Próximamente' : downloading ? 'Preparando…' : 'Descargar build'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-[11.5px] text-dim sm:px-5">
          <span className="flex items-center gap-1.5">
            <Download size={13} /> {compact(beta.downloads)} descargas
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} /> Publicada {fullDate(beta.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <FlaskConical size={13} /> {beta.downloadType === 'DIRECT' ? 'Archivo directo' : 'Enlace externo'}
          </span>
          {beta.externalPlatform && (
            <span className="flex items-center gap-1.5">
              <ExternalLink size={13} /> {beta.externalPlatform}
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <Block title="Sobre esta beta">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-fg/85">
              {beta.description}
            </p>
          </Block>

          {beta.requirements && (
            <Block title="Requisitos">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                {beta.requirements}
              </p>
            </Block>
          )}

          {beta.installInstructions && (
            <Block title="Instrucciones">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                {beta.installInstructions}
              </p>
            </Block>
          )}

          {beta.changelog && (
            <Block title="Changelog">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                {beta.changelog}
              </p>
            </Block>
          )}

          {beta.screenshots.length > 0 && (
            <Block title="Capturas">
              <div className="grid gap-2 sm:grid-cols-2">
                {beta.screenshots.map((shot) => (
                  <a
                    key={shot}
                    href={mediaUrl(shot) ?? shot}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-video overflow-hidden rounded-lg border border-line bg-black/40"
                  >
                    <img
                      src={mediaUrl(shot) ?? shot}
                      alt="Captura de la beta"
                      loading="lazy"
                      className="h-full w-full object-cover transition hover:scale-[1.02]"
                    />
                  </a>
                ))}
              </div>
            </Block>
          )}
        </div>

        <aside className="space-y-3">
          <div className="glass p-4">
            <h2 className="font-display text-[15px] font-bold text-fg">Ficha</h2>
            <dl className="mt-2.5 space-y-2 text-[12px]">
              <Row label="Estado" value={BETA_STATUS_LABEL[beta.betaStatus] ?? beta.betaStatus} />
              {beta.version && <Row label="Versión" value={beta.version} mono />}
              {beta.genre && <Row label="Género" value={beta.genre} />}
              <Row
                label="Plataformas"
                value={beta.platforms.length ? beta.platforms.join(', ') : 'Sin especificar'}
              />
              {beta.fileName && <Row label="Archivo" value={beta.fileName} />}
              {beta.fileSize ? <Row label="Tamaño" value={formatBytes(beta.fileSize)} /> : null}
            </dl>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className="chip py-0.5 text-[10px]"
                  >
                    <Tag size={10} /> {tag}
                  </Link>
                ))}
              </div>
            )}

            <button
              type="button"
              className="btn btn-grad mt-3.5 w-full"
              onClick={startDownload}
              disabled={downloading || !downloadable}
            >
              <Download size={15} />
              {!downloadable ? 'Próximamente' : downloading ? 'Preparando…' : 'Descargar build'}
            </button>

            {beta.downloadType === 'DIRECT' ? (
              <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-dim">
                <FileArchive size={11} />{' '}
                {downloadable ? 'Archivo alojado directamente' : 'Aún sin archivo publicado'}
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-dim">
                <HardDrive size={11} />{' '}
                {downloadable ? 'Enlace externo del autor' : 'Aún sin enlace publicado'}
              </p>
            )}
          </div>

          <div className="glass-soft p-3.5 text-[11px] leading-relaxed text-dim">
            Consejo: prueba la build en una instalación limpia y reporta los bugs con pasos
            reproducibles. El autor lo agradecerá.
          </div>
        </aside>
      </div>

      <Modal
        open={Boolean(download)}
        onClose={() => setDownload(null)}
        title="Descarga lista"
        subtitle={download?.fileName ?? beta.title}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDownload(null)}>
              Cerrar
            </button>
            {download && (
              <a href={download.url} target="_blank" rel="noreferrer" className="btn btn-grad">
                <ExternalLink size={14} /> Abrir descarga
              </a>
            )}
          </>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-muted">
          La descarga quedó registrada en el contador de la beta. Abre el enlace en una pestaña
          nueva para empezar.
        </p>
        {download && (
          <p className="mono mt-2 break-all rounded-lg border border-line bg-black/30 px-2.5 py-2 text-[10.5px] text-cyan/90">
            {download.url}
          </p>
        )}
      </Modal>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass p-4">
      <h2 className="mb-2 font-display text-[15px] font-bold text-fg">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-dim">{label}</dt>
      <dd className={`min-w-0 text-right text-fg/85 ${mono ? 'mono' : ''}`}>{value}</dd>
    </div>
  )
}
