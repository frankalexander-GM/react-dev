import { api } from './api'
import {
  type Achievement,
  type BalanceResponse,
  type ChatMessage,
  type Comment,
  type Conversation,
  type DirectMessage,
  type DiscoverData,
  type FollowUser,
  type Poll,
  type Post,
  type PostType,
  type Purchase,
  type Raw,
  type SearchData,
  type StoreItem,
  type StoreItemsResponse,
  type UserMe,
  type UserStats,
  type BuyResponse,
  list,
  str,
  toAchievement,
  toBeta,
  toBetaCard,
  toChatMessage,
  toComment,
  toConversation,
  toDirectMessage,
  toFollowUser,
  toNotification,
  toPoll,
  toPost,
  toProfileUser,
  toStoreItem,
  toUserMe,
  toUserSearchItem,
  toUserStats,
} from './types'

/* -------------------------------------------------------------------------- */
/*                                 Autenticación                              */
/* -------------------------------------------------------------------------- */

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: UserMe
}

export interface RegisterResult {
  id: string
  username: string
  sentTo: string
  demoCode: string | null
}

export interface VerifyResult {
  ok: boolean
  username: string | null
  sentTo: string | null
  demoCode: string | null
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    const raw = await api.post<Raw>('/auth/login', { email, password }, false)
    return {
      accessToken: str(raw.access_token),
      refreshToken: str(raw.refresh_token),
      user: toUserMe((raw.user ?? {}) as Raw),
    }
  },

  async register(payload: {
    email: string
    username: string
    password: string
    fullName: string
    age: number
    website?: string
  }): Promise<RegisterResult> {
    const raw = await api.post<Raw>('/auth/register', payload, false)
    return {
      id: str(raw.id),
      username: str(raw.username),
      sentTo: str(raw.sentTo ?? raw.sent_to),
      demoCode: str(raw.demoCode ?? raw.demo_code) || null,
    }
  },

  async verifyRegister(email: string, code?: string, resend = false): Promise<VerifyResult> {
    const raw = await api.post<Raw>(
      '/auth/verify-register',
      { email, code, resend },
      false,
    )
    return {
      ok: raw.ok === true,
      username: str(raw.username) || null,
      sentTo: str(raw.sentTo ?? raw.sent_to) || null,
      demoCode: str(raw.demoCode ?? raw.demo_code) || null,
    }
  },

  async forgotPassword(email: string) {
    const raw = await api.post<Raw>('/auth/forgot-password', { email }, false)
    return {
      message: str(raw.message),
      sentTo: str(raw.sentTo ?? raw.sent_to) || null,
      demoCode: str(raw.demoCode ?? raw.demo_code) || null,
    }
  },

  async resetPassword(payload: { email: string; code: string; password: string }) {
    return api.post<Raw>('/auth/reset-password', payload, false)
  },

  async guest(username?: string): Promise<{ id: string; username: string; isGuest: boolean; accessToken: string; refreshToken: string }> {
    const raw = await api.post<Raw>('/auth/guest', username ? { username } : {}, false)
    return {
      id: str(raw.id),
      username: str(raw.username),
      isGuest: raw.isGuest !== false,
      accessToken: str(raw.access_token),
      refreshToken: str(raw.refresh_token),
    }
  },

  me: async () => toUserMe(await api.get<Raw>('/auth/me')),
}

/* -------------------------------------------------------------------------- */
/*                                   Posts                                    */
/* -------------------------------------------------------------------------- */

