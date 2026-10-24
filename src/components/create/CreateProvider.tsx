import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { PostComposeModal } from './PostComposeModal'
import { BetaComposeModal } from './BetaComposeModal'
import { PollComposeModal } from './PollComposeModal'

export type CreateKind = 'post' | 'beta' | 'poll'

interface CreateContextValue {
  open: (kind: CreateKind) => void
  close: () => void
}

const CreateContext = createContext<CreateContextValue | null>(null)

/**
 * Los tres compositores viven una sola vez en el árbol (como los `showDialog`
 * de Flutter): cualquier vista los abre desde aquí y al publicar se emite
 * `devplay:created` para que las listas se refresquen.
 */
export function CreateProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<CreateKind | null>(null)

  const value = useMemo<CreateContextValue>(
    () => ({ open: (next) => setKind(next), close: () => setKind(null) }),
    [],
  )

  return (
    <CreateContext.Provider value={value}>
      {children}
      <PostComposeModal open={kind === 'post'} onClose={() => setKind(null)} />
      <BetaComposeModal open={kind === 'beta'} onClose={() => setKind(null)} />
      <PollComposeModal open={kind === 'poll'} onClose={() => setKind(null)} />
    </CreateContext.Provider>
  )
}

export function useCreate(): CreateContextValue {
  const context = useContext(CreateContext)
  if (!context) throw new Error('useCreate debe usarse dentro de <CreateProvider>')
  return context
}
