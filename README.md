# see-my-code

A production-quality collaborative browser-based code editor — open a link, paste code, collaborate instantly.

> No signup. No download. Just share a link.

## Features

- **Instant rooms** — click "New Room", get a shareable URL
- **Real-time collaboration** — multiple users edit simultaneously with conflict-free merging (Yjs CRDT)
- **Multiplayer cursors** — see other users' cursors and selections with names and colors
- **Syntax highlighting** — Monaco Editor with 9 languages (JavaScript, TypeScript, Python, Rust, Go, HTML, CSS, JSON, Markdown)
- **Language switching** — change language mid-session; all users see the update
- **Light / dark theme** — toggle persisted in localStorage
- **Copy link** — one-click to copy the room URL
- **Auto-reconnect** — y-websocket reconnects automatically after brief disconnects

## Architecture

```
Browser (React + Monaco + Yjs)
    │
    │ WebSocket (binary Yjs protocol)
    ▼
Cloudflare Worker  ──► routes /r/:roomId/ws to RoomDO
    │
    ▼
RoomDO (Durable Object, one per room)
    │ broadcasts Yjs updates to all connected clients
    └── Client A, Client B, Client C ...
```

### How real-time sync works

1. Each browser creates a `Y.Doc` (Yjs CRDT document).
2. A `WebsocketProvider` (y-websocket) opens a WebSocket to the Worker at `/r/:roomId/ws`.
3. The Worker forwards the request to the room's `RoomDO` Durable Object via `env.ROOMS.idFromName(roomId)`.
4. The `RoomDO` accepts the WebSocket using the **Hibernation API** (`state.acceptWebSocket(server)`), which lets the DO sleep between messages without losing connections.
5. When any client sends a Yjs update, the DO broadcasts it (as binary) to every other client in the room.
6. Yjs merges updates on each client; conflicts resolve automatically via CRDTs.
7. Awareness (cursors, usernames, colors) is synced through the same WebSocket via the y-websocket awareness protocol.

### Durable Objects per room

- `env.ROOMS.idFromName(roomId)` maps a room ID string to a stable DO ID — the same room always routes to the same DO instance worldwide.
- `state.getWebSockets()` returns all live WebSocket connections even after DO hibernation, enabling correct broadcast without an in-memory set.
- The DO is created lazily on first connection and can be evicted when idle; the Hibernation API ensures open WebSockets survive eviction.

### Storage abstraction (Phase 1 / Phase 2)

`worker/src/storage.ts` exports a `RoomStorage` interface:

```ts
interface RoomStorage {
  loadSnapshot(roomId: string): Promise<Uint8Array | null>
  saveSnapshot(roomId: string, data: Uint8Array): Promise<void>
  deleteRoom(roomId: string): Promise<void>
}
```

- **Phase 1 (current):** `NoOpStorage` — no persistence; room state lives in Yjs client memory only.
- **Phase 2 (ready):** `DurableObjectStorageImpl` — persists Yjs document snapshots to DO KV storage; swap in by changing one constructor call in `RoomDO.ts`.

## Project structure

```
see-my-code/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx            # Router (/ and /r/:roomId)
│   │   ├── main.tsx
│   │   ├── index.css          # Global styles (no CSS framework)
│   │   ├── pages/
│   │   │   ├── HomePage.tsx   # Landing page with "New Room" button
│   │   │   └── RoomPage.tsx   # Editor page
│   │   ├── components/
│   │   │   ├── Editor.tsx     # Monaco + y-monaco binding
│   │   │   ├── TopBar.tsx     # Room controls bar
│   │   │   └── PresenceIndicator.tsx
│   │   ├── hooks/
│   │   │   └── useCollaboration.ts  # Yjs + WebSocket provider
│   │   └── lib/
│   │       ├── roomId.ts      # ID generation and validation
│   │       └── awareness.ts   # Username and color generation
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── worker/                    # Cloudflare Worker + Durable Object
│   ├── src/
│   │   ├── index.ts           # Worker entrypoint and routing
│   │   ├── RoomDO.ts          # Durable Object (WebSocket hub)
│   │   └── storage.ts         # RoomStorage abstraction
│   ├── package.json
│   └── tsconfig.json
├── wrangler.toml              # Cloudflare deployment config
└── README.md
```

## Local development

### Prerequisites

- Node.js 18+
- A Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`

### 1. Install dependencies

```bash
# Install worker dependencies
cd worker && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Start the Worker (Wrangler dev)

```bash
cd worker
npx wrangler dev --port 8787
```

This starts the Worker + Durable Objects locally on `http://localhost:8787`.

### 3. Start the frontend (Vite dev server)

In a second terminal:

```bash
cd frontend
npm run dev
```

Vite starts on `http://localhost:5173`. In dev mode, the WebSocket provider connects directly to `ws://localhost:8787` (Wrangler).

Open `http://localhost:5173` in two browser tabs to test collaboration.

## Deployment to Cloudflare

### 1. Deploy the Worker

```bash
cd worker
npx wrangler deploy
```

This deploys the Worker and automatically provisions the `RoomDO` Durable Object class.

Take note of the Worker URL: `https://see-my-code.<your-subdomain>.workers.dev`

### 2. Build and deploy the frontend

#### Option A: Cloudflare Pages (recommended)

1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```
2. Deploy via Wrangler Pages:
   ```bash
   npx wrangler pages deploy frontend/dist --project-name see-my-code
   ```
3. In your Cloudflare Pages project settings, add a **Worker binding** or configure a **Custom Domain** pointing to the same domain as your Worker so WebSocket requests route correctly.

#### Option B: Pages with Worker on same domain

Set up a Pages project + custom domain, and configure the Worker to handle `/r/*/ws` and `/api/*` routes. The frontend builds to `frontend/dist`.

### Environment variables

| Variable | Where | Default | Description |
|---|---|---|---|
| `ENVIRONMENT` | Worker | `development` | Set to `production` in deployed worker to tighten CORS |

### Wrangler bindings reference

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "ROOMS"
class_name = "RoomDO"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["RoomDO"]
```

## Next steps

### Persistence (Phase 2)
- Swap `NoOpStorage` for `DurableObjectStorageImpl` in `RoomDO.ts`
- Periodically encode the Yjs document (`Y.encodeStateAsUpdate(doc)`) and save via `storage.saveSnapshot(roomId, update)`
- Load and apply snapshot on first client connect

### Auth and access control
- Add Cloudflare Access or a simple token-based check in the Worker `fetch` handler before upgrading to WebSocket
- Store room metadata (owner, visibility) in Durable Object storage or D1

### Abuse prevention
- Implement rate limiting in `webSocketMessage` using a per-client message counter
- Add room size limits (max N clients) in `handleWebSocket`
- Use Cloudflare WAF rules for IP-level throttling

### Future features
- **Read-only mode** — pass a `?readonly` flag; editor becomes non-editable
- **Multiple files** — use multiple `Y.Text` entries keyed by filename in the same `Y.Doc`
- **Snapshots / history** — periodically snapshot the doc and store with a timestamp
- **Comments** — use a `Y.Array` of comment objects synced alongside the document
- **Invite permissions** — generate signed invite tokens, validate in the Worker