export const postsApi = {
  async list(params: { skip?: number; limit?: number; authorId?: string } = {}) {
    const query = new URLSearchParams()
    query.set('skip', String(params.skip ?? 0))
    query.set('limit', String(params.limit ?? 20))
    if (params.authorId) query.set('author_id', params.authorId)
    const raw = await api.get<Raw>(`/posts?${query.toString()}`)
    return {
      items: list(raw.items).map(toPost),
      total: Number(raw.total ?? 0),
      skip: Number(raw.skip ?? 0),
      limit: Number(raw.limit ?? 0),
    }
  },

  get: async (id: string) => toPost(await api.get<Raw>(`/posts/${id}`)),

  async create(payload: { type?: PostType; content?: string; media?: { url: string; kind: string }[] }) {
    const raw = await api.post<Raw>('/posts', payload)
    return toPost(raw)
  },

  async update(id: string, payload: { content?: string }) {
    return toPost(await api.patch<Raw>(`/posts/${id}`, payload))
  },

  remove: (id: string) => api.del<null>(`/posts/${id}`),

  async like(id: string) {
    const raw = await api.post<Raw>(`/posts/${id}/likes`)
    return { active: raw.active === true, count: Number(raw.count ?? 0) }
  },

  async bookmark(id: string) {
    const raw = await api.post<Raw>(`/posts/${id}/bookmarks`)
    return { active: raw.active === true, count: Number(raw.count ?? 0) }
  },

  async repost(id: string) {
    return toPost(await api.post<Raw>(`/posts/${id}/repost`))
  },

  async comments(postId: string) {
    return (await api.get<Raw[]>(`/posts/${postId}/comments`)).map(toComment)
  },

  async addComment(postId: string, content: string): Promise<Comment> {
    return toComment(await api.post<Raw>(`/posts/${postId}/comments`, { content }))
  },

  deleteComment: (postId: string, commentId: string) =>
    api.del<null>(`/posts/${postId}/comments/${commentId}`),

  async getPoll(postId: string): Promise<Poll | null> {
    try {
      return toPoll(await api.get<Raw>(`/posts/${postId}/poll`))
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
        return null
      }
      throw error
    }
  },

  async createPoll(postId: string, payload: { question: string; options: string[]; allowMultiple: boolean }) {
    const raw = await api.post<Raw>(`/posts/${postId}/poll`, {
      question: payload.question,
      options: payload.options.map((text) => ({ text })),
      allow_multiple: payload.allowMultiple,
    })
    return toPoll(raw)
  },

  async vote(pollId: string, optionIds: string[]): Promise<Poll> {
    const raw = await api.post<Raw>(`/polls/${pollId}/vote`, { option_ids: optionIds })
    return toPoll((raw.poll ?? {}) as Raw)
  },

  report: (payload: { entityId: string; entityType: string; reason: string; description?: string }) =>
    api.post<Raw>('/security/report', {
      type: payload.entityType,
      entityId: payload.entityId,
      reason: payload.reason,
      ...(payload.description ? { description: payload.description } : {}),
    }),
}

/* -------------------------------------------------------------------------- */
/*                                  Usuarios                                  */
/* -------------------------------------------------------------------------- */

export const usersApi = {
  me: async () => toUserMe(await api.get<Raw>('/users/me')),

  async updateProfile(patch: {
    fullName?: string
    bio?: string
    avatar?: string
    banner?: string
    location?: string
    website?: string
    profession?: string
    tags?: string[]
    language?: string
  }) {
    return toUserMe(await api.patch<Raw>('/users/me/profile', patch))
  },

  async profile(userId: string) {
    const raw = await api.get<Raw>(`/users/${userId}`)
    return {
      user: toProfileUser((raw.user ?? {}) as Raw),
      posts: list(raw.posts).map(toPost),
    }
  },

  async byUsername(username: string): Promise<{ id: string; username: string } | null> {
    try {
      const raw = await api.get<Raw>(`/users/by-username/${encodeURIComponent(username)}`, false)
      const user = raw.user as Raw | null
      if (!user) return null
      return { id: str(user.id), username: str(user.username) }
    } catch {
      return null
    }
  },

  async stats(): Promise<UserStats | null> {
    const raw = await api.get<Raw>('/users/me/stats')
    return raw.stats ? toUserStats(raw.stats as Raw) : null
  },

  async achievements(): Promise<{ items: Achievement[]; totalUnlocked: number }> {
    const raw = await api.get<Raw>('/users/me/achievements')
    return {
      items: list(raw.achievements).map(toAchievement),
      totalUnlocked: Number(raw.totalUnlocked ?? 0),
    }
  },

  async bookmarks(): Promise<Post[]> {
    const raw = await api.get<Raw>('/users/me/bookmarks')
    return list(raw.posts).map(toPost)
  },

  async followers(userId: string): Promise<FollowUser[]> {
    const raw = await api.get<Raw>(`/users/${userId}/followers`, false)
    return list(raw.followers).map(toFollowUser)
  },

  async following(userId: string): Promise<FollowUser[]> {
    const raw = await api.get<Raw>(`/users/${userId}/following`, false)
    return list(raw.following).map(toFollowUser)
  },

  async followStatus(userId: string) {
    const raw = await api.get<Raw>(`/follow?userId=${encodeURIComponent(userId)}`, false)
    return {
      following: raw.following === true,
      followersCount: Number(raw.followersCount ?? 0),
      followingCount: Number(raw.followingCount ?? 0),
    }
  },

  async follow(userId: string) {
    const raw = await api.post<Raw>('/follow', { followeeId: userId })
    return raw.following === true
  },

  async unfollow(userId: string) {
    const raw = await api.del<Raw>(`/follow?followeeId=${encodeURIComponent(userId)}`)
    return raw.following === true
  },
}

