# Excalidraw Fullstack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000?style=flat-square&logo=nextdotjs)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=flat-square&logo=socket.io&logoColor=white)

> A full-stack collaborative whiteboard application — multiple users can draw together in real time on a shared canvas, powered by WebSockets.

## Features

- 🎨 **Real-time collaborative drawing** — changes broadcast instantly to all connected users
- 🖊️ **Rich drawing tools** — pen, shapes, arrows, text, eraser
- 👥 **Multi-user rooms** — join a shared session via link
- 💾 **Persistent canvas** — drawings are saved and restored on reconnect
- ⚡ **Low-latency sync** — delta-based updates over WebSocket (no full-state spam)

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, TypeScript, Canvas API |
| Backend | Node.js, WebSocket (ws) |
| Real-time | WebSocket rooms, delta sync |
| Styling | Tailwind CSS |

## Local Setup

```bash
git clone https://github.com/jeetupal31/excalidraw-fullstack.git
cd excalidraw-fullstack
npm install

# Start backend
cd apps/server && npm run dev

# Start frontend
cd apps/web && npm run dev
```

Open http://localhost:3000, create a room, share the link with a friend.

---

Made by [Jeetu Pal](https://github.com/jeetupal31)
