import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="glass max-w-md p-8 text-center">
        <p className="mono text-[11px] uppercase tracking-[0.2em] text-cyan">error 404</p>
        <h1 className="mt-2 font-display text-[26px] font-extrabold text-fg">
          Esta build no existe
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          La página que buscas se quedó en una rama antigua. Vuelve al feed o explora lo que hay
          hoy.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/" className="btn btn-grad btn-sm">
            <Home size={14} /> Ir al inicio
          </Link>
          <Link to="/discover" className="btn btn-ghost btn-sm">
            <Compass size={14} /> Descubrir
          </Link>
        </div>
      </div>
    </div>
  )
}
