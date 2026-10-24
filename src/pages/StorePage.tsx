import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Coins,
  Crown,
  Gift,
  Palette,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { storeApi } from '../lib/services'
import type { BalanceResponse, Purchase, StoreItem } from '../lib/types'
import { compact, relativeTime } from '../lib/format'
import { mediaUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/ui/Modal'
import { EmptyState, Skeleton, Tabs } from '../components/ui/Primitives'

const CATEGORY_LABEL: Record<string, string> = {
  powerup: 'Mejoras',
  avatar: 'Avatares',
  premium: 'Premium',
  bundle: 'Packs',
}

const ICONS: Record<string, typeof Zap> = {
  zap: Zap,
  star: Star,
  crown: Crown,
  palette: Palette,
  gift: Gift,
  package: Package,
  sparkles: Sparkles,
}

export function StorePage() {
  const { user, canWrite } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState<StoreItem[]>([])
  const [grouped, setGrouped] = useState<Record<string, StoreItem[]>>({})
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [mine, setMine] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'catalog' | 'mine'>('catalog')
  const [selected, setSelected] = useState<StoreItem | null>(null)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    document.title = 'Tienda · DevPlay'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [catalog, wallet, purchases] = await Promise.all([
        storeApi.items(),
        canWrite ? storeApi.balance() : Promise.resolve(null),
        canWrite ? storeApi.myItems() : Promise.resolve([]),
      ])
      setItems(catalog.items)
      setGrouped(catalog.grouped)
      setBalance(wallet)
      setMine(purchases)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la tienda')
    } finally {
      setLoading(false)
    }
  }, [canWrite, toast])

  useEffect(() => {
    void load()
  }, [load])

  const buy = async () => {
    if (!selected) return
    if (!canWrite) {
      toast.info('Entra con una cuenta para comprar.')
      return
    }
    if (balance && balance.balance < selected.price) {
      toast.error('No te alcanzan los DevCoins. Gana más publicando y participando.')
      return
    }
    setBuying(true)
    try {
      const result = await storeApi.buy(selected.id)
      setBalance((current) => (current ? { ...current, balance: result.balance } : current))
      setMine((current) => [result.purchase, ...current])
      toast.success(`¡${selected.name} es tuyo!`)
      setSelected(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la compra')
    } finally {
      setBuying(false)
    }
  }

  const groups = Object.keys(grouped).length
    ? grouped
    : items.reduce<Record<string, StoreItem[]>>((acc, item) => {
        acc[item.category] = [...(acc[item.category] ?? []), item]
        return acc
      }, {})

  return (
    <div className="space-y-4">
      <section className="glass relative overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF5E00, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="badge border-orange/30 bg-orange/10 text-orange-200">
              <ShoppingBag size={10} /> DevCoins
            </span>
            <h1 className="mt-2 font-display text-[26px] font-extrabold text-fg sm:text-[32px]">
              Tienda <span className="text-grad">DevPlay</span>
            </h1>
            <p className="mt-1 max-w-[520px] text-[12.5px] text-muted">
              Mejoras, avatares y packs para tu perfil. Se paga con DevCoins ganados en la
              comunidad.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan/25 bg-black/35 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-dim">
              <Coins size={12} className="text-cyan" /> Tu saldo
            </p>
            <p className="mono mt-0.5 text-[24px] font-bold text-cyan">
              {balance ? compact(balance.balance) : '—'}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          tabs={[
            { id: 'catalog', label: 'Catálogo' },
            { id: 'mine', label: 'Mis artículos', count: mine.length },
          ]}
          value={tab}
          onChange={setTab}
        />
        {balance && balance.transactions.length > 0 && (
          <span className="text-[11px] text-dim">
            {balance.transactions.length} movimientos recientes
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
      ) : tab === 'mine' ? (
        mine.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Todavía no tienes artículos"
            description="Compra tu primera mejora o avatar con los DevCoins que ganes."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((purchase) => (
              <div key={purchase.id} className="glass p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/12 text-cyan">
                    <Check size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-fg">
                      {purchase.item.name}
                    </p>
                    <p className="text-[10.5px] text-dim">
                      {purchase.pricePaid} DevCoins · {relativeTime(purchase.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[11.5px] text-muted">{purchase.item.description}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([category, categoryItems]) => (
            <section key={category}>
              <h2 className="mb-2 font-display text-[16px] font-bold text-fg">
                {CATEGORY_LABEL[category] ?? category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((item) => {
                  const Icon = ICONS[item.icon?.toLowerCase()] ?? Sparkles
                  const image = mediaUrl(item.imageUrl)
                  const owned = mine.some((purchase) => purchase.itemId === item.id)
                  return (
                    <article key={item.id} className="glass group flex flex-col p-4">
                      <div className="flex items-start gap-2.5">
                        <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-cyan/20 bg-cyan/10 text-cyan">
                          {image ? (
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Icon size={20} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[13.5px] font-semibold text-fg">{item.name}</h3>
                          <p className="text-[10.5px] uppercase tracking-wide text-dim">
                            {CATEGORY_LABEL[item.category] ?? item.category}
                          </p>
                        </div>
                        <span className="mono shrink-0 text-[12px] font-bold text-cyan">
                          {item.price}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 flex-1 text-[11.5px] leading-snug text-muted">
                        {item.description}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        disabled={owned}
                        className={clsx('btn mt-3 w-full', owned ? 'btn-ghost' : 'btn-soft')}
                      >
                        {owned ? (
                          <>
                            <Check size={14} /> Ya lo tienes
                          </>
                        ) : (
                          <>
                            <Coins size={14} /> Comprar
                          </>
                        )}
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}

          {items.length === 0 && (
            <EmptyState
              icon={ShoppingBag}
              title="La tienda está vacía"
              description="El catálogo se llena desde /store/items en la API."
            />
          )}
        </div>
      )}

      {balance && balance.transactions.length > 0 && tab === 'catalog' && (
        <section className="glass p-4">
          <h2 className="mb-2 font-display text-[15px] font-bold text-fg">Movimientos recientes</h2>
          <ul className="space-y-1">
            {balance.transactions.slice(0, 6).map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-1.5 text-[11.5px] hover:bg-white/[0.03]"
              >
                <span className="min-w-0 truncate text-muted">{transaction.description}</span>
                <span
                  className={clsx(
                    'mono shrink-0 font-semibold',
                    transaction.amount >= 0 ? 'text-emerald-300' : 'text-red-300',
                  )}
                >
                  {transaction.amount >= 0 ? '+' : ''}
                  {transaction.amount}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Confirmar compra"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-grad" onClick={buy} disabled={buying}>
              <Coins size={14} /> {buying ? 'Comprando…' : `Pagar ${selected?.price ?? 0}`}
            </button>
          </>
        }
      >
        {selected && (
          <div>
            <p className="text-[13px] font-semibold text-fg">{selected.name}</p>
            <p className="mt-1 text-[12px] text-muted">{selected.description}</p>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-black/25 px-3 py-2 text-[12px]">
              <span className="text-dim">Saldo actual</span>
              <span className="mono text-cyan">{balance?.balance ?? 0} DevCoins</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-xl border border-line bg-black/25 px-3 py-2 text-[12px]">
              <span className="text-dim">Después de comprar</span>
              <span className="mono text-fg">
                {(balance?.balance ?? 0) - selected.price} DevCoins
              </span>
            </div>
            {!user && (
              <p className="mt-2 text-[11.5px] text-orange-300">
                Necesitas una cuenta para completar la compra.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
