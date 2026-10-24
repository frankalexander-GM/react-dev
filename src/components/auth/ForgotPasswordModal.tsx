import { useState } from 'react'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Primitives'
import { authApi } from '../../lib/services'
import { useToast } from '../../context/ToastContext'

export function ForgotPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [demoCode, setDemoCode] = useState<string | null>(null)

  const reset = () => {
    setStep('email')
    setEmail('')
    setCode('')
    setPassword('')
    setDemoCode(null)
    setBusy(false)
  }

  const request = async () => {
    if (!email.trim()) return
    setBusy(true)
    try {
      const result = await authApi.forgotPassword(email.trim())
      setDemoCode(result.demoCode)
      setStep('reset')
      toast.success(result.message || 'Si el correo existe, te enviamos un código.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el código')
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (code.length !== 6 || password.length < 6) return
    setBusy(true)
    try {
      await authApi.resetPassword({ email: email.trim(), code, password })
      toast.success('Contraseña actualizada. Ya puedes entrar.')
      reset()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Recuperar contraseña"
      subtitle={
        step === 'email'
          ? 'Te enviaremos un código de 6 dígitos al correo'
          : `Código enviado a ${email}`
      }
      size="sm"
      footer={
        step === 'email' ? (
          <button type="button" className="btn btn-grad" onClick={request} disabled={busy}>
            <Mail size={14} /> {busy ? 'Enviando…' : 'Enviar código'}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStep('email')}>
              Atrás
            </button>
            <button
              type="button"
              className="btn btn-grad"
              onClick={confirm}
              disabled={code.length !== 6 || password.length < 6 || busy}
            >
              <ShieldCheck size={14} /> {busy ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </>
        )
      }
    >
      {step === 'email' ? (
        <Field
          label="Correo de tu cuenta"
          type="email"
          placeholder="tu@correo.com"
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      ) : (
        <div className="space-y-3">
          <Field
            label="Código de 6 dígitos"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            icon={ShieldCheck}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Field
            label="Nueva contraseña"
            type="password"
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            icon={KeyRound}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {demoCode && (
            <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11.5px] text-amber-200">
              Modo demo (sin SMTP): el código es <span className="mono font-bold">{demoCode}</span>
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
