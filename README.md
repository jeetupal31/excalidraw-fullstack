# ExcaliDraw Live — Realtime Collaborative Whiteboard

[![CI](https://github.com/jeetupal31/excalidraw-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/jeetupal31/excalidraw-fullstack/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=flat-square&logo=socketdotio&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)

> A production-grade collaborative whiteboard: multiple people draw together on a shared Excalidraw canvas in real time, with live cursors, presence, version history, editor/viewer roles, and **AI text-to-diagram** generation.

**Live demo:** **[excalidraw-fullstack.vercel.app](https://excalidraw-fullstack.vercel.app)** · API: [excalidraw-fullstack.onrender.com](https://excalidraw-fullstack.onrender.com/health)

> Open the live board in two browser windows to see real-time sync, shared cursors, and presence.

---

## Features

- 🎨 **Real-time collaboration** — edits broadcast instantly to everyone in the room over WebSockets
- 🧑‍🤝‍🧑 **Live cursors & presence** — see who's online and where their cursor is
- 🔐 **Editor / Viewer roles** — share an edit link or a read-only view link; viewer edits are dropped **server-side**, not just hidden
- 🕑 **Version history** — snapshot the board and restore any previous version
- 🤖 **AI text-to-diagram** — describe a flow in plain English and AI draws it on the canvas for the whole room (powered by Groq / Llama)
- 💾 **Persistent boards** — canvas state is stored in PostgreSQL and restored on reconnect
- 🔑 **Auth** — JWT-based signup/login (bcrypt-hashed passwords); your boards are listed on your dashboard
- 📤 **Export** — download the board as PNG or JSON
- 🌗 **Dark / light theme**

---

## Architecture

```
        React + Vite + Excalidraw (client, Vercel)
                 |                         |
         REST / JWT (HTTP)          WebSocket (rooms)
                 |                         |
                 v                         v
        ┌─────────────────────────────────────────┐
        │   Express + ws  (server, Render)          │
        │   - auth, boards, versions, AI routes     │
        │   - RoomManager (presence, broadcast)     │
        │   - WebSocketHandler (validate, persist)  │
        └───────────────┬───────────────┬──────────┘
                        │               │
                        v               v
                  PostgreSQL        Groq API
                  (Prisma ORM)      (AI diagrams)
```

**Design highlights**
- **Dependency-injected server** — `RoomManager`, `DatabaseService`, and `AuthService` are injected into the `WebSocketHandler`, keeping concerns separate and testable.
- **Runtime message validation** — every inbound WebSocket message is checked with type guards before it's processed.
- **Server-enforced roles** — viewers physically cannot mutate a board; the server drops their scene updates.
- **Debounced persistence** — rapid edits broadcast instantly but are coalesced into at most one Postgres write per room per window, so drawing stays smooth and the DB isn't hammered.
- **Throttled cursors** — cursor broadcasts are capped at ~25/sec to cut socket traffic without visible lag.
- **Graceful shutdown** — `SIGINT`/`SIGTERM` flush pending state and close sockets cleanly.

---

## How the AI Diagram Feature Works

1. You type a prompt (e.g. *"user authentication flow with signup, login, and JWT"*).
2. The server calls **Groq** (Llama 3.3, OpenAI-compatible, JSON mode) and asks for a constrained `{ nodes, edges }` graph.
3. The server validates and clamps that graph (max nodes, length limits, edges must reference real nodes).
4. The client converts the graph into real **Excalidraw elements** (labelled boxes + bound arrows) via `convertToExcalidrawElements`, lays them out, and adds them to the canvas.
5. Because it's added through the normal scene-update path, the AI diagram syncs to **everyone in the room**.

It degrades gracefully: if `GROQ_API_KEY` isn't configured, the endpoint returns a friendly message and the rest of the app is unaffected. The endpoint is rate-limited per IP to protect the shared quota.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TypeScript, `@excalidraw/excalidraw`, React Router, Tailwind CSS |
| Backend | Node.js, Express 5, `ws` (WebSocket), TypeScript |
| Database | PostgreSQL via Prisma ORM (pg adapter) |
| Auth | JWT, bcrypt |
| AI | Groq (Llama 3.3) — OpenAI-compatible chat completions |
| DevOps | GitHub Actions CI, Docker + docker-compose |
| Hosting | Vercel (client), Render (server), managed Postgres |

---

## Project Structure

```
excalidraw-fullstack/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── pages/          # Home, Login, Signup, BoardPage
│       ├── components/     # Toolbar, CursorLayer, PresencePanel, VersionHistory, AiDiagramModal
│       ├── hooks/          # useRoom, useWebSocket, useBoardNavigation
│       ├── contexts/       # Auth, Theme
│       └── services/       # apiClient, board, export, ai, aiDiagram
├── server/                 # Express + WebSocket backend
│   └── src/
│       ├── controllers/    # auth, board, ai, health
│       ├── rooms/          # RoomManager (presence + broadcast)
│       ├── websocket/      # WebSocketHandler (validation, persistence)
│       ├── services/       # DatabaseService, AuthService
│       └── middleware/     # auth
├── prisma/schema.prisma    # User, Board, BoardMember, BoardVersion
├── docker-compose.yml      # Postgres + server + client (one command)
└── .github/workflows/ci.yml
```

---

## Run Locally

### Option A — Docker (one command)

```bash
# needs Docker. Optional: export GROQ_API_KEY=... to enable the AI feature.
JWT_SECRET=dev GROQ_API_KEY=your_groq_key docker compose up --build
```

- Client → http://localhost:5173
- Server → http://localhost:3000
- Postgres → localhost:5432 (schema auto-pushed on start)

### Option B — Manual

**Prerequisites:** Node 20+, a PostgreSQL database.

```bash
git clone https://github.com/jeetupal31/excalidraw-fullstack.git
cd excalidraw-fullstack

# 1. Server
cd server
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, (optional) GROQ_API_KEY
npm install
npm run prisma:migrate      # create tables
npm run dev                 # http://localhost:3000

# 2. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Then open http://localhost:5173 and create a board.

---

## Environment Variables

### Server (`server/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `JWT_SECRET` | Secret used to sign auth tokens | required |
| `PORT` | Server port | `3000` |
| `CORS_ORIGINS` | Comma-separated allowed origins | localhost + Vercel |
| `GROQ_API_KEY` | Groq key for AI diagrams (free at console.groq.com) | optional |
| `GROQ_MODEL` | Groq chat model | `llama-3.3-70b-versatile` |

### Client (`client/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Server REST base URL | Render URL |
| `VITE_WS_BASE_URL` | Server WebSocket base URL | derived |

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | – | Create an account |
| `POST` | `/api/auth/login` | – | Log in, returns a JWT |
| `GET`  | `/api/auth/me` | JWT | Current user |
| `GET`  | `/api/boards` | JWT | List the user's boards |
| `PATCH`| `/api/boards/:id` | JWT | Rename a board |
| `DELETE`| `/api/boards/:id` | JWT | Delete a board |
| `GET`  | `/api/boards/:id/versions` | JWT | List version snapshots |
| `POST` | `/api/boards/:id/versions` | JWT | Save a version snapshot |
| `POST` | `/api/boards/:id/restore` | JWT | Restore a version |
| `POST` | `/api/ai/generate` | rate-limited | Prompt → diagram graph |
| `GET`  | `/health` | – | Health check |
| `WS`   | `/?room=<id>&token=<jwt>&role=<editor\|viewer>` | – | Realtime collaboration |

---

## CI/CD

- **CI** (GitHub Actions) builds and type-checks the server (Prisma generate + `tsc`) and lints + builds the client on every push and PR.
- **Client** auto-deploys to Vercel; **server** auto-deploys to Render from `main`.

---

## Author

**Jeetu Pal** — [github.com/jeetupal31](https://github.com/jeetupal31)
