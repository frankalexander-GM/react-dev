# DevPlay — frontend React 19

[![CI](https://github.com/frankalexander-GM/react-dev/actions/workflows/ci.yml/badge.svg)](https://github.com/frankalexander-GM/react-dev/actions/workflows/ci.yml)

Port a **React 19 + TypeScript + Vite** del frontend Flutter de DevPlay
(`frankalexander-GM/flutter-dev`), conectado al **mismo backend FastAPI**
(`reempalago34/fastapi_devplay-main`, `/api/v1`).

Repositorio: <https://github.com/frankalexander-GM/react-dev>

La identidad visual se mantiene: paleta «Degradado Sci-Fi», tarjetas de cristal,
tipografía display Georgia, mono Consolas, cyan neón y violeta. El diseño y los
flujos vienen de la app Flutter; la implementación es web y responsive.

---

## 1. Arranque rápido

```bash
# 1) backend FastAPI en http://localhost:8000  (PostgreSQL + migraciones)
# 2) frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # http://localhost:3000
```

> **El dev server usa el puerto 3000 a propósito.** El CORS del backend solo
> permite `http://localhost:3000` y `http://localhost:81`
> (`app/core/config.py`). Si cambias el puerto, añade el origen en el backend.

### Sin backend (solo UI)

Hay un mock del API para trabajar en el diseño sin PostgreSQL:

```bash
npm run mock                # http://localhost:8099/api/v1
# en otra terminal:
# PowerShell
$env:VITE_API_URL='http://localhost:8099/api/v1'; npm run dev
# bash
VITE_API_URL=http://localhost:8099/api/v1 npm run dev
```

El mock devuelve datos de ejemplo y acepta likes, comentarios, votos, posts y
compras en memoria. **No sustituye al backend**: es solo una herramienta de
desarrollo (`tools/mock-api.mjs`).

### Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Vite en `:3000` con HMR |
| `npm run build` | `tsc --noEmit` + build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` en `:3000` |
| `npm run typecheck` | TypeScript estricto |
| `npm run mock` | API de mentira en `:8099` |

---

## 2. Estructura

```
src/
  lib/
    api.ts          fetch + JWT (refresh de una sola vez) + errores de FastAPI
    services.ts     un método por endpoint (auth, posts, users, chat, betas, store…)
    types.ts        modelos + normalizadores snake_case/camelCase
    session.ts      tokens y usuario en localStorage
    format.ts       tiempos relativos, números compactos, avatares
    betasIndex.ts   índice postId → beta cacheado (para el feed)
    contentEvents.ts evento "se creó contenido" para refrescar listas
  context/
    AuthContext.tsx sesión, login, registro, verificación, invitado
    ToastContext.tsx avisos
  components/
    layout/         sidebar, topbar, drawer móvil, buscador, shell
    post/           PostCard, PollBlock, comentarios, reporte, feed
    create/         compositores de post, beta y encuesta
    beta/ user/ profile/ auth/ ui/
  pages/            una vista por ruta
```

### Rutas

| Ruta | Pantalla |
| --- | --- |
| `/login`, `/register`, `/verify` | acceso (login, registro con código, verificación) |
| `/` | Inicio: hero, compositor, feed, rail de devs/tags/betas |
| `/discover` | Descubrir: trending, devs, betas, tags, recientes |
| `/betas`, `/betas/:id` | Centro de betas y ficha con descarga |
| `/chat`, `/chat/:peerId` | Chat mundial y mensajes directos |
| `/store` | Tienda, saldo y artículos comprados |
| `/notifications` | Notificaciones |
| `/u/:userId` | Perfil público, seguidores, guardados y logros |
| `/post/:id` | Publicación + comentarios |
| `/search?q=` | Buscador de devs y publicaciones |
| `/reports` | Reportes y usuarios bloqueados |
| `/about` | Acerca de DevPlay |

---

## 3. Contrato con la API

Base: `VITE_API_URL` (por defecto `http://localhost:8000/api/v1`).

- **JWT**: access + refresh. Ante un `401`, `lib/api.ts` llama una sola vez a
  `POST /auth/refresh` y reintenta la petición; si falla, limpia la sesión.
- **Invitado**: `POST /auth/guest` devuelve tokens y un usuario `is_guest`.
  Puede leer el feed, el chat y los perfiles; no puede publicar, votar, comprar
  ni comentar (la UI lo refleja).
- **Convenciones mezcladas**: `posts`/`users`/`polls` responden `snake_case`;
  `betas`, `chat`, `dm`, `notificaciones` y `discover` responden `camelCase`
  (herencia de Prisma). `toPost`, `toBeta`, `toPoll`… aceptan ambas formas.

### Endpoints usados

```
POST /auth/login | /auth/register | /auth/verify-register | /auth/guest
POST /auth/forgot-password | /auth/reset-password | /auth/refresh
GET  /auth/me

GET  /posts?skip&limit&author_id      POST /posts
GET  /posts/{id}                      DELETE /posts/{id}
POST /posts/{id}/likes | /bookmarks | /repost
GET/POST /posts/{id}/comments         DELETE /posts/{id}/comments/{cid}
GET/POST /posts/{id}/poll             POST /polls/{id}/vote

GET  /betas?beta_status               POST /betas
GET  /betas/{id}                      POST /betas/{id}/download

GET  /chat                            POST /chat
GET  /dm                              GET/POST /dm/{userId}
POST /dm/{userId}/read
GET  /notifications                   PATCH /notifications/{id}/read
PATCH /notifications/read-all         DELETE /notifications/{id}
GET  /notifications/unread-count

GET  /users/me | /users/{id}
PATCH /users/me/profile
GET  /users/me/stats | /achievements | /bookmarks
GET  /users/by-username/{username}
GET  /users/{id}/followers | /following
GET/POST/DELETE /follow

GET  /discover                        GET /search?q=
GET  /store/items | /balance | /my-items   POST /store/buy
POST /security/report                 GET /security/block/list
POST/DELETE /security/block           PATCH /security/privacy
```

---

## 4. Decisiones de port

| Flutter | React 19 |
| --- | --- |
| `ApiService` con `http` + `SharedPreferences` | `fetch` + `localStorage`, refresh single-flight |
| `ChangeNotifierProvider` (`AuthProvider`) | `AuthContext` + hooks |
| `Navigator.push` | `react-router-dom` (URLs compartibles) |
| `ThemeData` / `DevColors` | tokens en `@theme` de Tailwind 4 + clases `.glass`, `.btn-grad`… |
| `showDialog` / `showModalBottomSheet` | `Modal` con portal, ESC y bloqueo de scroll |
| `PostCard` + `CommentsSheet` | `PostCard` + `CommentSheet` / panel en `/post/:id` |

### Diferencias conscientes con el backend actual

1. **No hay subida de archivos**: el Flutter llamaba a `POST /users/me/media`,
   que **no existe** en este FastAPI. Aquí los medios se añaden por URL
   (`media: [{url, kind}]`), que es justo lo que acepta `POST /posts`.
2. **El feed no filtra por tipo ni ordena**: `GET /posts` solo acepta
   `skip`, `limit` y `author_id`. Las pestañas «Destacados» y «Betas» se
   resuelven en cliente; las betas completas vienen de `/betas`.
3. **La beta no viaja dentro del post**: `PostOut` no la incluye, así que el
   feed resuelve `postId → beta` con un índice cacheado de `/betas` (60 s).
4. **No hay feed «siguiendo»**: no existe endpoint; las pestañas son
   Recientes / Destacados / Betas.
5. **Sin tour guiado ni hero 3D/vídeo**: eran assets de Flutter. El fondo es
   CSS (halos + rejilla) y el hero incluye una consola con datos reales.
6. **Las encuestas se crean en dos pasos** (`POST /posts` tipo `POLL` y luego
   `POST /posts/{id}/poll`). Si el segundo falla, se borra el post para no
   dejar huérfanos, igual que hacía Flutter.

---

## 5. Producción

```bash
npm run build        # genera dist/
```

- Configura `VITE_API_URL` **en tiempo de build** (Vite la incrusta).
- Sirve `dist/` con fallback SPA a `index.html` (React Router usa history).
- Añade el origen del sitio a `cors_origins` en el backend.
- Si usas la misma máquina, el backend ya permite `localhost:3000`; para un
  dominio real hay que editar `app/core/config.py` o su `.env`.

Ejemplo de Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 6. Estado

Implementado y probado contra el mock: acceso (login, registro, verificación,
invitado, recuperación), feed con likes/guardados/reposts/comentarios,
encuestas con voto, betas (lista, ficha, descarga, publicación), descubrir,
buscador, chat global y DMs con polling, notificaciones, perfiles con
seguimiento/edición/logros, tienda con compra, reportes y bloqueos.

Pendiente cuando el backend lo exponga: subida de archivos, feed de seguidos,
historial de reportes y métricas de descargas por día.
