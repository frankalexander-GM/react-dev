import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, MailCheck, ShieldCheck } from 'lucide-react'
import { AuthError, AuthPanel, AuthShell } from '../components/auth/AuthShell'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../lib/services'
import { useToast } from '../context/ToastContext'

interface VerifyState {
  email?: string
  password?: string
  sentTo?: string
  demoCode?: string | null
  username?: string
}

export function VerifyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyAndLogin, user } = useAuth()
  const toast = useToast()
  const state = (location.state ?? {}) as VerifyState

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoCode, setDemoCode] = useState<string | null>(state.demoCode ?? null)
  const [cooldown, setCooldown] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    document.title = 'Verifica tu correo · DevPlay'
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  if (!state.email || !state.password) return <Navigate to="/register" replace />
  if (user && !user.isGuest) return <Navigate to="/" replace />

  const code = digits.join('')

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    if (!clean) {
      setDigits((current) => current.map((digit, i) => (i === index ? '' : digit)))
      return
    }
    setDigits((current) => {
      const next = [...current]
      for (let offset = 0; offset < clean.length && index + offset < 6; offset += 1) {
        next[index + offset] = clean[offset]
      }
      return next
    })
    const nextIndex = Math.min(index + clean.length, 5)
    inputs.current[nextIndex]?.focus()
  }

  const submit = async () => {
    if (code.length !== 6 || busy) return
    setBusy(true)
    setError(null)
    try {
      await verifyAndLogin(state.email as string, state.password as string, code)
      toast.success('¡Cuenta verificada! Bienvenido a DevPlay.')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'El código no es válido')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setCooldown(30)
    try {
      const result = await authApi.verifyRegister(state.email as string, undefined, true)
      if (result.demoCode) setDemoCode(result.demoCode)
      toast.success(`Código reenviado a ${result.sentTo || state.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reenviar el código')
    }
  }

  return (
    <AuthShell>
      <AuthPanel
        title="Verifica tu correo"
        subtitle={`Enviamos un código de 6 dígitos a ${state.sentTo || state.email}`}
      >
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2.5">
          <MailCheck size={18} className="shrink-0 text-cyan" />
          <p className="text-[11.5px] leading-snug text-muted">
            Revisa tu bandeja de entrada y la carpeta de spam. El código caduca en unos minutos.
          </p>
        </div>

        <div className="flex justify-between gap-1.5 sm:gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element
              }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !digit && index > 0) {
                  inputs.current[index - 1]?.focus()
                }
                if (event.key === 'Enter') void submit()
              }}
              onPaste={(event) => {
                event.preventDefault()
                setDigit(0, event.clipboardData.getData('text'))
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-label={`Dígito ${index + 1}`}
              className="field mono h-14 flex-1 px-0 text-center text-[22px] font-bold tracking-widest"
            />
          ))}
        </div>

        {demoCode && (
          <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11.5px] text-amber-200">
            Modo demo (sin SMTP): tu código es{' '}
            <span className="mono font-bold">{demoCode}</span>
          </p>
        )}

        <AuthError message={error} />

        <button
          type="button"
          className="btn btn-grad btn-lg mt-5 w-full"
          onClick={submit}
          disabled={code.length !== 6 || busy}
        >
          <ShieldCheck size={16} />
          {busy ? 'Verificando…' : 'Verificar y entrar'}
        </button>

        <div className="mt-4 flex items-center justify-between text-[11.5px]">
          <Link to="/register" className="flex items-center gap-1 text-muted hover:text-fg">
            <ArrowLeft size={13} /> Cambiar correo
          </Link>
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-semibold text-cyan transition hover:underline disabled:text-dim"
          >
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
          </button>
        </div>
      </AuthPanel>
    </AuthShell>
  )
}
