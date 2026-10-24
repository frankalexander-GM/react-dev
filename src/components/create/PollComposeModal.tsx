import { useEffect, useState } from 'react'
import { BarChart3, Plus, Trash2, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { postsApi } from '../../lib/services'
import { emitContentCreated } from '../../lib/contentEvents'

export function PollComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const toast = useToast()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuestion('')
      setOptions(['', ''])
      setAllowMultiple(false)
      setBusy(false)
    }
  }, [open])

  if (!user) return null

  const cleanOptions = options.map((o) => o.trim()).filter(Boolean)
  const unique = new Set(cleanOptions.map((o) => o.toLowerCase())).size === cleanOptions.length
  const valid =
    question.trim().length > 0 &&
    cleanOptions.length >= 2 &&
    cleanOptions.length <= 10 &&
    unique &&
    !busy

  const update = (index: number, value: string) =>
    setOptions((current) => current.map((o, i) => (i === index ? value : o)))

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    let postId: string | null = null
    try {
      const post = await postsApi.create({
        type: 'POLL',
      })
      postId = post.id
      await postsApi.createPoll(post.id, {
        question: question.trim(),
        options: cleanOptions,
        allowMultiple,
      })
      toast.success('Encuesta publicada')
      emitContentCreated('poll')
      onClose()
    } catch (error) {
      // Sin encuesta el post quedaría huérfano: se limpia igual que en Flutter.
      if (postId) {
        try {
          await postsApi.remove(postId)
        } catch {
          /* noop */
        }
      }
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la encuesta')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear encuesta"
      subtitle="Pregunta a la comunidad y mide la respuesta"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-grad" onClick={submit} disabled={!valid}>
            <BarChart3 size={15} />
            {busy ? 'Publicando…' : 'Publicar encuesta'}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-2.5 pb-3">
        <Avatar name={user.username} src={user.avatar} size={36} />
        <p className="text-[12.5px] text-muted">
          <span className="font-semibold text-fg">{user.fullName || user.username}</span> quiere
          saber tu opinión
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[12px] font-semibold text-muted">Pregunta</span>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={500}
          autoFocus
          placeholder="¿Qué opinas del último parche?"
          className="field field-lg"
        />
      </label>

      <div className="mt-4 space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="mono w-5 text-center text-[11px] text-dim">{index + 1}</span>
            <input
              value={option}
              onChange={(event) => update(index, event.target.value)}
              maxLength={200}
              placeholder={`Opción ${index + 1}`}
              className="field"
            />
            <button
              type="button"
              className="icon-btn shrink-0 text-red-300 disabled:opacity-30"
              disabled={options.length <= 2}
              onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
              aria-label={`Quitar opción ${index + 1}`}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={options.length >= 10}
          onClick={() => setOptions((current) => [...current, ''])}
        >
          <Plus size={14} /> Añadir opción
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-red-300"
          onClick={() => setOptions(['', ''])}
        >
          <Trash2 size={13} /> Reiniciar
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-black/20 px-3 py-2.5">
        <input
          type="checkbox"
          checked={allowMultiple}
          onChange={(event) => setAllowMultiple(event.target.checked)}
          className="h-4 w-4 accent-cyan"
        />
        <span className="text-[12.5px] text-muted">Permitir votar por varias opciones</span>
      </label>

      {!unique && (
        <p className="mt-2 text-[11.5px] text-danger">
          Las opciones no pueden repetirse.
        </p>
      )}
    </Modal>
  )
}