/* -------------------------------------------------------------------------- */
/*                              Chat · DM · Avisos                            */
/* -------------------------------------------------------------------------- */

export const chatApi = {
  async world(limit = 60) {
    const raw = await api.get<Raw[]>(`/chat?limit=${limit}`, false)
    return raw.map(toChatMessage)
  },

  async sendWorld(content: string): Promise<ChatMessage> {
    return toChatMessage(await api.post<Raw>('/chat', { content }))
  },

  async conversations(): Promise<Conversation[]> {
    return (await api.get<Raw[]>('/dm')).map(toConversation)
  },

  async directMessages(userId: string, limit = 200): Promise<DirectMessage[]> {
    return (await api.get<Raw[]>(`/dm/${userId}?limit=${limit}`)).map(toDirectMessage)
  },

  async sendDirect(userId: string, content: string): Promise<DirectMessage> {
    return toDirectMessage(await api.post<Raw>(`/dm/${userId}`, { content }))
  },

  markRead: (userId: string) => api.post<Raw>(`/dm/${userId}/read`),

  async notifications(limit = 30) {
    const raw = await api.get<Raw>(`/notifications?limit=${limit}`)
    return {
      items: list(raw.items).map(toNotification),
      unreadCount: Number(raw.unreadCount ?? 0),
      total: Number(raw.total ?? 0),
    }
  },

  markNotificationRead: async (id: string) =>
    toNotification(await api.patch<Raw>(`/notifications/${id}/read`)),

  markAllRead: () => api.patch<Raw>('/notifications/read-all'),

  removeNotification: (id: string) => api.del<null>(`/notifications/${id}`),

  async unread() {
    const raw = await api.get<Raw>('/notifications/unread-count')
    return {
      notifications: Number(raw.notifications ?? 0),
      directMessages: Number(raw.direct_messages ?? 0),
    }
  },
}

/* -------------------------------------------------------------------------- */
/*                                   Betas                                    */
/* -------------------------------------------------------------------------- */

export const betasApi = {
  async list(params: { skip?: number; limit?: number; status?: string; authorId?: string } = {}) {
    const query = new URLSearchParams()
    query.set('skip', String(params.skip ?? 0))
    query.set('limit', String(params.limit ?? 20))
    if (params.status) query.set('beta_status', params.status)
    if (params.authorId) query.set('author_id', params.authorId)
    return (await api.get<Raw[]>(`/betas?${query.toString()}`)).map(toBeta)
  },

  async get(id: string) {
    return toBeta(await api.get<Raw>(`/betas/${id}`))
  },

  async create(payload: {
    title: string
    description: string
    downloadType: 'LINK' | 'DIRECT'
    betaStatus: string
    externalUrl?: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
    genre?: string
    version?: string
    platforms?: string[]
    tags?: string[]
    requirements?: string
    changelog?: string
    installInstructions?: string
    coverImage?: string
    screenshots?: string[]
    externalPlatform?: string
  }) {
    return toBeta(await api.post<Raw>('/betas', payload))
  },

  async download(id: string) {
    const raw = await api.post<Raw>(`/betas/${id}/download`)
    return {
      url: str(raw.url),
      downloadType: str(raw.downloadType ?? raw.download_type),
      fileName: str(raw.fileName ?? raw.file_name) || null,
      fileSize: raw.fileSize ?? raw.file_size ? Number(raw.fileSize ?? raw.file_size) : null,
      downloads: Number(raw.downloads ?? 0),
    }
  },
}

/* -------------------------------------------------------------------------- */
/*                                   Tienda                                   */
/* -------------------------------------------------------------------------- */

