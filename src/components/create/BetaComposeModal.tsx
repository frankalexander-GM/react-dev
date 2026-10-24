import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field, Select, TextArea } from '../ui/Primitives'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { betasApi } from '../../lib/services'
import { emitContentCreated } from '../../lib/contentEvents'
import { invalidateBetasIndex } from '../../lib/betasIndex'
import { BETA_STATUS_LABEL, type BetaStatus } from '../../lib/types'

const PLATFORMS = ['PC', 'Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Web']

const EMPTY = {
  title: '',
  description: '',
  downloadType: 'LINK' as 'LINK' | 'DIRECT',
  betaStatus: 'open_beta' as BetaStatus,
  externalUrl: '',
  fileUrl: '',
  fileName: '',
  fileSize: '',
  genre: '',
  version: '',
  coverImage: '',
  externalPlatform: '',
  requirements: '',
  installInstructions: '',
  changelog: '',
  tags: '',
  screenshots: '',
}

export function BetaComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [platforms, setPlatforms] = useState<string[]>(['PC'])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY)
      setPlatforms(['PC'])
      setBusy(false)
    }
  }, [open])

  if (!user) return null

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const togglePlatform = (platform: string) =>
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform],
    )

  const needsUrl = form.betaStatus !== 'coming_soon'
  const hasUrl =
    form.downloadType === 'LINK'
      ? /^https?:\/\//i.test(form.externalUrl.trim())
      : /^https?:\/\//i.test(form.fileUrl.trim())

  const valid =
    form.title.trim().length >= 3 &&
    form.description.trim().length >= 1 &&
    (!needsUrl || hasUrl) &&
    !busy

  const submit = async () => {
    if (!valid) {
      toast.error('Revisa el título, la descripción y el enlace de descarga.')
      return
    }    setBusy(true)
    try {
      await betasApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        downloadType: form.downloadType,
        betaStatus: form.betaStatus,
        ...(form.downloadType === 'LINK'
          ? form.externalUrl.trim()
            ? { externalUrl: form.externalUrl.trim() }
            : {}
          : {
              ...(form.fileUrl.trim() ? { fileUrl: form.fileUrl.trim() } : {}),
              ...(form.fileName.trim() ? { fileName: form.fileName.trim() } : {}),
              ...(form.fileSize ? { fileSize: Number(form.fileSize) } : {}),
            }),
        genre: form.genre.trim() || undefined,
        version: form.version.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        externalPlatform: form.externalPlatform.trim() || undefined,
        requirements: form.requirements.trim() || undefined,
        installInstructions: form.installInstructions.trim() || undefined,
        changelog: form.changelog.trim() || undefined,
        platforms,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim().replace(/^#/, ''))
          .filter(Boolean)
          .slice(0, 15),
        screenshots: form.screenshots
          .split('\n')
          .map((url) => url.trim())
          .filter((url) => /^https?:\/\//i.test(url))
          .slice(0, 10),
      })
      toast.success('Beta publicada. ¡A por los testers!')
      invalidateBetasIndex()
      emitContentCreated('beta')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar la beta')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subir una beta"
      subtitle="Crea la ficha y el post de tipo BETA en un solo paso"
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-grad" onClick={submit} disabled={!valid}>
            <Rocket size={15} />
            {busy ? 'Publicando…' : 'Publicar beta'}
          </button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Título"
            placeholder="Nombre de tu juego o build"
            value={form.title}
            maxLength={120}
            onChange={(event) => set('title', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <TextArea
            label="Descripción"
            placeholder="Qué es, en qué punto está y qué feedback buscas…"
            value={form.description}
            rows={4}
            onChange={(event) => set('description', event.target.value)}
          />
        </div>

        <Field
          label="Versión"
          placeholder="0.4.2"
          value={form.version}
          maxLength={32}
          onChange={(event) => set('version', event.target.value)}
        />
        <Field
          label="Género"
          placeholder="Metroidvania, roguelike…"
          value={form.genre}
          maxLength={64}
          onChange={(event) => set('genre', event.target.value)}
        />

        <Select
          label="Estado de la beta"
          value={form.betaStatus}
          onChange={(event) => set('betaStatus', event.target.value as BetaStatus)}
        >
          {(Object.keys(BETA_STATUS_LABEL) as BetaStatus[]).map((status) => (
            <option key={status} value={status}>
              {BETA_STATUS_LABEL[status]}
            </option>
          ))}
        </Select>

        <Select
          label="Tipo de descarga"
          value={form.downloadType}
          onChange={(event) => set('downloadType', event.target.value as 'LINK' | 'DIRECT')}
        >
          <option value="LINK">Enlace externo</option>
          <option value="DIRECT">Archivo directo</option>
        </Select>

        {form.downloadType === 'LINK' ? (
          <>
            <div className="sm:col-span-2">
              <Field
                label="Enlace de descarga"
                placeholder="https://itch.io/tu-juego"
                value={form.externalUrl}
                onChange={(event) => set('externalUrl', event.target.value)}
              />
            </div>
            <Field
              label="Plataforma externa (opcional)"
              placeholder="itch.io, Steam, Google Drive…"
              value={form.externalPlatform}
              onChange={(event) => set('externalPlatform', event.target.value)}
            />
          </>
        ) : (
          <>
            <div className="sm:col-span-2">
              <Field
                label="URL del archivo"
                placeholder="https://…/build.zip"
                value={form.fileUrl}
                onChange={(event) => set('fileUrl', event.target.value)}
              />
            </div>
            <Field
              label="Nombre del archivo"
              placeholder="build-0.4.2.zip"
              value={form.fileName}
              onChange={(event) => set('fileName', event.target.value)}
            />
            <Field
              label="Tamaño en bytes (opcional)"
              type="number"
              min={0}
              placeholder="48200000"
              value={form.fileSize}
              onChange={(event) => set('fileSize', event.target.value)}
            />
          </>
        )}

        <div className="sm:col-span-2">
          <Field
            label="Portada (URL, opcional)"
            placeholder="https://…/cover.png"
            value={form.coverImage}
            onChange={(event) => set('coverImage', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[12px] font-semibold text-muted">Plataformas</span>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`chip ${platforms.includes(platform) ? 'chip-active' : ''}`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Etiquetas (separadas por coma)"
            placeholder="pixel art, multijugador, coop"
            value={form.tags}
            onChange={(event) => set('tags', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <TextArea
            label="Requisitos"
            placeholder="SO, RAM, GPU…"
            rows={2}
            value={form.requirements}
            onChange={(event) => set('requirements', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <TextArea
            label="Instrucciones de instalación"
            placeholder="Cómo abrir la build, qué mirar, dónde reportar…"
            rows={2}
            value={form.installInstructions}
            onChange={(event) => set('installInstructions', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <TextArea
            label="Changelog"
            placeholder="Qué cambia en esta versión"
            rows={2}
            value={form.changelog}
            onChange={(event) => set('changelog', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <TextArea
            label="Capturas (una URL por línea)"
            placeholder="https://…/shot1.png"
            rows={2}
            value={form.screenshots}
            onChange={(event) => set('screenshots', event.target.value)}
          />
        </div>
      </div>

      <p className="mt-1 text-[11px] text-dim">
        La API crea automáticamente el post de tipo <span className="mono">BETA</span> junto a la
        ficha; aparecerá en el feed y en el centro de betas.
      </p>
    </Modal>
  )
}
