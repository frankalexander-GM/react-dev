import { Link } from 'react-router-dom'
import { Download, FlaskConical, Sparkles } from 'lucide-react'
import { BETA_STATUS_LABEL } from '../../lib/types'
import { compact, truncate } from '../../lib/format'
import { mediaUrl } from '../../lib/api'

/** Forma mínima compartida por `Beta` (lista) y `BetaCard` (descubrir). */
export interface BetaCardModel {
  id: string
  title: string
  description?: string | null
  coverImage?: string | null
  downloads: number
  genre?: string | null
  version?: string | null
  betaStatus?: string | null
  platforms?: string[]
}

const STATUS_TONE: Record<string, string> = {
  open_beta: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  closed_beta: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
  alpha: 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300',
  tech_test: 'border-sky-400/30 bg-sky-500/10 text-sky-300',
  early_access: 'border-cyan/30 bg-cyan/10 text-cyan',
  coming_soon: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
  ended: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
}

export function BetaCard({ beta }: { beta: BetaCardModel }) {
  const cover = mediaUrl(beta.coverImage)
  const status = beta.betaStatus ?? null
  const platforms = beta.platforms ?? []

  return (
    <Link
      to={`/betas/${beta.id}`}
      className="glass group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-cyan/30"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-raised">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.14), rgba(139,92,246,0.22))',
            }}
          >
            <FlaskConical size={34} className="text-violet/80" />
          </div>
        )}
        {status && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide backdrop-blur ${
              STATUS_TONE[status] ?? STATUS_TONE.open_beta
            }`}
          >
            {BETA_STATUS_LABEL[status as keyof typeof BETA_STATUS_LABEL] ?? status}
          </span>
        )}
        {beta.version && (
          <span className="mono absolute right-2.5 top-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur">
            v{beta.version}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-1 font-display text-[15px] font-bold text-fg group-hover:text-cyan">
          {beta.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted">
          {truncate(beta.description ?? '', 150)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {beta.genre && <span className="chip py-0.5 text-[10px]">{beta.genre}</span>}
          {platforms.slice(0, 2).map((platform) => (
            <span key={platform} className="chip py-0.5 text-[10px]">
              {platform}
            </span>
          ))}
          {platforms.length > 2 && (
            <span className="text-[10px] text-dim">+{platforms.length - 2}</span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-3 pt-3 text-[10.5px] text-dim">
          <span className="flex items-center gap-1">
            <Download size={11} /> {compact(beta.downloads)} descargas
          </span>
          <span className="ml-auto flex items-center gap-1 text-cyan/80">
            <Sparkles size={11} /> Ver ficha
          </span>
        </div>
      </div>
    </Link>
  )
}