export const storeApi = {
  async items(): Promise<StoreItemsResponse> {
    const raw = await api.get<Raw>('/store/items', false)
    const items = list(raw.items).map(toStoreItem)
    const grouped: Record<string, StoreItem[]> = {}
    if (raw.grouped && typeof raw.grouped === 'object') {
      for (const [key, value] of Object.entries(raw.grouped as Record<string, unknown>)) {
        grouped[key] = list(value).map(toStoreItem)
      }
    }
    return { items, grouped }
  },

  async balance(): Promise<BalanceResponse> {
    const raw = await api.get<Raw>('/store/balance')
    return {
      balance: Number(raw.balance ?? 0),
      transactions: list(raw.transactions).map((t) => ({
        id: str(t.id),
        amount: Number(t.amount ?? 0),
        type: str(t.type),
        description: str(t.description),
        createdAt: str(t.createdAt ?? t.created_at),
      })),
    }
  },

  async buy(itemId: string): Promise<BuyResponse> {
    const raw = await api.post<Raw>('/store/buy', { itemId })
    const purchase = (raw.purchase ?? {}) as Raw
    return {
      success: raw.success === true,
      balance: Number(raw.balance ?? 0),
      purchase: {
        id: str(purchase.id),
        itemId: str(purchase.itemId ?? purchase.item_id),
        pricePaid: Number(purchase.pricePaid ?? purchase.price_paid ?? 0),
        createdAt: str(purchase.createdAt ?? purchase.created_at),
        item: toStoreItem((purchase.item ?? {}) as Raw),
      } satisfies Purchase,
    }
  },

  async myItems(): Promise<Purchase[]> {
    const raw = await api.get<Raw>('/store/my-items')
    return list(raw.items).map((p) => ({
      id: str(p.id),
      itemId: str(p.itemId ?? p.item_id),
      pricePaid: Number(p.pricePaid ?? p.price_paid ?? 0),
      createdAt: str(p.createdAt ?? p.created_at),
      item: toStoreItem((p.item ?? {}) as Raw),
    }))
  },
}

/* -------------------------------------------------------------------------- */
/*                             Descubrir · Buscar                             */
/* -------------------------------------------------------------------------- */

export const discoveryApi = {
  async discover(): Promise<DiscoverData> {
    const raw = await api.get<Raw>('/discover')
    return {
      trending: list(raw.trending).map(toPost),
      recommendedUsers: list(raw.recommendedUsers).map(toUserSearchItem),
      popularBetas: list(raw.popularBetas).map(toBetaCard),
      popularTags: list(raw.popularTags).map((t) => ({
        tag: str(t.tag),
        count: Number(t.count ?? 0),
      })),
      recent: list(raw.recent).map(toPost),
    }
  },

  async search(q: string, signal?: AbortSignal): Promise<SearchData> {
    const raw = await api.get<Raw>(`/search?q=${encodeURIComponent(q)}`, true, signal)
    return {
      q: str(raw.q, q),
      users: list(raw.users).map(toUserSearchItem),
      posts: list(raw.posts).map(toPost),
    }
  },
}

/* -------------------------------------------------------------------------- */
/*                                  Seguridad                                 */
/* -------------------------------------------------------------------------- */

export const securityApi = {
  report: postsApi.report,

  async block(userId: string) {
    return api.post<Raw>('/security/block', { blockedId: userId })
  },

  async unblock(userId: string) {
    return api.del<Raw>(`/security/block?blockedId=${encodeURIComponent(userId)}`)
  },

  async blocked() {
    const raw = await api.get<Raw>('/security/block/list')
    return list(raw.blocked).map((b) => ({
      id: str(b.id),
      username: str(b.username),
      avatar: str(b.avatar) || null,
    }))
  },

  privacy: (isPrivate: boolean) => api.patch<Raw>('/security/privacy', { isPrivate }),

  password: (currentPassword: string, newPassword: string) =>
    api.post<Raw>('/security/password', { currentPassword, newPassword }),

  async loginEvents() {
    const raw = await api.get<Raw>('/security/login-events')
    return list(raw.events).map((e) => ({
      id: str(e.id),
      email: str(e.email) || null,
      success: e.success === true,
      ip: str(e.ip) || null,
      userAgent: str(e.userAgent ?? e.user_agent) || null,
      createdAt: str(e.createdAt ?? e.created_at),
    }))
  },
}

export type { PostType }
