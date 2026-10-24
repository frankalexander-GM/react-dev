import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ShieldBan, Info, Check } from 'lucide-react'
import { securityApi } from '../lib/services'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field, Select, TextArea } from '../components/ui/Primitives'

const REASONS = [
  { value: 'spam', label: 'Spam o promocional' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'impersonation', label: 'Suplantación de identidad' },
  { value: 'other', label: 'Otro' },
]

export function ReportsPage() {
  const { canWrite } = useAuth()
  const toast = useToast()
  const [entityType, setEntityType] = useState('POST')
  const [entityId, setEntityId] = useState('')
  const [reason, setReason] = useState('spam')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState<{ id: string; username: string; avatar: string | null }[]>([])

  useEffect(() => {
    document.title = 'Reportes y seguridad · DevPlay'
  }, [])

  useEffect(() => {
    if (!canWrite) return
    securityApi
      .blocked()
      .then(setBlocked)
      .catch(() => setBlocked([]))
  }, [canWrite])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!entityId.trim() || busy) {
      toast.error('Indica el ID del contenido a reportar.')
      return
    }
    setBusy(true)
    try {
      await securityApi.report({
        entityType,
        entityId: entityId.trim(),
        reason,
        description: description.trim() || undefined,
      })
      toast.success('Reporte enviado. Gracias por cuidar la comunidad.')
      setEntityId('')
      setDescription('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el reporte')
    } finally {
      setBusy(false)
    }
  }

  const unblock = async (id: string) => {
    try {
      await securityApi.unblock(id)
      setBlocked((current) => current.filter((item) => item.id !== id))
      toast.success('Usuario desbloqueado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desbloquear')
    }
  }

  return (
    <div className="space-y-4">
      <section className="glass p-5">
        <span className="badge border-orange/30 bg-orange/10 text-orange-200">
          <ShieldAlert size={10} /> Seguridad
        </span>
        <h1 className="mt-2 font-display text-[26px] font-extrabold text-fg">Reportes</h1>
        <p className="mt-1 max-w-[600px] text-[12.5px] text-muted">
          Reporta publicaciones, usuarios, comentarios o betas que incumplan las normas. La API
          registra el reporte; el equipo de moderación lo revisa.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={submit} className="glass space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Tipo de contenido"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            >
              <option value="POST">Publicación</option>
              <option value="USER">Usuario</option>
              <option value="COMMENT">Comentario</option>
              <option value="BETA">Beta</option>
            </Select>
            <Select label="Motivo" value={reason} onChange={(event) => setReason(event.target.value)}>
              {REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>

          <Field
            label="ID del contenido"
            placeholder="Pega el ID de la publicación, usuario, comentario o beta"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            hint="Lo encuentras en la URL del post o del perfil."
          />

          <TextArea
            label="Descripción (opcional)"
            placeholder="Cuéntanos qué pasó…"
            rows={4}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            <ShieldAlert size={15} />
            {busy ? 'Enviando…' : 'Enviar reporte'}
          </button>

          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-dim">
            <Info size={13} className="mt-0.5 shrink-0" />
            La API todavía no expone historial de reportes ni cola de moderación, así que aquí solo
            se envían reportes reales.
          </p>
        </form>

        <aside className="space-y-3">
          <div className="glass p-4">
            <h2 className="flex items-center gap-1.5 font-display text-[15px] font-bold text-fg">
              <ShieldBan size={15} className="text-orange" /> Bloqueados
            </h2>
            {!canWrite ? (
              <p className="mt-2 text-[12px] text-muted">
                Entra con tu cuenta para gestionar bloqueos.
              </p>
            ) : blocked.length === 0 ? (
              <p className="mt-2 text-[12px] text-dim">No has bloqueado a nadie.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {blocked.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-[12px]"
                  >
                    <Link to={`/u/${person.id}`} className="truncate text-fg/85 hover:text-cyan">
                      @{person.username}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void unblock(person.id)}
                      className="flex shrink-0 items-center gap-1 text-[10.5px] text-cyan hover:underline"
                    >
                      <Check size={11} /> Desbloquear
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-soft p-3.5 text-[11px] leading-relaxed text-dim">
            También puedes reportar desde el menú “···” de cada publicación o perfil, sin buscar
            IDs a mano.
          </div>
        </aside>
      </div>
    </div>
  )
}
