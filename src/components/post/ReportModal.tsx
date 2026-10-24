import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Select, TextArea } from '../ui/Primitives'
import { securityApi } from '../../lib/services'
import { useToast } from '../../context/ToastContext'

const REASONS = [
  { value: 'spam', label: 'Spam o promocional' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'impersonation', label: 'Suplantación de identidad' },
  { value: 'other', label: 'Otro' },
]

const ENTITY_LABEL: Record<string, string> = {
  POST: 'Publicación',
  USER: 'Usuario',
  COMMENT: 'Comentario',
  BETA: 'Beta',
}

export function ReportModal({
  open,
  onClose,
  entityType,
  entityId,
}: {
  open: boolean
  onClose: () => void
  entityType: string
  entityId: string
}) {
  const toast = useToast()
  const [reason, setReason] = useState('spam')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setReason('spam')
      setDescription('')
      setBusy(false)
    }
  }, [open])

  const submit = async () => {
    setBusy(true)
    try {
      await securityApi.report({
        entityType,
        entityId,
        reason,
        description: description.trim() || undefined,
      })
      toast.success('Reporte enviado. Gracias por cuidar la comunidad.')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el reporte')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reportar contenido"
      subtitle={`${ENTITY_LABEL[entityType] ?? 'Contenido'} · ${entityId.slice(0, 8)}…`}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={submit} disabled={busy}>
            <ShieldAlert size={14} />
            {busy ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Select label="Motivo" value={reason} onChange={(event) => setReason(event.target.value)}>
          {REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>

        <TextArea
          label="Descripción (opcional)"
          placeholder="Cuéntanos qué pasó…"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <p className="text-[11px] leading-relaxed text-dim">
          El equipo de moderación revisa los reportes con la API de seguridad de DevPlay. El
          contenido no se oculta automáticamente.
        </p>
      </div>
    </Modal>
  )
}
