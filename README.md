# ExcaliLive

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)


![ExcaliLive Landing Page](screenshots/landing-page.png)
![ExcaliLive Board Page](screenshots/board-page.png)

ExcaliLive is a premium, production-grade realtime collaborative whiteboard platform. It combines the flexibility of Excalidraw with a high-end SaaS aesthetic, featuring glassmorphic UI, professional typography, and robust security.

## ✨ Key Features

- **Realtime Collaboration**: Seamless low-latency scene synchronization via WebSockets.
- **Premium SaaS UI**: A sophisticated design language featuring:
  - **Glassmorphic Panels**: Translucent, blurred surfaces for a modern "frosted" look.
  - **Inter Typography**: Enterprise-grade professional font for maximum legibility.
  - **Lucide Iconography**: Consistent, high-fidelity SVG icons throughout.
- **Robust Authentication**: Secure JWT-based user accounts and protected workspace routes.
- **Artifact Ledger**: Comprehensive version history allowing users to save and restore snapshots of their boards.
- **Live Presence**: Real-time cursor tracking and active user status indicators.
- **Durable Persistence**: Board states are persisted in PostgreSQL using Prisma ORM.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Custom Glassmorphism System
- **Typography**: Inter (Google Fonts)
- **Icons**: Lucide React
- **Whiteboard**: Excalidraw Component

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Communication**: Custom WebSocket Protocol (`ws`)
- **Authentication**: JSON Web Tokens (JWT)

### Database
- **Primary**: PostgreSQL
- **ORM**: Prisma

## 🚀 Getting Started

### 1. Requirements
- Node.js 20+
- PostgreSQL instance

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd excalidraw-fullstack

# Install dependencies
npm install
```

### 3. Configuration
Copy environment variables to their respective directories:
- `server/.env`
- `client/.env` (Vite variables)

**Example `.env`:**
```env
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/excalilive"
VITE_WS_BASE_URL="ws://localhost:3000"
JWT_SECRET="your-secure-secret"
```

### 4. Database Setup
```bash
# Generate Prisma client and run migrations
npm run prisma:migrate --prefix server
```

### 5. Running the App
Run both client and server in development mode:
```bash
npm run dev
```
- Workspace: `http://localhost:5173`
- API Health: `http://localhost:3000/health`

## 🏗 Architecture

```mermaid
graph TD
    Client[React + Excalidraw] <-->|WebSocket / JSON| Server[Node.js + Express]
    Server <-->|Prisma ORM| DB[(PostgreSQL)]
    Client -->|HTTP / JWT| Server
```

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
