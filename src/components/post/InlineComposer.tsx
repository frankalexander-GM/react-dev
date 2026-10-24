import { useState } from 'react'
import { BarChart3, FlaskConical, ImagePlus, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { postsApi } from '../../lib/services'
import { emitContentCreated } from '../../lib/contentEvents'
import { Avatar } from '../ui/Avatar'
import { useCreate } from '../create/CreateProvider'

/** Compositor rápido de Inicio: texto + atajos a encuesta, beta y post con medios. */
export function InlineComposer() {
  const { user, canWrite } = useAuth()
  const { open } = useCreate()
  const toast = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null

  const publish = async () => {
    const content = text.trim()
    if (!content || busy) return
    if (!canWrite) {
      toast.info('Los invitados no pueden publicar. Crea una cuenta para participar.')
      return
    }
    setBusy(true)
    try {
      await postsApi.create({ type: 'POST', content })
      setText('')
      toast.success('¡Publicación creada!')
      emitContentCreated('post')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass p-3.5 sm:p-4">
      <div className="flex gap-2.5">
        <Avatar name={user.username} src={user.avatar} size={38} />
        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void publish()
            }}
            rows={2}
            maxLength={5000}
            placeholder={
              canWrite
                ? `¿Qué estás construyendo, ${user.fullName?.split(' ')[0] || user.username}?`
                : 'Entra con una cuenta para publicar…'
            }
            disabled={!canWrite}
            className="field min-h-[64px] resize-y border-transparent bg-black/20 text-[13.5px] focus:border-cyan/40"
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className="chip"
              onClick={() => (canWrite ? open('post') : toast.info('Entra para publicar con medios.'))}
            >
              <ImagePlus size={13} /> Imagen o vídeo
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => (canWrite ? open('poll') : toast.info('Entra para crear encuestas.'))}
            >
              <BarChart3 size={13} /> Encuesta
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => (canWrite ? open('beta') : toast.info('Entra para subir una beta.'))}
            >
              <FlaskConical size={13} /> Beta
            </button>

            <span className="ml-auto text-[10.5px] text-dim">{text.length}/5000</span>
            <button
              type="button"
              onClick={publish}
              disabled={!text.trim() || busy || !canWrite}
              className="btn btn-grad btn-sm"
            >
              <Send size={13} />
              {busy ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
