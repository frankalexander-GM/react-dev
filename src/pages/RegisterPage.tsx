import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AtSign, CalendarDays, Eye, EyeOff, KeyRound, Mail, User, UserPlus } from 'lucide-react'
import { AuthError, AuthPanel, AuthShell } from '../components/auth/AuthShell'
import { Field } from '../components/ui/Primitives'
import { useAuth } from '../context/AuthContext'

interface Errors {
  email?: string
  username?: string
  fullName?: string
  age?: string
  password?: string
  confirm?: string
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    username: '',
    fullName: '',
    age: '',
    password: '',
    confirm: '',
    website: '',
  })
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Crear cuenta · DevPlay'
  }, [])

  // Un invitado puede crear una cuenta sin cerrar la sesión temporal.
  if (user && !user.isGuest) return <Navigate to="/" replace />

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const validate = (): boolean => {
    const next: Errors = {}
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      next.email = 'Ese correo no parece válido'
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
      next.username = '3-20 caracteres: letras, números o guion bajo'
    }
    if (form.fullName.trim().length < 3 || form.fullName.trim().length > 30) {
      next.fullName = 'Entre 3 y 30 caracteres'
    }
    const age = Number(form.age)
    if (!Number.isFinite(age) || age < 13 || age > 120) {
      next.age = 'Debes tener al menos 13 años'
    }
    if (form.password.length < 6) next.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirm) next.confirm = 'Las contraseñas no coinciden'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate() || busy) return
    setBusy(true)
    setServerError(null)
    try {
      const result = await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        age: Number(form.age),
        website: form.website,
      })
      navigate('/verify', {
        replace: true,
        state: {
          email: form.email.trim(),
          password: form.password,
          sentTo: result.sentTo,
          demoCode: result.demoCode,
          username: result.username,
        },
      })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo crear la cuenta')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <AuthPanel
        title="Crear cuenta"
        subtitle="Únete para publicar builds y probar las de otros devs."
      >
        <form onSubmit={submit} noValidate>
          <div className="space-y-3.5">
            <Field
              label="Nombre completo"
              placeholder="Frank Alexander"
              icon={User}
              value={form.fullName}
              maxLength={30}
              autoComplete="name"
              onChange={(event) => set('fullName', event.target.value)}
              error={errors.fullName}
            />
            <Field
              label="Nombre de usuario"
              placeholder="frankdev"
              icon={AtSign}
              value={form.username}
              maxLength={20}
              autoComplete="username"
              onChange={(event) => set('username', event.target.value.replace(/\s/g, ''))}
              error={errors.username}
              hint="Tu @ público: letras, números y _"
            />
            <Field
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              icon={Mail}
              value={form.email}
              autoComplete="email"
              onChange={(event) => set('email', event.target.value)}
              error={errors.email}
            />
            <Field
              label="Edad"
              type="number"
              placeholder="18"
              icon={CalendarDays}
              value={form.age}
              min={13}
              max={120}
              onChange={(event) => set('age', event.target.value)}
              error={errors.age}
            />
            <Field
              label="Contraseña"
              type={show ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              icon={KeyRound}
              value={form.password}
              autoComplete="new-password"
              onChange={(event) => set('password', event.target.value)}
              error={errors.password}
              suffix={
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  className="icon-btn h-8 w-8"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <Field
              label="Repetir contraseña"
              type={show ? 'text' : 'password'}
              placeholder="Otra vez"
              icon={KeyRound}
              value={form.confirm}
              autoComplete="new-password"
              onChange={(event) => set('confirm', event.target.value)}
              error={errors.confirm}
            />

            {/* Honeypot anti-bots: invisible para personas, nunca se rellena. */}
            <input
              type="text"
              name="hp_field"
              value={form.website}
              onChange={(event) => set('website', event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
            />
          </div>

          <AuthError message={serverError} />

          <button type="submit" className="btn btn-grad btn-lg mt-5 w-full" disabled={busy}>
            <UserPlus size={16} />
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-5 text-center text-[12.5px] text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-cyan hover:underline">
            Iniciar sesión
          </Link>
        </p>

        <p className="mt-3 text-center text-[10.5px] leading-relaxed text-dim">
          Te enviaremos un código de 6 dígitos para verificar el correo. Mínimo 13 años (Ley 1581).
        </p>
      </AuthPanel>
    </AuthShell>
  )
}
