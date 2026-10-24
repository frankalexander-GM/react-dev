import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, FlaskConical, Gamepad2, MessageSquare, Sparkles, Users } from 'lucide-react'

/** Fondo y marco comunes de login, registro y verificación. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #00F0FF 0%, transparent 68%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 h-[520px] w-[520px] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 68%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-[420px] w-[520px] rounded-full opacity-30 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto flex w-full max-w-[1180px] flex-1 items-center px-5 py-8 sm:px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_440px]">
          <section className="hidden lg:block">
            <Link to="/" className="mb-8 inline-flex items-center gap-2.5">
              <span
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, #00F0FF, #3B82F6 55%, #8B5CF6)' }}
              >
                <Gamepad2 size={22} className="text-[#04121a]" />
              </span>
              <span className="font-display text-[24px] font-bold text-fg">
                Dev<span className="text-grad">Play</span>
              </span>
            </Link>

            <h1 className="max-w-[560px] font-display text-[44px] font-extrabold leading-[1.08] text-fg">
              Donde tus juegos <span className="text-grad">encuentran testers.</span>
            </h1>
            <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-muted">
              Comparte builds tempranas, recibe feedback de verdad y descubre lo que la comunidad
              está creando ahora mismo.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                { icon: FlaskConical, text: 'Publica betas y encuentra testers' },
                { icon: MessageSquare, text: 'Feedback real en cada versión' },
                { icon: Sparkles, text: 'Descubre juegos antes que nadie' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan">
                    <Icon size={15} />
                  </span>
                  <span className="text-[13.5px] text-fg/90">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3.5 py-1.5 text-[11px] font-semibold text-muted">
              <Users size={14} className="text-cyan" />
              Comunidad indie · DevPlay
            </div>
          </section>

          <div className="w-full">{children}</div>
        </div>
      </div>

      <footer className="relative pb-5 text-center text-[11px] text-dim">
        DevPlay · React 19 + FastAPI · <Link to="/about" className="hover:text-muted">Acerca del proyecto</Link>
      </footer>
    </div>
  )
}

export function AuthPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div
      className="rounded-[26px] border border-cyan/20 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95),0_0_60px_-30px_rgba(0,240,255,0.5)] backdrop-blur-2xl sm:p-7"
      style={{ background: 'rgba(15, 23, 42, 0.78)' }}
    >
      <div className="mb-6 lg:hidden">
        <Link to="/" className="inline-flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-[10px]"
            style={{ background: 'linear-gradient(135deg, #00F0FF, #8B5CF6)' }}
          >
            <Gamepad2 size={19} className="text-[#04121a]" />
          </span>
          <span className="font-display text-[20px] font-bold text-fg">
            Dev<span className="text-grad">Play</span>
          </span>
        </Link>
      </div>

      <h2 className="font-display text-[25px] font-extrabold text-fg">{title}</h2>
      {subtitle && <p className="mt-1.5 text-[13px] leading-snug text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  )
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5">
      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-300" />
      <p className="text-[12px] leading-snug text-red-200">{message}</p>
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] text-dim">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
