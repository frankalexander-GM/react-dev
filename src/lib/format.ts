/** Utilidades de formato compartidas por las vistas. */

export function relativeTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} sem`

  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export function fullDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function compact(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (Math.abs(value) < 1000) return String(value)
  if (Math.abs(value) < 1_000_000) {
    const n = value / 1000
    return `${n >= 10 ? n.toFixed(0) : n.toFixed(1).replace('.0', '')}k`
  }
  const n = value / 1_000_000
  return `${n.toFixed(1).replace('.0', '')}M`
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const GRADIENTS: [string, string][] = [
  ['#00F0FF', '#3B82F6'],
  ['#8B5CF6', '#3B82F6'],
  ['#22D3EE', '#0EA5E9'],
  ['#F472B6', '#8B5CF6'],
  ['#F59E0B', '#FF5E00'],
  ['#34D399', '#0EA5E9'],
]

export function gradientFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  }
  const [from, to] = GRADIENTS[hash % GRADIENTS.length]
  return `linear-gradient(135deg, ${from}, ${to})`
}

export function initials(name: string): string {
  const clean = name.replace(/^@/, '').trim()
  if (!clean) return 'DP'
  const parts = clean.split(/[\s_.-]+/).filter(Boolean)
  // Ignora fragmentos puramente numéricos (p. ej. "invitado_482").
  const words = parts.filter((part) => /[a-záéíóúñ]/i.test(part))
  if (words.length === 0) return clean.slice(0, 2).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

export function plural(count: number, one: string, many: string): string {
  return `${compact(count)} ${count === 1 ? one : many}`
}

/** Copia texto al portapapeles con fallback para navegadores sin permiso. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}
