import { useEffect, useState } from 'react'
import { Check, Lock, Users } from 'lucide-react'
import clsx from 'clsx'
import { postsApi } from '../../lib/services'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import type { Poll } from '../../lib/types'
import { compact } from '../../lib/format'
import { Skeleton } from '../ui/Primitives'

export function PollBlock({ postId }: { postId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [voting, setVoting] = useState(false)
  const toast = useToast()
  const { canWrite } = useAuth()

  useEffect(() => {
    let alive = true
    setLoading(true)
    postsApi
      .getPoll(postId)
      .then((data) => {
        if (!alive) return
        setPoll(data)
        setSelected(data?.votedOptionIds ?? [])
      })
      .catch(() => setPoll(null))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [postId])

  if (loading) return <Skeleton className="mt-3 h-28 w-full" />
  if (!poll) return null

  const voted = poll.votedOptionIds.length > 0
  const showResults = voted || poll.isClosed
  const total = poll.totalVotes || poll.options.reduce((sum, option) => sum + option.voteCount, 0)

  const toggle = (optionId: string) => {
    if (!canWrite || voting || poll.isClosed) return
    if (!poll.allowMultiple) {
      void submit([optionId])
      return
    }
    setSelected((current) =>
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
    )
  }

  const submit = async (optionIds: string[]) => {
    if (!optionIds.length) return
    setVoting(true)
    try {
      const updated = await postsApi.vote(poll.id, optionIds)
      setPoll(updated)
      setSelected(updated.votedOptionIds)
      toast.success('Voto registrado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo votar')
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-black/25 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[15px] font-semibold leading-snug text-fg">
          {poll.question}
        </p>
        {poll.isClosed ? (
          <span className="badge shrink-0 text-muted">
            <Lock size={10} /> Cerrada
          </span>
        ) : (
          poll.allowMultiple && (
            <span className="badge shrink-0">
              <Users size={10} /> Múltiple
            </span>
          )
        )}
      </div>

      <div className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const pct = total > 0 ? Math.round((option.voteCount / total) * 100) : 0
          const picked = selected.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => (showResults ? undefined : toggle(option.id))}
              disabled={showResults || poll.isClosed || voting || !canWrite}
              className={clsx(
                'relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left transition',
                picked
                  ? 'border-cyan/50 bg-cyan/10'
                  : 'border-line bg-raised/40 hover:border-cyan/30',
                (showResults || poll.isClosed) && 'cursor-default',
              )}
            >
              {showResults && (
                <span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan/20 to-primary/20"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13px] text-fg/90">
                  {picked && <Check size={14} className="text-cyan" />}
                  {option.text}
                </span>
                {showResults && (
                  <span className="mono shrink-0 text-[11.5px] text-cyan">{pct}%</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-dim">
        <span>
          {compact(total)} {total === 1 ? 'voto' : 'votos'}
          {poll.allowMultiple && ' · opción múltiple'}
        </span>
        {!voted && poll.allowMultiple && selected.length > 0 && (
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() => submit(selected)}
            disabled={voting}
          >
            Votar selección
          </button>
        )}
        {!canWrite && !poll.isClosed && <span>Entra para votar</span>}
      </div>
    </div>
  )
}
