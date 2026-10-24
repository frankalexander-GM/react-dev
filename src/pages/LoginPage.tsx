import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { AuthDivider, AuthError, AuthPanel, AuthShell } from '../components/auth/AuthShell'
import { Field } from '../components/ui/Primitives'
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function LoginPage() {
  const { user, login, loginAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [guestBusy, setGuestBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  useEffect(() => {
    document.title = 'Entrar · DevPlay'
  }, [])

  // Un invitado sí puede entrar aquí para convertirse en miembro.
  if (user && !user.isGuest) return <Navigate to={from} replace />

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      toast.success('¡Bienvenido de vuelta!')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setBusy(false)
    }
  }

  const guest = async () => {
    setGuestBusy(true)
    setError(null)
    try {
      await loginAsGuest()
      toast.info('Entraste como invitado: puedes leer, no publicar.')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar como invitado')
    } finally {
      setGuestBusy(false)
    }
  }

  return (
    <AuthShell>
      <AuthPanel
        title="Iniciar sesión"
        subtitle="Entra para publicar, probar betas y seguir a otros devs."
      >
        <form onSubmit={submit} noValidate>
          <div className="space-y-3.5">
            <Field
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              icon={Mail}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Field
              label="Contraseña"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              icon={KeyRound}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-[11.5px] font-semibold text-cyan transition hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <AuthError message={error} />

          <button type="submit" className="btn btn-grad btn-lg mt-5 w-full" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
            {!busy && <ArrowRight size={16} />}
          </button>
        </form>

        <AuthDivider label="o entra sin cuenta" />

        <button
          type="button"
          onClick={guest}
          disabled={guestBusy}
          className="btn btn-ghost h-[46px] w-full"
        >
          <Compass size={16} />
          {guestBusy ? 'Preparando sesión…' : 'Explorar como invitado'}
        </button>

        <p className="mt-5 text-center text-[12.5px] text-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-cyan hover:underline">
            Crear cuenta
          </Link>
        </p>

        <p className="mt-4 text-center text-[10.5px] leading-relaxed text-dim">
          Al entrar aceptas las normas de la comunidad: respeto, feedback honesto y nada de spam.
        </p>
      </AuthPanel>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </AuthShell>
  )
}
