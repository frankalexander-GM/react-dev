/**
 * Modelos del API de DevPlay.
 *
 * El backend mezcla convenciones (herencia de Prisma):
 *  - posts / users / polls  → snake_case
 *  - betas / chat / dm / notificaciones / discover → camelCase
 *
 * Los normalizadores de este archivo aceptan ambas formas, igual que hacía
 * el frontend de Flutter, para que los componentes trabajen con un solo tipo.
 */

export type Raw = Record<string, unknown>

export const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback

export const num = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export const bool = (v: unknown): boolean => v === true

export const list = (v: unknown): Raw[] =>
  Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as Raw[]) : []

export const iso = (v: unknown): string => {
  if (typeof v === 'string') return v
  if (v instanceof Date) return v.toISOString()
  return new Date().toISOString()
}

/* -------------------------------------------------------------------------- */
/*                                   Autor                                    */
/* -------------------------------------------------------------------------- */

export interface Author {
  id: string
  username: string
  fullName: string | null
  avatar: string | null
}

export function toAuthor(raw: Raw | null | undefined): Author | null {
  if (!raw) return null
  const username = str(raw.username)
  if (!raw.id && !username) return null
  return {
    id: str(raw.id),
    username,
    fullName: str(raw.full_name ?? raw.fullName) || null,
    avatar: str(raw.avatar) || null,
  }
}

export function authorName(author: Author | null | undefined): string {
  if (!author) return 'DevPlay'
  return author.fullName?.trim() || author.username || 'DevPlay'
}

/* -------------------------------------------------------------------------- */
/*                                    Posts                                   */
/* -------------------------------------------------------------------------- */

export type PostType = 'POST' | 'BETA' | 'STREAM' | 'POLL'

export interface MediaItem {
  url: string
  kind: 'image' | 'video'
}

export interface Post {
  id: string
  type: PostType
  content: string
  media: MediaItem[]
  author: Author | null
  likesCount: number
  commentsCount: number
  liked: boolean
  bookmarked: boolean
  createdAt: string
  updatedAt: string | null
  repostOf: Post | null
  beta: Beta | null
}

export function toMedia(raw: Raw): MediaItem | null {
  const url = str(raw.url)
  if (!url) return null
  return { url, kind: str(raw.kind) === 'video' ? 'video' : 'image' }
}

export function toPost(raw: Raw): Post {
  const mediaRaw = arrOf(raw.media ?? raw.mediaUrls ?? raw.media_urls)
  const repostRaw = raw.repostOf ?? raw.repost_of ?? raw.original_post
  return {
    id: str(raw.id),
    type: (str(raw.type, 'POST').toUpperCase() as PostType) ?? 'POST',
    content: str(raw.content),
    media: mediaRaw
      .map((m) => (m && typeof m === 'object' ? toMedia(m as Raw) : null))
      .filter((m): m is MediaItem => Boolean(m)),
    author: toAuthor((raw.author ?? null) as Raw | null),
    likesCount: num(raw.likes_count ?? raw.likesCount),
    commentsCount: num(raw.comments_count ?? raw.commentsCount),
    liked: bool(raw.liked_by_me ?? raw.liked),
    bookmarked: bool(raw.bookmarked_by_me ?? raw.bookmarked ?? raw.savedAt ?? raw.saved_at),
    createdAt: iso(raw.created_at ?? raw.createdAt),
    updatedAt: raw.updated_at ? iso(raw.updated_at) : null,
    repostOf:
      repostRaw && typeof repostRaw === 'object' ? toPost(repostRaw as Raw) : null,
    beta: raw.beta && typeof raw.beta === 'object' ? toBeta(raw.beta as Raw) : null,
  }
}

