import { useState } from 'react'
import clsx from 'clsx'
import { gradientFor, initials } from '../../lib/format'
import { mediaUrl } from '../../lib/api'

interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  className?: string
  ring?: boolean
}

/** Avatar con degradado determinista y fallback a iniciales. */
export function Avatar({ name, src, size = 40, className, ring = false }: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const url = mediaUrl(src)
  const label = name.replace(/^@/, '') || 'DevPlay'

  return (
    <span
      className={clsx(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        ring && 'ring-2 ring-cyan/40 ring-offset-2 ring-offset-bg',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: url && !broken ? '#0b1526' : gradientFor(label),
        fontSize: Math.max(10, Math.round(size * 0.36)),
      }}
      aria-hidden={false}
    >
      {url && !broken ? (
        <img
          src={url}
          alt={`Avatar de ${label}`}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="font-semibold tracking-wide text-[#04121a]">{initials(label)}</span>
      )}
    </span>
  )
}
