import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10 text-cyan">
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-[17px] font-bold text-fg">{title}</h2>
        {subtitle && <p className="truncate text-[11.5px] text-dim">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
