import { useEffect, useState } from 'react'
import { ImagePlus, Link2, Plus, Send, Trash2, Video } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Field } from '../ui/Primitives'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { postsApi } from '../../lib/services'
import { emitContentCreated } from '../../lib/contentEvents'

interface DraftMedia {
  url: string
  kind: 'image' | 'video'
}

export function PostComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const toast = useToast()
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<DraftMedia[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setContent('')
      setMedia([])
      setBusy(false)
    }
  }, [open])

  if (!user) return null

  const validMedia = media
    .map((m) => ({ url: m.url.trim(), kind: m.kind }))
    .filter((m) => /^(https?:\/\/|\/)/i.test(m.url))

  const canPublish = (content.trim().length > 0 || validMedia.length > 0) && !busy

  const addMedia = () => {
    if (media.length >= 4) return
    setMedia((current) => [...current, { url: '', kind: 'image' }])
  }

  const publish = async () => {
    if (!canPublish) return
    setBusy(true)
    try {
      await postsApi.create({
        type: 'POST',
        content: content.trim() || undefined,
        media: validMedia.length ? validMedia : undefined,
      })
      toast.success('Publicación creada')
      emitContentCreated('post')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva publicación"
      subtitle="Comparte un avance, una idea o una captura con la comunidad"
      size="md"
      footer={
        <>
          <span className="mr-auto text-[11px] text-dim">{content.length}/5000</span>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-grad" onClick={publish} disabled={!canPublish}>
            {busy ? <span className="spin-slow">◌</span> : <Send size={15} />}
            {busy ? 'Publicando…' : 'Publicar'}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-2.5 pb-3">
        <Avatar name={user.username} src={user.avatar} size={38} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-fg">
            {user.fullName || user.username}
          </p>
          <p className="text-[11px] text-dim">@{user.username} · visible para toda la comunidad</p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={5000}
        autoFocus
        placeholder="¿Qué estás construyendo hoy?"
        className="field field-area min-h-[128px] text-[14px]"
      />

      <div className="mt-3 space-y-2">
        {media.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-black/30 text-cyan">
              {item.kind === 'video' ? <Video size={15} /> : <ImagePlus size={15} />}
            </span>
            <Field
              aria-label="URL del medio"
              placeholder="https://…/captura.png"
              value={item.url}
              onChange={(event) => {
                const value = event.target.value
                setMedia((current) =>
                  current.map((m, i) => (i === index ? { ...m, url: value } : m)),
                )
              }}
              className="h-9 py-0"
            />
            <select
              aria-label="Tipo de medio"
              value={item.kind}
              onChange={(event) => {
                const kind = event.target.value === 'video' ? 'video' : 'image'
                setMedia((current) => current.map((m, i) => (i === index ? { ...m, kind } : m)))
              }}
              className="field h-9 w-[104px] shrink-0 py-0 text-[12px]"
            >
              <option value="image">Imagen</option>
              <option value="video">Vídeo</option>
            </select>
            <button
              type="button"
              className="icon-btn shrink-0 text-red-300"
              onClick={() => setMedia((current) => current.filter((_, i) => i !== index))}
              aria-label="Quitar medio"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={addMedia}
          disabled={media.length >= 4}
          className="btn btn-ghost btn-sm"
        >
          <Plus size={14} /> Añadir imagen o vídeo
        </button>
        <span className="flex items-center gap-1.5 text-[11px] text-dim">
          <Link2 size={12} /> Se enlazan por URL (máx. 4)
        </span>
      </div>

      {validMedia.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {validMedia.map((item) => (
            <div
              key={item.url}
              className="aspect-video overflow-hidden rounded-lg border border-line bg-black/40"
            >
              {item.kind === 'video' ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={item.url} alt="Vista previa" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
