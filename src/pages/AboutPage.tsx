import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Code2,
  Database,
  FlaskConical,
  Gamepad2,
  Heart,
  Layers,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FlaskConical,
    title: 'Betas con ficha real',
    text: 'Cada beta crea su post y su ficha: versión, requisitos, capturas, descargas y estado.',
  },
  {
    icon: MessageSquare,
    title: 'Feedback en el feed',
    text: 'Likes, comentarios, reposts y encuestas son toggles reales contra la API, no maquetas.',
  },
  {
    icon: Users,
    title: 'Comunidad y perfiles',
    text: 'Sigue devs, guarda publicaciones, revisa logros y habla por chat global o mensajes directos.',
  },
  {
    icon: Zap,
    title: 'DevCoins',
    text: 'Gana monedas participando y gástalas en la tienda: mejoras, avatares y packs.',
  },
]

const STACK = [
  { icon: Layers, label: 'React 19', text: 'Componentes con hooks, sin clases' },
  { icon: Code2, label: 'TypeScript', text: 'Tipos normalizados para snake_case y camelCase' },
  { icon: Zap, label: 'Vite', text: 'Dev server en :3000 para encajar con CORS' },
  { icon: Database, label: 'FastAPI', text: 'JWT con refresh, /api/v1' },
  { icon: ShieldCheck, label: 'Seguridad', text: 'Reportes, bloqueos y privacidad' },
]

export function AboutPage() {
  useEffect(() => {
    document.title = 'Acerca de · DevPlay'
  }, [])

  return (
    <div className="space-y-4">
      <section className="glass relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00F0FF, transparent 70%)' }}
        />
        <span className="badge border-cyan/30 bg-cyan/10 text-cyan">
          <Gamepad2 size={10} /> Acerca de
        </span>
        <h1 className="mt-3 max-w-[620px] font-display text-[30px] font-extrabold leading-tight text-fg sm:text-[38px]">
          DevPlay es el punto de encuentro entre <span className="text-grad">quien crea</span> y
          quien quiere probar antes que nadie.
        </h1>
        <p className="mt-3 max-w-[620px] text-[13.5px] leading-relaxed text-muted">
          Nació como un frontend en Flutter y ahora vive también en React 19. La API es la misma:
          FastAPI con JWT, PostgreSQL y un único backend como fuente de verdad.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/discover" className="btn btn-grad">
            <Sparkles size={15} /> Explorar la comunidad
          </Link>
          <Link to="/betas" className="btn btn-ghost">
            <FlaskConical size={15} /> Ver betas
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <article key={title} className="glass p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/20 bg-cyan/10 text-cyan">
              <Icon size={18} />
            </span>
            <h2 className="mt-2.5 font-display text-[15px] font-bold text-fg">{title}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{text}</p>
          </article>
        ))}
      </section>

      <section className="glass p-4 sm:p-5">
        <h2 className="font-display text-[17px] font-bold text-fg">Cómo está hecho</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map(({ icon: Icon, label, text }) => (
            <div
              key={label}
              className="flex items-start gap-2.5 rounded-xl border border-line bg-black/20 px-3 py-2.5"
            >
              <Icon size={15} className="mt-0.5 shrink-0 text-violet" />
              <div>
                <p className="text-[12px] font-semibold text-fg">{label}</p>
                <p className="text-[10.5px] leading-snug text-dim">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass p-4 sm:p-5">
        <h2 className="font-display text-[17px] font-bold text-fg">El viaje</h2>
        <ol className="mt-3 space-y-3">
          {[
            'Backend FastAPI reescrito desde el Next.js original, con JWT y PostgreSQL.',
            'Frontend móvil en Flutter para validar el diseño y los flujos.',
            'Esta versión web en React 19: misma API, misma identidad visual, otra plataforma.',
          ].map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-[10px] text-cyan">
                {index + 1}
              </span>
              <p className="text-[12.5px] leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="glass flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <Heart size={16} className="text-orange" />
          <p className="text-[12px] text-muted">
            Hecho por la comunidad, para la comunidad. Feedback siempre bienvenido.
          </p>
        </div>
        <Link to="/reports" className="btn btn-ghost btn-sm">
          <Rocket size={13} /> Reportar un problema
          <ArrowRight size={12} />
        </Link>
      </section>
    </div>
  )
}