function arrOf(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

/* -------------------------------------------------------------------------- */
/*                                    Betas                                   */
/* -------------------------------------------------------------------------- */

export type BetaStatus =
  | 'alpha'
  | 'closed_beta'
  | 'open_beta'
  | 'tech_test'
  | 'early_access'
  | 'ended'
  | 'coming_soon'

export interface Beta {
  id: string
  postId: string
  title: string
  description: string
  downloadType: 'DIRECT' | 'LINK'
  fileUrl: string | null
  fileSize: number | null
  fileName: string | null
  externalUrl: string | null
  betaStatus: BetaStatus
  genre: string | null
  version: string | null
  platforms: string[]
  tags: string[]
  requirements: string | null
  changelog: string | null
  installInstructions: string | null
  coverImage: string | null
  screenshots: string[]
  externalPlatform: string | null
  downloads: number
  createdAt: string
}

export function toBeta(raw: Raw): Beta {
  return {
    id: str(raw.id),
    postId: str(raw.postId ?? raw.post_id),
    title: str(raw.title),
    description: str(raw.description),
    downloadType: str(raw.downloadType ?? raw.download_type, 'LINK') === 'DIRECT' ? 'DIRECT' : 'LINK',
    fileUrl: str(raw.fileUrl ?? raw.file_url) || null,
    fileSize: raw.fileSize ?? raw.file_size ? num(raw.fileSize ?? raw.file_size) : null,
    fileName: str(raw.fileName ?? raw.file_name) || null,
    externalUrl: str(raw.externalUrl ?? raw.external_url) || null,
    betaStatus: str(raw.betaStatus ?? raw.beta_status, 'open_beta') as BetaStatus,
    genre: str(raw.genre) || null,
    version: str(raw.version) || null,
    platforms: strings(raw.platforms),
    tags: strings(raw.tags),
    requirements: str(raw.requirements) || null,
    changelog: str(raw.changelog) || null,
    installInstructions: str(raw.installInstructions ?? raw.install_instructions) || null,
    coverImage: str(raw.coverImage ?? raw.cover_image) || null,
    screenshots: strings(raw.screenshots),
    externalPlatform: str(raw.externalPlatform ?? raw.external_platform) || null,
    downloads: num(raw.downloads),
    createdAt: iso(raw.createdAt ?? raw.created_at),
  }
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

export const BETA_STATUS_LABEL: Record<BetaStatus, string> = {
  alpha: 'Alpha',
  closed_beta: 'Beta cerrada',
  open_beta: 'Beta abierta',
  tech_test: 'Prueba técnica',
  early_access: 'Acceso anticipado',
  ended: 'Finalizada',
  coming_soon: 'Próximamente',
}

/* -------------------------------------------------------------------------- */
/*                                 Encuestas                                  */
/* -------------------------------------------------------------------------- */

export interface PollOption {
  id: string
  text: string
  position: number
  voteCount: number
}

export interface Poll {
  id: string
  postId: string
  question: string
  allowMultiple: boolean
  closesAt: string | null
  options: PollOption[]
  totalVotes: number
  isClosed: boolean
  votedOptionIds: string[]
  createdAt: string
}

export function toPoll(raw: Raw): Poll {
  return {
    id: str(raw.id),
    postId: str(raw.post_id ?? raw.postId),
    question: str(raw.question),
    allowMultiple: bool(raw.allow_multiple ?? raw.allowMultiple),
    closesAt: str(raw.closes_at ?? raw.closesAt) || null,
    options: list(raw.options).map((o) => ({
      id: str(o.id),
      text: str(o.text),
      position: num(o.position),
      voteCount: num(o.vote_count ?? o.votes_count ?? o.voteCount),
    })),
    totalVotes: num(raw.total_votes ?? raw.totalVotes),
    isClosed: bool(raw.is_closed ?? raw.isClosed),
    votedOptionIds: strings(raw.voted_option_ids ?? raw.votedOptionIds),
    createdAt: iso(raw.created_at ?? raw.createdAt),
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Usuarios                                  */
/* -------------------------------------------------------------------------- */

export interface UserMe {
  id: string
  email: string
  username: string
  fullName: string | null
  bio: string | null
  avatar: string | null
  banner: string | null
  role: string
  language: string
  isGuest: boolean
  isPrivate: boolean
  tourCompleted: boolean
  devCoins: number
  location: string | null
  website: string | null
  profession: string | null
  tags: string[]
  createdAt: string
}

export function toUserMe(raw: Raw): UserMe {
  return {
    id: str(raw.id),
    email: str(raw.email),
    username: str(raw.username),
    fullName: str(raw.full_name ?? raw.fullName) || null,
    bio: str(raw.bio) || null,
    avatar: str(raw.avatar) || null,
    banner: str(raw.banner) || null,
    role: str(raw.role, 'USER'),
    language: str(raw.language, 'es'),
    isGuest: bool(raw.is_guest ?? raw.isGuest),
    isPrivate: bool(raw.is_private ?? raw.isPrivate),
    tourCompleted: bool(raw.tour_completed ?? raw.tourCompleted),
    devCoins: num(raw.dev_coins ?? raw.devCoins),
    location: str(raw.location) || null,
    website: str(raw.website) || null,
    profession: str(raw.profession) || null,
    tags: strings(raw.tags),
    createdAt: iso(raw.created_at ?? raw.createdAt),
  }
}

export interface ProfileUser {
  id: string
  username: string
  fullName: string | null
  bio: string | null
  avatar: string | null
  banner: string | null
  role: string
  isGuest: boolean
  tags: string[]
  location: string | null
  website: string | null
  profession: string | null
  createdAt: string
  followersCount: number
  followingCount: number
  postsCount: number
  isFollowing: boolean
  isBlocked: boolean
  blockedMe: boolean
}

export function toProfileUser(raw: Raw): ProfileUser {
  return {
    id: str(raw.id),
    username: str(raw.username),
    fullName: str(raw.full_name ?? raw.fullName) || null,
    bio: str(raw.bio) || null,
    avatar: str(raw.avatar) || null,
    banner: str(raw.banner) || null,
    role: str(raw.role, 'USER'),
    isGuest: bool(raw.is_guest ?? raw.isGuest),
    tags: strings(raw.tags),
    location: str(raw.location) || null,
    website: str(raw.website) || null,
    profession: str(raw.profession) || null,
    createdAt: iso(raw.created_at ?? raw.createdAt),
    followersCount: num(raw.followersCount ?? raw.followers_count),
    followingCount: num(raw.followingCount ?? raw.following_count),
    postsCount: num(raw.postsCount ?? raw.posts_count),
    isFollowing: bool(raw.isFollowing ?? raw.is_following),
    isBlocked: bool(raw.isBlocked ?? raw.is_blocked),
    blockedMe: bool(raw.blockedMe ?? raw.blocked_me),
  }
}

export interface UserStats {
  posts: number
  comments: number
  likes: number
  betas: number
  followers: number
  following: number
  bookmarks: number
  totalDownloads: number
  totalLikesReceived: number
  totalCommentsReceived: number
  points: number
  level: number
  pointsForNextLevel: number
  progressToNext: number
  activityByDay: { date: string; count: number }[]
}

export function toUserStats(raw: Raw): UserStats {
  return {
    posts: num(raw.posts),
    comments: num(raw.comments),
    likes: num(raw.likes),
    betas: num(raw.betas),
    followers: num(raw.followers),
    following: num(raw.following),
    bookmarks: num(raw.bookmarks),
    totalDownloads: num(raw.totalDownloads ?? raw.total_downloads),
    totalLikesReceived: num(raw.totalLikesReceived ?? raw.total_likes_received),
    totalCommentsReceived: num(raw.totalCommentsReceived ?? raw.total_comments_received),
    points: num(raw.points),
    level: num(raw.level, 1),
    pointsForNextLevel: num(raw.pointsForNextLevel ?? raw.points_for_next_level),
    progressToNext: num(raw.progressToNext ?? raw.progress_to_next),
    activityByDay: list(raw.activityByDay ?? raw.activity_by_day).map((d) => ({
      date: str(d.date),
      count: num(d.count),
    })),
  }
}

export interface FollowUser {
  id: string
  username: string
  avatar: string | null
  bio: string | null
  role: string
  followersCount: number
  postsCount: number
  followedAt: string
}

export function toFollowUser(raw: Raw): FollowUser {
  return {
    id: str(raw.id),
    username: str(raw.username),
    avatar: str(raw.avatar) || null,
    bio: str(raw.bio) || null,
    role: str(raw.role, 'USER'),
    followersCount: num(raw.followersCount ?? raw.followers_count),
    postsCount: num(raw.postsCount ?? raw.posts_count),
    followedAt: iso(raw.followedAt ?? raw.followed_at),
  }
}

export interface Achievement {
  id: string
  label: string
  description: string
  emoji: string
  unlocked: boolean
  progress: number
  target: number
  tier: string
}

export function toAchievement(raw: Raw): Achievement {
  return {
    id: str(raw.id),
    label: str(raw.label),
    description: str(raw.description),
    emoji: str(raw.emoji, '🏅'),
    unlocked: bool(raw.unlocked),
    progress: num(raw.progress),
    target: num(raw.target),
    tier: str(raw.tier, 'bronze'),
  }
}

/* -------------------------------------------------------------------------- */
/*                                Comentarios                                 */
/* -------------------------------------------------------------------------- */

export interface Comment {
  id: string
  postId: string
  content: string
  author: Author | null
  createdAt: string
}

export function toComment(raw: Raw): Comment {
  return {
    id: str(raw.id),
    postId: str(raw.post_id ?? raw.postId),
    content: str(raw.content),
    author: toAuthor((raw.author ?? null) as Raw | null),
    createdAt: iso(raw.created_at ?? raw.createdAt),
  }
}

/* -------------------------------------------------------------------------- */
/*                              Chat · DM · Avisos                            */
/* -------------------------------------------------------------------------- */

export interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  createdAt: string
}

export function toChatMessage(raw: Raw): ChatMessage {
  return {
    id: str(raw.id),
    userId: str(raw.userId ?? raw.user_id),
    username: str(raw.username),
    content: str(raw.content),
    createdAt: iso(raw.createdAt ?? raw.created_at),
  }
}

export interface Conversation {
  peerId: string
  peerUsername: string
  peerAvatar: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export function toConversation(raw: Raw): Conversation {
  return {
    peerId: str(raw.peerId ?? raw.peer_id),
    peerUsername: str(raw.peerUsername ?? raw.peer_username),
    peerAvatar: str(raw.peerAvatar ?? raw.peer_avatar) || null,
    lastMessage: str(raw.lastMessage ?? raw.last_message),
    lastMessageAt: iso(raw.lastMessageAt ?? raw.last_message_at),
    unreadCount: num(raw.unreadCount ?? raw.unread_count),
  }
}

export interface DirectMessage {
  id: string
  senderId: string
  recipientId: string
  content: string
  readAt: string | null
  createdAt: string
}

export function toDirectMessage(raw: Raw): DirectMessage {
  return {
    id: str(raw.id),
    senderId: str(raw.senderId ?? raw.sender_id),
    recipientId: str(raw.recipientId ?? raw.recipient_id),
    content: str(raw.content),
    readAt: str(raw.readAt ?? raw.read_at) || null,
    createdAt: iso(raw.createdAt ?? raw.created_at),
  }
}

export interface AppNotification {
  id: string
  type: 'LIVE' | 'FOLLOW' | 'COMMENT' | 'LIKE' | string
  message: string
  entityId: string | null
  read: boolean
  fromUserId: string
  fromUsername: string
  createdAt: string
}

export function toNotification(raw: Raw): AppNotification {
  return {
    id: str(raw.id),
    type: str(raw.type, 'LIKE'),
    message: str(raw.message),
    entityId: str(raw.entityId ?? raw.entity_id) || null,
    read: bool(raw.read),
    fromUserId: str(raw.fromUserId ?? raw.from_user_id),
    fromUsername: str(raw.fromUsername ?? raw.from_username),
    createdAt: iso(raw.createdAt ?? raw.created_at),
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Descubrir                                 */
/* -------------------------------------------------------------------------- */

export interface UserSearchItem {
  id: string
  username: string
  fullName: string | null
  bio: string | null
  avatar: string | null
  role: string
  followersCount: number
  postsCount: number
}

export function toUserSearchItem(raw: Raw): UserSearchItem {
  return {
    id: str(raw.id),
    username: str(raw.username),
    fullName: str(raw.full_name ?? raw.fullName) || null,
    bio: str(raw.bio) || null,
    avatar: str(raw.avatar) || null,
    role: str(raw.role, 'USER'),
    followersCount: num(raw.followersCount ?? raw.followers_count),
    postsCount: num(raw.postsCount ?? raw.posts_count),
  }
}

export interface BetaCard {
  id: string
  postId: string
  title: string
  description: string | null
  coverImage: string | null
  downloads: number
  genre: string | null
  version: string | null
  author: Author | null
  likesCount: number
}

export function toBetaCard(raw: Raw): BetaCard {
  return {
    id: str(raw.id),
    postId: str(raw.postId ?? raw.post_id),
    title: str(raw.title),
    description: str(raw.description) || null,
    coverImage: str(raw.coverImage ?? raw.cover_image) || null,
    downloads: num(raw.downloads),
    genre: str(raw.genre) || null,
    version: str(raw.version) || null,
    author: toAuthor((raw.author ?? null) as Raw | null),
    likesCount: num(raw.likesCount ?? raw.likes_count),
  }
}

export interface TagCount {
  tag: string
  count: number
}

export interface DiscoverData {
  trending: Post[]
  recommendedUsers: UserSearchItem[]
  popularBetas: BetaCard[]
  popularTags: TagCount[]
  recent: Post[]
}

export interface SearchData {
  q: string
  users: UserSearchItem[]
  posts: Post[]
}

/* -------------------------------------------------------------------------- */
/*                                   Tienda                                   */
/* -------------------------------------------------------------------------- */

export interface StoreItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  icon: string
  imageUrl: string | null
  effect: string | null
  duration: number | null
}

export function toStoreItem(raw: Raw): StoreItem {
  return {
    id: str(raw.id),
    name: str(raw.name),
    description: str(raw.description),
    price: num(raw.price),
    category: str(raw.category, 'powerup'),
    icon: str(raw.icon, 'sparkles'),
    imageUrl: str(raw.imageUrl ?? raw.image_url) || null,
    effect: str(raw.effect) || null,
    duration: num(raw.duration) || null,
  }
}

export interface BalanceTransaction {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

export interface Purchase {
  id: string
  itemId: string
  pricePaid: number
  createdAt: string
  item: StoreItem
}

export interface StoreItemsResponse {
  items: StoreItem[]
  grouped: Record<string, StoreItem[]>
}

export interface BalanceResponse {
  balance: number
  transactions: BalanceTransaction[]
}

export interface BuyResponse {
  success: boolean
  purchase: Purchase
  balance: number
}
