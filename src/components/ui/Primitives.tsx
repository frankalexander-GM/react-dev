import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { type ReactNode, forwardRef, useId } from 'react'

/* -------------------------------------------------------------------------- */
/*                                  Spinner                                   */
/* -------------------------------------------------------------------------- */

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('spin-slow', className)} aria-hidden />
}

/* -------------------------------------------------------------------------- */
/*                                   Field                                    */
/* -------------------------------------------------------------------------- */

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string | null
  icon?: LucideIcon
  suffix?: ReactNode
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, icon: Icon, suffix, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId

  return (
    <label htmlFor={fieldId} className="block">
      {label && (
        <span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>
      )}
      <span className="relative block">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim"
          />
        )}
        <input
          ref={ref}
          id={fieldId}
          className={clsx('field', Icon && 'pl-10', suffix && 'pr-11', error && 'border-danger/60', className)}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {suffix && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{suffix}</span>
        )}
      </span>
      {error ? (
        <span className="mt-1 block text-[11.5px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11.5px] text-dim">{hint}</span>
      ) : null}
    </label>
  )
})

/* -------------------------------------------------------------------------- */
/*                                  Textarea                                  */
/* -------------------------------------------------------------------------- */

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string | null
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <label htmlFor={fieldId} className="block">
      {label && (
        <span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        className={clsx('field field-area', error && 'border-danger/60', className)}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-[11.5px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11.5px] text-dim">{hint}</span>
      ) : null}
    </label>
  )
})

/* -------------------------------------------------------------------------- */
/*                                   Select                                   */
/* -------------------------------------------------------------------------- */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export function Select({ label, hint, className, id, children, ...props }: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <label htmlFor={fieldId} className="block">
      {label && (
        <span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>
      )}
      <select id={fieldId} className={clsx('field', className)} {...props}>
        {children}
      </select>
      {hint && <span className="mt-1 block text-[11.5px] text-dim">{hint}</span>}
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Skeleton                                  */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />
}

export function PostSkeleton() {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                EmptyState                                  */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="glass flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
        <Icon size={22} />
      </span>
      <h3 className="font-display text-base font-bold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Tabs                                     */
/* -------------------------------------------------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx('chip px-3 py-1.5', value === tab.id && 'chip-active')}
        >
          <span>{tab.label}</span>
          {typeof tab.count === 'number' && (
            <span className="mono text-[10px] opacity-70">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
