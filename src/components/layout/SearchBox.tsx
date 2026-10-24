import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const q = value.trim()
        if (q.length < 2) return
        navigate(`/search?q=${encodeURIComponent(q)}`)
      }}
      className="flex h-9 w-full max-w-[560px] items-center gap-2 rounded-lg border border-line bg-raised/70 px-3 transition focus-within:border-cyan/40"
    >
      <Search size={17} className="shrink-0 text-dim" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar proyectos, juegos o @usuarios…"
        aria-label="Buscar en DevPlay"
        className="h-full w-full bg-transparent text-[13px] text-fg outline-none placeholder:text-dim/80"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setValue('')
            navigate('/search')
          }}
          className="text-[10px] font-semibold uppercase tracking-wide text-dim transition hover:text-fg"
        >
          limpiar
        </button>
      )}
    </form>
  )
}
