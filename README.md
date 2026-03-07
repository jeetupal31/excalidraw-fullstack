# Realtime Collaborative Whiteboard

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-ws-0B7285)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A production-focused realtime collaborative whiteboard inspired by Excalidraw Live, built with a modular fullstack architecture and persistent room-based state.

## Overview

This project enables multiple users to draw on the same board in realtime using WebSockets. Each room has a shareable URL, active user presence, live cursor tracking, and durable board persistence backed by PostgreSQL + Prisma.

## Features

- Realtime collaborative drawing with Excalidraw
- WebSocket-based scene synchronization
- Room-based boards (`/board/:roomId`)
- Shareable board URLs
- Persistent board state in PostgreSQL
- Live cursor positions for connected users
- Active user presence panel
- Backend health endpoint (`GET /health`)

## Architecture

### High-level data flow

```text
User Browser
   |
React + Excalidraw Client
   |
WebSocket (ws)
   |
Node.js + Express Collaboration Server
   |
DatabaseService (Prisma ORM)
   |
PostgreSQL
```

### Backend module responsibilities

- `RoomManager`: maintains room sockets, users, and room lifecycle
- `WebSocketHandler`: validates/parses messages, routes events, and broadcasts updates
- `DatabaseService`: loads/saves board scene state with Prisma

### Project structure

```text
.
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |   |-- CursorLayer.tsx
|   |   |   `-- PresencePanel.tsx
|   |   |-- hooks/
|   |   |   |-- useRoom.ts
|   |   |   `-- useWebSocket.ts
|   |   |-- services/
|   |   |   `-- socketProtocol.ts
|   |   |-- types/
|   |   |   `-- collaboration.ts
|   |   |-- utils/
|   |   |   `-- identity.ts
|   |   |-- App.tsx
|   |   `-- main.tsx
|-- server/
|   |-- src/
|   |   |-- controllers/
|   |   |   `-- healthController.ts
|   |   |-- rooms/
|   |   |   `-- RoomManager.ts
|   |   |-- services/
|   |   |   `-- DatabaseService.ts
|   |   |-- websocket/
|   |   |   `-- WebSocketHandler.ts
|   |   |-- types/
|   |   |   `-- messages.ts
|   |   `-- index.ts
|-- prisma/
|   `-- schema.prisma
|-- screenshots/
|-- docker-compose.yml
|-- Dockerfile
|-- LICENSE
`-- README.md
```

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Excalidraw

### Backend

- Node.js
- Express
- ws (WebSocket)

### Data

- PostgreSQL
- Prisma ORM

## Screenshots

Add screenshots inside [`screenshots/`](./screenshots):

- `screenshots/board-view.png`
- `screenshots/presence-panel.png`
- `screenshots/shareable-room-url.png`

Example markdown usage:

```md
![Board View](./screenshots/board-view.png)
```

## Installation

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd excalidraw-fullstack
npm install
```

### 2. Configure environment variables

Copy `.env.example` values into runtime env files:

- `server/.env`
- `client/.env`

Minimum required values:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whiteboard
VITE_WS_BASE_URL=ws://localhost:3000
```

### 3. Run Prisma migrations

```bash
npm run prisma:migrate --prefix server
```

## Development Setup

Run frontend + backend together from root:

```bash
npm run dev
```

App URLs:

- Client: `http://localhost:5173`
- Server health: `http://localhost:3000/health`
- Room example: `http://localhost:5173/board/interview-demo`

## Deployment

### Docker Compose (recommended)

```bash
docker compose up --build
```

This starts:

- PostgreSQL (`:5432`)
- Collaboration server (`:3000`)
- Vite client (`:5173`)

### Manual production build

```bash
npm run build
npm run start
```

## Future Improvements

- Conflict-free replicated data types (CRDT) for advanced merge behavior
- Authentication + role-based room permissions
- Board version history and undo across sessions
- Redis pub/sub for horizontal websocket scaling
- Rate limiting and abuse protection
- E2E tests for multi-user collaboration flows

## License

MIT - see [LICENSE](./LICENSE).
