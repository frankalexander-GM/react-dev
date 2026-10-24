import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MessageCircle,
  MessagesSquare,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { chatApi, usersApi } from '../lib/services'
import type { ChatMessage, Conversation, DirectMessage } from '../lib/types'
import { relativeTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar } from '../components/ui/Avatar'
import { Skeleton } from '../components/ui/Primitives'

type Tab = 'world' | 'dm'

export function ChatPage() {
  const { peerId } = useParams<{ peerId: string }>()
  const navigate = useNavigate()
  const { user, canWrite } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>(peerId ? 'dm' : 'world')
  const [world, setWorld] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [peerName, setPeerName] = useState<string | null>(null)
  const [peerAvatar, setPeerAvatar] = useState<string | null>(null)
  const [loadingWorld, setLoadingWorld] = useState(true)
  const [loadingDm, setLoadingDm] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Chat · DevPlay'
  }, [])

  useEffect(() => {
    if (peerId) setTab('dm')
  }, [peerId])

  const scrollToBottom = useCallback((smooth = false) => {
    const element = scrollRef.current
    if (!element) return
    element.scrollTo({ top: element.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  /* ------------------------------------------------------------- chat mundial */
  const loadWorld = useCallback(async () => {
    try {
      const items = await chatApi.world(80)
      setWorld([...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
    } catch {
      /* silencioso: el chat se reintenta en el siguiente tick */
    } finally {
      setLoadingWorld(false)
    }
  }, [])

  useEffect(() => {
    void loadWorld()
    const timer = window.setInterval(() => void loadWorld(), 5000)
    return () => window.clearInterval(timer)
  }, [loadWorld])

  /* ------------------------------------------------------------------- DMs */
  const loadConversations = useCallback(async () => {
    try {
      setConversations(await chatApi.conversations())
    } catch {
      /* sin sesión no hay DMs */
    }
  }, [])

  const loadMessages = useCallback(async (id: string) => {
    setLoadingDm(true)
    try {
      const items = await chatApi.directMessages(id)
      setMessages(items)
      await chatApi.markRead(id)
    } catch {
      /* noop */
    } finally {
      setLoadingDm(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!peerId || !canWrite) return
    void loadMessages(peerId)
    const timer = window.setInterval(() => void loadMessages(peerId), 5000)
    return () => window.clearInterval(timer)
  }, [peerId, canWrite, loadMessages])

  useEffect(() => {
    if (!peerId) return
    const found = conversations.find((conversation) => conversation.peerId === peerId)
    if (found) {
      setPeerName(found.peerUsername)
      setPeerAvatar(found.peerAvatar)
      return
    }
    usersApi
      .profile(peerId)
      .then(({ user: profile }) => {
        setPeerName(profile.username)
        setPeerAvatar(profile.avatar)
      })
      .catch(() => setPeerName(null))
  }, [peerId, conversations])

  useEffect(() => {
    scrollToBottom(false)
  }, [world.length, messages.length, scrollToBottom])

  /* ---------------------------------------------------------------- envío */
  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    if (!canWrite) {
      toast.info('Entra con una cuenta para escribir.')
      return
    }
    setSending(true)
    try {
      if (tab === 'world') {
        const created = await chatApi.sendWorld(content)
        setWorld((current) => [...current, created])
      } else if (peerId) {
        const created = await chatApi.sendDirect(peerId, content)
        setMessages((current) => [...current, created])
        void loadConversations()
      }
      setText('')
      window.setTimeout(() => scrollToBottom(true), 40)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const showListOnMobile = tab === 'dm' && !peerId
  const activePeer = useMemo(
    () => conversations.find((conversation) => conversation.peerId === peerId) ?? null,
    [conversations, peerId],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[20px] font-bold text-fg">Chat</h1>
          <span className="badge border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> en vivo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={clsx('chip', tab === 'world' && 'chip-active')}
            onClick={() => {
              setTab('world')
              if (peerId) navigate('/chat')
            }}
          >
            <MessageCircle size={13} /> Chat mundial
          </button>
          <button
            type="button"
            className={clsx('chip', tab === 'dm' && 'chip-active')}
            onClick={() => setTab('dm')}
          >
            <MessagesSquare size={13} /> Mensajes directos
          </button>
        </div>
      </div>

      <div
        className="glass flex overflow-hidden"
        style={{ height: 'calc(100dvh - 190px)', minHeight: 520 }}
      >
        {/* ------------------------------------------------------------ sidebar */}
        <aside
          className={clsx(
            'w-full shrink-0 flex-col border-r border-line md:flex md:w-[272px]',
            showListOnMobile ? 'flex' : 'hidden',
          )}
        >
          {tab === 'world' ? (
            <div className="flex h-full flex-col p-4">
              <p className="label-caps">Sala general</p>
              <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-cyan/20 bg-cyan/5 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-cyan/15 text-cyan">
                  <Users size={18} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-fg">#devplay-global</p>
                  <p className="text-[11px] text-dim">Toda la comunidad</p>
                </div>
              </div>

              <p className="mt-4 text-[11.5px] leading-relaxed text-dim">
                El chat global es público: lo que escribas aquí lo ve cualquiera. Para algo privado,
                abre un mensaje directo desde un perfil.
              </p>

              <div className="mt-auto rounded-xl border border-line bg-black/20 p-3">
                <p className="flex items-center gap-1.5 text-[11px] text-muted">
                  <ShieldCheck size={13} className="text-cyan" /> Respeta las normas
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-dim">
                  Spam, acoso y contenido NSFW se reportan desde la publicación o el perfil.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-3.5 py-3">
                <p className="label-caps">Conversaciones</p>
                <span className="mono text-[10px] text-dim">{conversations.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto px-1.5 pb-2">
                {!canWrite && (
                  <p className="mx-2 mb-2 rounded-lg border border-line bg-black/20 px-2.5 py-2 text-[11px] text-muted">
                    Entra con una cuenta para ver tus mensajes.
                  </p>
                )}
                {conversations.map((conversation) => (
                  <Link
                    key={conversation.peerId}
                    to={`/chat/${conversation.peerId}`}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-xl px-2 py-2 transition',
                      peerId === conversation.peerId
                        ? 'bg-cyan/10 ring-1 ring-cyan/25'
                        : 'hover:bg-white/[0.04]',
                    )}
                  >
                    <Avatar
                      name={conversation.peerUsername}
                      src={conversation.peerAvatar}
                      size={34}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12.5px] font-semibold text-fg">
                          @{conversation.peerUsername}
                        </p>
                        <span className="ml-auto text-[9.5px] text-dim">
                          {relativeTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-dim">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
                {canWrite && conversations.length === 0 && (
                  <p className="px-3 py-6 text-center text-[11.5px] leading-relaxed text-dim">
                    Aún no tienes conversaciones. Abre el perfil de un dev y pulsa “Mensaje”.
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* --------------------------------------------------------------- chat */}
        <section
          className={clsx(
            'min-w-0 flex-1 flex-col',
            showListOnMobile ? 'hidden md:flex' : 'flex',
          )}
        >
          <header className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5">
            {tab === 'dm' && peerId && (
              <button
                type="button"
                className="icon-btn md:hidden"
                onClick={() => navigate('/chat')}
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft size={17} />
              </button>
            )}
            {tab === 'world' ? (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan/12 text-cyan">
                  <Users size={15} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-fg">#devplay-global</p>
                  <p className="text-[10.5px] text-dim">Chat público de la comunidad</p>
                </div>
              </>
            ) : (
              <>
                <Avatar
                  name={peerName ?? 'devplay'}
                  src={peerAvatar ?? activePeer?.peerAvatar}
                  size={32}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-fg">
                    {peerName ? `@${peerName}` : 'Conversación'}
                  </p>
                  <p className="text-[10.5px] text-dim">Mensaje directo</p>
                </div>
              </>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-3">
            {tab === 'world' ? (
              loadingWorld ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              ) : (
                <div className="space-y-1">
                  {world.map((message) => (
                    <WorldMessage
                      key={message.id}
                      message={message}
                      own={message.userId === user?.id}
                    />
                  ))}
                  {world.length === 0 && (
                    <p className="py-8 text-center text-[12px] text-dim">
                      Nadie ha escrito todavía. Rompe el hielo.
                    </p>
                  )}
                </div>
              )
            ) : !peerId ? (
              <div className="grid h-full place-items-center px-4 text-center">
                <div>
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
                    <MessagesSquare size={22} />
                  </span>
                  <p className="text-[13px] font-semibold text-fg">Elige una conversación</p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    O abre el perfil de alguien y pulsa “Mensaje”.
                  </p>
                </div>
              </div>
            ) : loadingDm && messages.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="ml-auto h-10 w-1/2" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {messages.map((message) => (
                  <DmBubble
                    key={message.id}
                    message={message}
                    own={message.senderId === user?.id}
                  />
                ))}
                {messages.length === 0 && (
                  <p className="py-8 text-center text-[12px] text-dim">
                    Todavía no hay mensajes. Di hola.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-line px-3 py-2.5">
            {canWrite ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void send()
                    }
                  }}
                  rows={1}
                  maxLength={tab === 'world' ? 500 : 2000}
                  placeholder={
                    tab === 'world' ? 'Escribe en el chat mundial…' : 'Escribe un mensaje directo…'
                  }
                  className="field max-h-24 min-h-[42px] flex-1 resize-y py-2.5"
                />
                <button
                  type="button"
                  className="btn btn-grad h-[42px] px-3.5"
                  onClick={send}
                  disabled={!text.trim() || sending}
                  aria-label="Enviar"
                >
                  <Send size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-black/20 px-3 py-2">
                <p className="text-[11.5px] text-muted">
                  Estás como invitado: lectura solamente.
                </p>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Entrar
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function WorldMessage({ message, own }: { message: ChatMessage; own: boolean }) {
  return (
    <div className={clsx('flex gap-2 rounded-lg px-1 py-1 hover:bg-white/[0.02]', own && 'bg-cyan/[0.04]')}>
      <Avatar name={message.username} size={30} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-[12px] font-semibold text-cyan/90">@{message.username}</span>
          <span className="text-[9.5px] text-dim">{relativeTime(message.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words text-[13px] leading-snug text-fg/90">
          {message.content}
        </p>
      </div>
    </div>
  )
}

function DmBubble({ message, own }: { message: DirectMessage; own: boolean }) {
  return (
    <div className={clsx('flex', own ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[78%] rounded-2xl px-3 py-2',
          own
            ? 'rounded-br-md bg-gradient-to-br from-primary/80 to-violet/70 text-white'
            : 'rounded-bl-md border border-line bg-raised/70 text-fg/90',
        )}
      >
        <p className="whitespace-pre-wrap break-words text-[13px] leading-snug">{message.content}</p>
        <p className={clsx('mt-1 text-right text-[9px]', own ? 'text-white/60' : 'text-dim')}>
          {relativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}
