# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all deps (root + client + server)
npm run install:all

# Dev (client + server concurrently)
npm run dev

# Dev individually
npm run dev:server   # tsx watch, port 4000
npm run dev:client   # vite, port 5173

# Build client + server
npm run build

# Start production server
npm start            # node server/dist/index.js

# Prerequisites: MongoDB (local or docker)
docker run -d --name mongo -p 27017:27017 mongo:7
```

## Architecture

Monorepo without workspaces — `client/` (React + Vite) + `server/` (Express + Mongoose). Root `package.json` uses `concurrently` + `--prefix` to coordinate.

### Client

- **Routing**: react-router-dom. Routes: `/` (gallery), `/album/:id`, `/search`, `/image/:id`, `/admin/login`, `/admin/upload`, `/admin/manage`, `/admin/albums`. `ProtectedRoute` wraps admin pages.
- **State**: No external library. `useAuth` hook (localStorage JWT), global Lightbox state in `App.tsx`, page-local state otherwise.
- **Data fetching**: `lib/api.ts` — typed fetch wrappers for each API endpoint. No React Query/SWR.
- **Infinite scroll**: `useInfiniteScroll` hook (IntersectionObserver, 300px root margin).
- **Theme**: CSS custom properties on `:root` / `.dark`, toggled via `useTheme` hook. `index.html` has flash-prevention script.

### Server

- **Entry**: `src/index.ts` — Express app, static serving of `uploads/`, mounts routes.
- **Auth**: JWT. Single admin user auto-seeded on startup from env vars. No registration.
- **Image pipeline**: Multer (memory) → sharp (resize to `DISPLAY_WIDTH`, convert to WebP) → save original + display to `uploads/originals/` and `uploads/displays/`.
- **Error handling**: `errorMiddleware` + `notFoundMiddleware` in `middleware/error.ts`.
- **No migrations**: Mongoose schemas are source of truth.

### API Endpoints (prefix `/api`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /auth/login | No | Login, returns JWT |
| GET | /auth/me | No | Validate token |
| GET | /images | No | List (pagination, search, albumId, tag filters) |
| GET | /images/:id | No | Image detail |
| GET | /images/:id/download | No | Download original |
| POST | /images | Yes | Upload (multipart, up to 50 files) |
| PATCH | /images/:id | Yes | Edit metadata |
| DELETE | /images/:id | Yes | Delete image + files |
| GET | /albums | No | List albums with image counts |
| POST | /albums | Yes | Create album |
| PATCH | /albums/:id | Yes | Edit album |
| DELETE | /albums/:id | Yes | Delete album |
| GET | /tags | No | List tags with counts |

### Key Patterns

- **Dev proxy**: Vite proxies `/api` and `/uploads` to `localhost:4000`.
- **No test infra** exists. No linter/formatter configs.
- **No TS path aliases** — all relative imports.
- **Image schema** has `{ title: "text" }` index but queries use `$regex`, not `$text`.
- **Admin seeded** from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars on first start.
