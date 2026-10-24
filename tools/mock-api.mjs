/**
 * Mock mínimo del API de DevPlay — SOLO para desarrollo visual del frontend.
 *
 * No sustituye al backend FastAPI: sirve para trabajar en la UI sin PostgreSQL.
 *   node tools/mock-api.mjs        (escucha en http://localhost:8099)
 *   VITE_API_URL=http://localhost:8099/api/v1 npm run dev
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_PORT ?? 8099)
const now = Date.now()
const iso = (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString()

const me = {
  id: 'u-frank',
  email: 'frank@devplay.dev',
  username: 'frankdev',
  full_name: 'Frank Alexander',
  bio: 'Haciendo un metroidvania de bolsillo. Busco testers con paciencia.',
  avatar: null,
  banner: null,
  role: 'DEV',
  language: 'es',
  is_guest: false,
  is_private: false,
  tour_completed: false,
  dev_coins: 320,
  location: 'Bogotá, Colombia',
  website: 'https://frank.dev',
  profession: 'Game designer',
  tags: ['unity', 'pixel art', 'narrativa'],
  created_at: iso(60 * 24 * 400),
  updated_at: iso(10),
}

const users = [
  {
    id: 'u-frank',
    username: 'frankdev',
    full_name: 'Frank Alexander',
    avatar: null,
    role: 'DEV',
    bio: 'Haciendo un metroidvania de bolsillo.',
    followersCount: 128,
    postsCount: 6,
  },
  {
    id: 'u-lu',
    username: 'lucia_pixel',
    full_name: 'Lucía Ríos',
    avatar: null,
    role: 'DEV',
    bio: 'Artista pixel. 32x32 y a dormir.',
    followersCount: 340,
    postsCount: 12,
  },
  {
    id: 'u-mateo',
    username: 'mateo_builds',
    full_name: 'Mateo Vélez',
    avatar: null,
    role: 'DEV',
    bio: 'Roguelikes y sistemas emergentes.',
    followersCount: 96,
    postsCount: 8,
  },
]

const author = (id) => {
  const user = users.find((item) => item.id === id) ?? users[0]
  return { id: user.id, username: user.username, full_name: user.full_name, avatar: null }
}

const betas = [
  {
    id: 'b-1',
    postId: 'p-2',
    title: 'Neon Drift',
    description:
      'Un metroidvania de bolsillo con combate aéreo y un mapa que se reescribe. Busco feedback del tutorial y del primer jefe.',
    downloadType: 'LINK',
    externalUrl: 'https://example.com/neon-drift',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    betaStatus: 'open_beta',
    genre: 'Metroidvania',
    version: '0.4.2',
    platforms: ['PC', 'Windows'],
    tags: ['metroidvania', 'pixel art'],
    requirements: 'Windows 10, 4 GB RAM',
    changelog: 'Nuevo dash, rebalance del jefe 1.',
    installInstructions: 'Descomprime y ejecuta NeonDrift.exe. Reporta bugs con capturas.',
    coverImage: null,
    screenshots: [],
    externalPlatform: 'itch.io',
    downloads: 214,
    createdAt: iso(60 * 30),
  },
  {
    id: 'b-2',
    postId: 'p-5',
    title: 'Cartas del Sur',
    description:
      'Juego narrativo de cartas sobre un pueblo que se inunda. Beta cerrada para 20 testers.',
    downloadType: 'LINK',
    externalUrl: 'https://example.com/cartas',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    betaStatus: 'closed_beta',
    genre: 'Narrativo',
    version: '0.2.0',
    platforms: ['PC', 'macOS'],
    tags: ['narrativa', 'cartas'],
    requirements: '8 GB RAM',
    changelog: 'Capítulo 2 completo.',
    installInstructions: 'Pulsa el enlace y pide acceso.',
    coverImage: null,
    screenshots: [],
    externalPlatform: 'Steam',
    downloads: 48,
    createdAt: iso(60 * 72),
  },
  {
    id: 'b-3',
    postId: 'p-7',
    title: 'Tiny Orchard',
    description: 'Cozy farming en 1-bit. Primera build técnica para medir rendimiento.',
    downloadType: 'DIRECT',
    externalUrl: null,
    fileUrl: 'https://example.com/tiny-orchard.zip',
    fileName: 'tiny-orchard-0.1.zip',
    fileSize: 42_000_000,
    betaStatus: 'tech_test',
    genre: 'Cozy',
    version: '0.1.0',
    platforms: ['Web'],
    tags: ['cozy', '1-bit'],
    requirements: 'Navegador moderno',
    changelog: null,
    installInstructions: 'Abre el zip y sirve la carpeta con cualquier static server.',
    coverImage: null,
    screenshots: [],
    externalPlatform: null,
    downloads: 12,
    createdAt: iso(60 * 6),
  },
]

const postBase = {
  media: [],
  author: null,
  likes_count: 0,
  comments_count: 0,
  liked_by_me: false,
  bookmarked_by_me: false,
  created_at: iso(30),
  updated_at: iso(30),
}

const posts = [
  {
    ...postBase,
    id: 'p-1',
    type: 'POST',
    content:
      'Después de tres semanas peleándome con el wall-jump por fin se siente bien.\n\nEl truco fue separar la detección de pared del input buffer: 6 frames de gracia y ya no se cae del salto. ¿Opiniones?',
    author: author('u-frank'),
    likes_count: 34,
    comments_count: 6,
    liked_by_me: true,
    created_at: iso(12),
  },
  {
    ...postBase,
    id: 'p-2',
    type: 'BETA',
    content:
      'Neon Drift 0.4.2 ya está arriba. Cambios grandes en el dash y el primer jefe.\n\nNecesito sobre todo feedback del tutorial: si algo no se entiende, decídmelo sin piedad.',
    author: author('u-frank'),
    likes_count: 58,
    comments_count: 11,
    created_at: iso(95),
  },
  {
    ...postBase,
    id: 'p-3',
    type: 'POLL',
    content: '¿Qué preferís en un metroidvania corto?',
    author: author('u-frank'),
    likes_count: 12,
    comments_count: 3,
    created_at: iso(160),
  },
  {
    ...postBase,
    id: 'p-4',
    type: 'POST',
    content:
      'Captura del nuevo bioma: invernadero abandonado. Todavía sin luces finales, pero la paleta ya me convence.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=70',
        kind: 'image',
      },
    ],
    author: author('u-lu'),
    likes_count: 91,
    comments_count: 14,
    created_at: iso(240),
  },
  {
    ...postBase,
    id: 'p-5',
    type: 'BETA',
    content:
      'Cartas del Sur entra en beta cerrada. Si te gustan los juegos narrativos lentos, esto es para ti.',
    author: author('u-mateo'),
    likes_count: 44,
    comments_count: 7,
    created_at: iso(400),
  },
  {
    ...postBase,
    id: 'p-6',
    type: 'STREAM',
    content: 'En directo: rompiendo el sistema de guardado y arreglándolo en vivo.',
    author: author('u-lu'),
    likes_count: 21,
    comments_count: 2,
    created_at: iso(560),
  },
  {
    ...postBase,
    id: 'p-7',
    type: 'BETA',
    content:
      'Tiny Orchard: primera build técnica. Es un cozy farming en 1-bit, sí, otra vez. Mido FPS en móviles viejos.',
    author: author('u-mateo'),
    likes_count: 8,
    comments_count: 1,
    created_at: iso(620),
  },
]

const polls = {
  'p-3': {
    id: 'poll-1',
    post_id: 'p-3',
    question: '¿Qué preferís en un metroidvania corto?',
    allow_multiple: false,
    closes_at: null,
    options: [
      { id: 'o-1', text: 'Combate técnico', position: 0, vote_count: 18 },
      { id: 'o-2', text: 'Exploración y secretos', position: 1, vote_count: 31 },
      { id: 'o-3', text: 'Historia y personajes', position: 2, vote_count: 12 },
    ],
    total_votes: 61,
    is_closed: false,
    voted_option_ids: [],
    created_at: iso(160),
  },
}

const comments = {
  'p-1': [
    {
      id: 'c-1',
      post_id: 'p-1',
      content: 'El buffer de 6 frames se siente justo. Yo probaría 4 para el dash.',
      author: author('u-mateo'),
      created_at: iso(8),
    },
    {
      id: 'c-2',
      post_id: 'p-1',
      content: '¡Se ve genial! ¿Lo vas a subir a itch?',
      author: author('u-lu'),
      created_at: iso(5),
    },
  ],
}

const chats = [
  { id: 'm-1', userId: 'u-lu', username: 'lucia_pixel', content: '¿Ya viste el nuevo bioma?', createdAt: iso(40) },
  { id: 'm-2', userId: 'u-frank', username: 'frankdev', content: 'Sí, la paleta me encanta.', createdAt: iso(38) },
  { id: 'm-3', userId: 'u-mateo', username: 'mateo_builds', content: 'Alguien probó el build de Tiny Orchard?', createdAt: iso(22) },
  { id: 'm-4', userId: 'u-frank', username: 'frankdev', content: 'Yo lo abro esta noche.', createdAt: iso(20) },
]

const conversations = [
  {
    peerId: 'u-lu',
    peerUsername: 'lucia_pixel',
    peerAvatar: null,
    lastMessage: 'Te paso el sprite en cuanto lo termine',
    lastMessageAt: iso(15),
    unreadCount: 2,
  },
  {
    peerId: 'u-mateo',
    peerUsername: 'mateo_builds',
    peerAvatar: null,
    lastMessage: '¿Probaste el tutorial nuevo?',
    lastMessageAt: iso(90),
    unreadCount: 0,
  },
]

const dms = {
  'u-lu': [
    { id: 'd-1', senderId: 'u-lu', recipientId: 'u-frank', content: '¡Hola! ¿Cómo va el jefe?', readAt: iso(30), createdAt: iso(32) },
    { id: 'd-2', senderId: 'u-frank', recipientId: 'u-lu', content: 'Peleando con la segunda fase 😅', readAt: iso(28), createdAt: iso(29) },
    { id: 'd-3', senderId: 'u-lu', recipientId: 'u-frank', content: 'Te paso el sprite en cuanto lo termine', readAt: null, createdAt: iso(15) },
  ],
}

const notifications = [
  { id: 'n-1', type: 'LIKE', message: 'le dio me gusta a tu publicación', entity_id: 'p-1', read: false, from_user_id: 'u-lu', from_username: 'lucia_pixel', created_at: iso(4) },
  { id: 'n-2', type: 'COMMENT', message: 'comentó tu publicación', entity_id: 'p-1', read: false, from_user_id: 'u-mateo', from_username: 'mateo_builds', created_at: iso(9) },
  { id: 'n-3', type: 'FOLLOW', message: 'empezó a seguirte', entity_id: 'u-lu', read: true, from_user_id: 'u-lu', from_username: 'lucia_pixel', created_at: iso(120) },
]

const storeItems = [
  { id: 's-1', name: 'Perfil destacado', description: 'Tu perfil aparece en recomendados durante 7 días.', price: 120, category: 'powerup', icon: 'zap', imageUrl: null, effect: 'feature', duration: 7, createdAt: iso(1000) },
  { id: 's-2', name: 'Marco neón', description: 'Marco animado para tu avatar.', price: 80, category: 'avatar', icon: 'star', imageUrl: null, effect: 'frame', duration: null, createdAt: iso(1000) },
  { id: 's-3', name: 'Pack de betas', description: 'Tres destacados de beta en el centro de betas.', price: 200, category: 'bundle', icon: 'package', imageUrl: null, effect: 'boost', duration: null, createdAt: iso(1000) },
  { id: 's-4', name: 'Insignia fundador', description: 'Una insignia permanente junto a tu nombre.', price: 300, category: 'premium', icon: 'crown', imageUrl: null, effect: 'badge', duration: null, createdAt: iso(1000) },
]

const json = (res, status, body) => {
  const payload = body === null ? '' : JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  })
  res.end(payload)
}

const readBody = (req) =>
  new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
  })

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, null)
    return
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const path = url.pathname.replace(/^\/api\/v1/, '')
  const method = req.method ?? 'GET'
  const body = method === 'GET' ? {} : await readBody(req)

  // ------------------------------------------------------------- auth
  if (path === '/auth/login' && method === 'POST') {
    json(res, 200, { access_token: 'mock-access', refresh_token: 'mock-refresh', token_type: 'bearer', user: me })
    return
  }
  if (path === '/auth/guest' && method === 'POST') {
    json(res, 200, {
      id: 'u-guest',
      username: 'invitado_482',
      isGuest: true,
      access_token: 'mock-guest',
      refresh_token: 'mock-guest-refresh',
      token_type: 'bearer',
    })
    return
  }
  if (path === '/auth/register' && method === 'POST') {
    json(res, 201, { ok: true, id: 'u-new', username: body.username ?? 'nuevo', sentTo: 'f***@correo.com', demoCode: '123456' })
    return
  }
  if (path === '/auth/verify-register' && method === 'POST') {
    json(res, 200, { ok: true, username: 'nuevo', sentTo: 'f***@correo.com', demoCode: '123456' })
    return
  }
  if (path === '/auth/me') {
    json(res, 200, me)
    return
  }
  if (path === '/auth/refresh') {
    json(res, 200, { access_token: 'mock-access', refresh_token: 'mock-refresh', token_type: 'bearer' })
    return
  }

  // ------------------------------------------------------------ posts
  if (path === '/posts' && method === 'GET') {
    const skip = Number(url.searchParams.get('skip') ?? 0)
    const limit = Number(url.searchParams.get('limit') ?? 20)
    json(res, 200, { items: posts.slice(skip, skip + limit), total: posts.length, skip, limit })
    return
  }
  if (path === '/posts' && method === 'POST') {
    const created = {
      ...postBase,
      id: `p-${Date.now()}`,
      type: body.type ?? 'POST',
      content: body.content ?? '',
      media: body.media ?? [],
      author: author('u-frank'),
      created_at: new Date().toISOString(),
    }
    posts.unshift(created)
    json(res, 201, created)
    return
  }

  const postMatch = path.match(/^\/posts\/([^/]+)$/)
  if (postMatch && method === 'GET') {
    const post = posts.find((item) => item.id === postMatch[1])
    json(res, post ? 200 : 404, post ?? { detail: 'Post not found' })
    return
  }
  if (postMatch && method === 'DELETE') {
    json(res, 204, null)
    return
  }

  const likeMatch = path.match(/^\/posts\/([^/]+)\/likes$/)
  if (likeMatch && method === 'POST') {
    const post = posts.find((item) => item.id === likeMatch[1])
    if (post) {
      post.liked_by_me = !post.liked_by_me
      post.likes_count += post.liked_by_me ? 1 : -1
      json(res, 200, { active: post.liked_by_me, count: post.likes_count })
      return
    }
  }

  const bookmarkMatch = path.match(/^\/posts\/([^/]+)\/bookmarks$/)
  if (bookmarkMatch && method === 'POST') {
    json(res, 200, { active: true, count: 1 })
    return
  }

  const commentsMatch = path.match(/^\/posts\/([^/]+)\/comments$/)
  if (commentsMatch) {
    const postComments = (comments[commentsMatch[1]] ??= [])
    if (method === 'GET') {
      json(res, 200, postComments)
      return
    }
    const created = {
      id: `c-${Date.now()}`,
      post_id: commentsMatch[1],
      content: body.content ?? '',
      author: author('u-frank'),
      created_at: new Date().toISOString(),
    }
    postComments.push(created)
    json(res, 201, created)
    return
  }

  const pollMatch = path.match(/^\/posts\/([^/]+)\/poll$/)
  if (pollMatch && method === 'GET') {
    const poll = polls[pollMatch[1]]
    json(res, poll ? 200 : 404, poll ?? { detail: 'This post has no poll' })
    return
  }
  if (pollMatch && method === 'POST') {
    const poll = {
      id: 'poll-new',
      post_id: pollMatch[1],
      question: body.question,
      allow_multiple: body.allow_multiple ?? false,
      closes_at: null,
      options: (body.options ?? []).map((option, index) => ({
        id: `o-${index}`,
        text: option.text,
        position: index,
        vote_count: 0,
      })),
      total_votes: 0,
      is_closed: false,
      voted_option_ids: [],
      created_at: new Date().toISOString(),
    }
    polls[pollMatch[1]] = poll
    json(res, 201, poll)
    return
  }

  const voteMatch = path.match(/^\/polls\/([^/]+)\/vote$/)
  if (voteMatch && method === 'POST') {
    const poll = Object.values(polls).find((item) => item.id === voteMatch[1])
    if (poll) {
      poll.voted_option_ids = body.option_ids ?? []
      poll.options.forEach((option) => {
        if (poll.voted_option_ids.includes(option.id)) option.vote_count += 1
      })
      poll.total_votes = poll.options.reduce((sum, option) => sum + option.vote_count, 0)
      json(res, 200, { poll, created: true })
      return
    }
  }

  // --------------------------------------------------------- discovery
  if (path === '/discover') {
    json(res, 200, {
      trending: [...posts].sort((a, b) => b.likes_count - a.likes_count).slice(0, 3),
      recommendedUsers: users.slice(1),
      popularBetas: betas.map((beta) => ({
        id: beta.id,
        postId: beta.postId,
        title: beta.title,
        description: beta.description,
        coverImage: beta.coverImage,
        downloads: beta.downloads,
        genre: beta.genre,
        version: beta.version,
        author: author('u-frank'),
        likesCount: 12,
      })),
      popularTags: [
        { tag: 'pixelart', count: 34 },
        { tag: 'metroidvania', count: 21 },
        { tag: 'narrativa', count: 17 },
        { tag: 'cozy', count: 12 },
      ],
      recent: posts.slice(0, 3),
    })
    return
  }

  if (path === '/search') {
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    json(res, 200, {
      q,
      users: users.filter((user) => user.username.includes(q) || (user.full_name ?? '').toLowerCase().includes(q)),
      posts: posts.filter((post) => post.content.toLowerCase().includes(q)),
    })
    return
  }

  // ------------------------------------------------------------ betas
  if (path === '/betas' && method === 'GET') {
    const status = url.searchParams.get('beta_status')
    json(res, 200, status ? betas.filter((beta) => beta.betaStatus === status) : betas)
    return
  }
  const betaMatch = path.match(/^\/betas\/([^/]+)$/)
  if (betaMatch && method === 'GET') {
    const beta = betas.find((item) => item.id === betaMatch[1])
    json(res, beta ? 200 : 404, beta ?? { detail: 'Beta not found' })
    return
  }
  const downloadMatch = path.match(/^\/betas\/([^/]+)\/download$/)
  if (downloadMatch && method === 'POST') {
    const beta = betas.find((item) => item.id === downloadMatch[1])
    if (beta) {
      beta.downloads += 1
      json(res, 200, {
        betaId: beta.id,
        downloadType: beta.downloadType,
        url: beta.downloadType === 'DIRECT' ? beta.fileUrl : beta.externalUrl,
        fileName: beta.fileName,
        fileSize: beta.fileSize,
        downloads: beta.downloads,
      })
      return
    }
  }

  // ------------------------------------------------------------- chat
  if (path === '/chat' && method === 'GET') {
    json(res, 200, [...chats].reverse())
    return
  }
  if (path === '/chat' && method === 'POST') {
    const message = {
      id: `m-${Date.now()}`,
      userId: 'u-frank',
      username: 'frankdev',
      content: body.content ?? '',
      createdAt: new Date().toISOString(),
    }
    chats.push(message)
    json(res, 201, message)
    return
  }
  if (path === '/dm' && method === 'GET') {
    json(res, 200, conversations)
    return
  }
  const dmMatch = path.match(/^\/dm\/([^/]+)$/)
  if (dmMatch) {
    if (method === 'GET') {
      json(res, 200, dms[dmMatch[1]] ?? [])
      return
    }
    const created = {
      id: `d-${Date.now()}`,
      senderId: 'u-frank',
      recipientId: dmMatch[1],
      content: body.content ?? '',
      readAt: null,
      createdAt: new Date().toISOString(),
    }
    ;(dms[dmMatch[1]] ??= []).push(created)
    json(res, 201, created)
    return
  }
  const readMatch = path.match(/^\/dm\/([^/]+)\/read$/)
  if (readMatch) {
    json(res, 200, { user_id: readMatch[1], marked: 2 })
    return
  }

  // ---------------------------------------------------- notificaciones
  if (path === '/notifications') {
    json(res, 200, { items: notifications, unreadCount: 2, total: notifications.length, skip: 0, limit: 30 })
    return
  }
  if (path === '/notifications/unread-count') {
    json(res, 200, { notifications: 2, direct_messages: 2 })
    return
  }
  if (path === '/notifications/read-all') {
    notifications.forEach((item) => (item.read = true))
    json(res, 200, { marked: notifications.length })
    return
  }
  const notifMatch = path.match(/^\/notifications\/([^/]+)\/read$/)
  if (notifMatch) {
    const item = notifications.find((n) => n.id === notifMatch[1])
    if (item) item.read = true
    json(res, 200, item ?? {})
    return
  }
  const notifDelete = path.match(/^\/notifications\/([^/]+)$/)
  if (notifDelete && method === 'DELETE') {
    json(res, 204, null)
    return
  }

  // ---------------------------------------------------------- usuarios
  if (path === '/users/me') {
    json(res, 200, me)
    return
  }
  if (path === '/users/me/stats') {
    json(res, 200, {
      stats: {
        posts: 6,
        comments: 12,
        likes: 40,
        betas: 3,
        followers: 128,
        following: 34,
        bookmarks: 9,
        totalDownloads: 274,
        totalLikesReceived: 186,
        totalCommentsReceived: 44,
        points: 740,
        level: 4,
        pointsForNextLevel: 1000,
        progressToNext: 0.74,
        activityByDay: [],
      },
    })
    return
  }
  if (path === '/users/me/achievements') {
    json(res, 200, {
      achievements: [
        { id: 'a-1', label: 'Primer build', description: 'Publicaste tu primera beta', emoji: '🚀', unlocked: true, progress: 1, target: 1, tier: 'bronze' },
        { id: 'a-2', label: 'Tester amable', description: 'Deja 10 comentarios útiles', emoji: '💬', unlocked: true, progress: 10, target: 10, tier: 'silver' },
        { id: 'a-3', label: 'Imán de testers', description: 'Consigue 100 descargas', emoji: '🧲', unlocked: false, progress: 74, target: 100, tier: 'gold' },
      ],
      totalUnlocked: 2,
      total: 3,
    })
    return
  }
  if (path === '/users/me/bookmarks') {
    json(res, 200, { posts: [posts[3]] })
    return
  }
  if (path === '/users/by-username/frankdev') {
    json(res, 200, { user: { id: 'u-frank', username: 'frankdev' } })
    return
  }
  const followersMatch = path.match(/^\/users\/([^/]+)\/(followers|following)$/)
  if (followersMatch) {
    const key = followersMatch[2]
    json(res, 200, {
      total: users.length - 1,
      [key]: users.slice(1).map((user) => ({
        id: user.id,
        username: user.username,
        avatar: null,
        bio: user.bio,
        role: user.role,
        followersCount: user.followersCount,
        postsCount: user.postsCount,
        followedAt: iso(700),
      })),
    })
    return
  }
  const profileMatch = path.match(/^\/users\/([^/]+)$/)
  if (profileMatch && method === 'GET') {
    const user = users.find((item) => item.id === profileMatch[1]) ?? users[0]
    json(res, 200, {
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        bio: user.bio,
        avatar: null,
        banner: null,
        role: user.role,
        is_guest: false,
        tags: ['unity', 'pixel art'],
        location: 'Bogotá, Colombia',
        website: 'https://frank.dev',
        profession: user.id === 'u-frank' ? 'Game designer' : 'Artista',
        created_at: iso(60 * 24 * 400),
        followersCount: user.followersCount,
        followingCount: 34,
        postsCount: user.postsCount,
        isFollowing: false,
        isBlocked: false,
        blockedMe: false,
      },
      posts: posts.filter((post) => post.author.id === user.id),
    })
    return
  }
  if (path === '/users/me/profile' && method === 'PATCH') {
    Object.assign(me, {
      full_name: body.fullName ?? me.full_name,
      bio: body.bio ?? me.bio,
      location: body.location ?? me.location,
      website: body.website ?? me.website,
      profession: body.profession ?? me.profession,
      tags: body.tags ?? me.tags,
    })
    json(res, 200, me)
    return
  }

  // ------------------------------------------------------------ follow
  if (path === '/follow' && method === 'GET') {
    json(res, 200, { following: false, followersCount: 128, followingCount: 34 })
    return
  }
  if (path === '/follow' && method === 'POST') {
    json(res, 200, { following: true })
    return
  }
  if (path === '/follow' && method === 'DELETE') {
    json(res, 200, { following: false })
    return
  }

  // ------------------------------------------------------------- tienda
  if (path === '/store/items') {
    const grouped = storeItems.reduce((acc, item) => {
      ;(acc[item.category] ??= []).push(item)
      return acc
    }, {})
    json(res, 200, { items: storeItems, grouped })
    return
  }
  if (path === '/store/balance') {
    json(res, 200, {
      balance: 320,
      transactions: [
        { id: 't-1', userId: 'u-frank', amount: 40, type: 'reward', description: 'Recompensa diaria', createdAt: iso(30) },
        { id: 't-2', userId: 'u-frank', amount: -80, type: 'purchase', description: 'Marco neón', createdAt: iso(400) },
      ],
    })
    return
  }
  if (path === '/store/my-items') {
    json(res, 200, { items: [] })
    return
  }
  if (path === '/store/buy' && method === 'POST') {
    const item = storeItems.find((entry) => entry.id === (body.itemId ?? body.item_id))
    json(res, 200, {
      success: true,
      purchase: {
        id: 'pu-1',
        userId: 'u-frank',
        itemId: item?.id ?? 's-1',
        pricePaid: item?.price ?? 0,
        createdAt: new Date().toISOString(),
        item: item ?? storeItems[0],
      },
      transaction: { id: 't-3', userId: 'u-frank', amount: -(item?.price ?? 0), type: 'purchase', description: item?.name ?? '', createdAt: new Date().toISOString() },
      balance: 320 - (item?.price ?? 0),
    })
    return
  }

  // ---------------------------------------------------------- seguridad
  if (path === '/security/report' && method === 'POST') {
    json(res, 200, { ok: true })
    return
  }
  if (path === '/security/block/list') {
    json(res, 200, { blocked: [] })
    return
  }

  json(res, 404, { detail: `Mock sin ruta: ${method} ${path}` })
})

server.listen(PORT, () => {
  console.log(`DevPlay mock API en http://localhost:${PORT}/api/v1`)
})
