import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-3), { id, kind, message }])
      window.setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message: string) => show(message, 'success'),
      error: (message: string) => show(message, 'error'),
      info: (message: string) => show(message, 'info'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon =
            toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertTriangle : Info
          const tone =
            toast.kind === 'success'
              ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10'
              : toast.kind === 'error'
                ? 'text-red-300 border-red-400/30 bg-red-500/10'
                : 'text-sky-200 border-sky-400/30 bg-sky-500/10'
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-3.5 py-3 text-[13px] shadow-2xl backdrop-blur-md animate-in ${tone}`}
              style={{ background: 'rgba(8, 14, 26, 0.94)' }}
            >
              <Icon size={17} className="mt-0.5 shrink-0" />
              <p className="flex-1 leading-snug text-fg/90">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-muted transition hover:text-fg"
                aria-label="Cerrar aviso"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
