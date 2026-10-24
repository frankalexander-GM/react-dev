import { useEffect, useState } from 'react'
import { Image, Lock, Save, User } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field, TextArea } from '../ui/Primitives'
import { securityApi, usersApi } from '../../lib/services'
import type { ProfileUser, UserMe } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export function EditProfileModal({
  open,
  onClose,
  profile,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  profile: ProfileUser
  onSaved: () => void
}) {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    fullName: profile.fullName ?? '',
    bio: profile.bio ?? '',
    avatar: profile.avatar ?? '',
    banner: profile.banner ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    profession: profile.profession ?? '',
    tags: profile.tags.join(', '),
  })
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      fullName: profile.fullName ?? '',
      bio: profile.bio ?? '',
      avatar: profile.avatar ?? '',
      banner: profile.banner ?? '',
      location: profile.location ?? '',
      website: profile.website ?? '',
      profession: profile.profession ?? '',
      tags: profile.tags.join(', '),
    })
    setIsPrivate(user?.isPrivate ?? false)
  }, [open, profile, user?.isPrivate])

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setBusy(true)
    try {
      const updated: UserMe = await usersApi.updateProfile({
        fullName: form.fullName.trim() || undefined,
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
        banner: form.banner.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        profession: form.profession.trim(),
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim().replace(/^#/, ''))
          .filter(Boolean)
          .slice(0, 15),
      })

      if ((user?.isPrivate ?? false) !== isPrivate) {
        await securityApi.privacy(isPrivate)
        updated.isPrivate = isPrivate
      }

      setUser(updated)
      toast.success('Perfil actualizado')
      onSaved()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el perfil')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil"
      subtitle="Así te verá la comunidad"
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-grad" onClick={save} disabled={busy}>
            <Save size={14} /> {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field
          label="Nombre completo"
          icon={User}
          value={form.fullName}
          maxLength={30}
          onChange={(event) => set('fullName', event.target.value)}
        />
        <Field
          label="Profesión"
          placeholder="Game designer, dev indie…"
          value={form.profession}
          onChange={(event) => set('profession', event.target.value)}
        />

        <div className="sm:col-span-2">
          <TextArea
            label="Bio"
            placeholder="Cuenta qué haces y qué buscas…"
            rows={3}
            maxLength={500}
            value={form.bio}
            onChange={(event) => set('bio', event.target.value)}
          />
        </div>

        <Field
          label="Avatar (URL)"
          icon={Image}
          placeholder="https://…/avatar.png"
          value={form.avatar}
          onChange={(event) => set('avatar', event.target.value)}
        />
        <Field
          label="Portada (URL)"
          icon={Image}
          placeholder="https://…/banner.png"
          value={form.banner}
          onChange={(event) => set('banner', event.target.value)}
        />

        <Field
          label="Ubicación"
          placeholder="Bogotá, Colombia"
          value={form.location}
          onChange={(event) => set('location', event.target.value)}
        />
        <Field
          label="Sitio web"
          placeholder="https://tu-portafolio.dev"
          value={form.website}
          onChange={(event) => set('website', event.target.value)}
        />

        <div className="sm:col-span-2">
          <Field
            label="Etiquetas (separadas por coma)"
            placeholder="unity, pixel art, narrativa"
            value={form.tags}
            onChange={(event) => set('tags', event.target.value)}
            hint="Máximo 15 etiquetas"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-black/20 px-3 py-2.5 sm:col-span-2">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-cyan"
          />
          <span>
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-fg">
              <Lock size={12} /> Perfil privado
            </span>
            <span className="mt-0.5 block text-[11px] text-dim">
              Solo tus seguidores verán tus publicaciones. Se guarda en /security/privacy.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  )
}
