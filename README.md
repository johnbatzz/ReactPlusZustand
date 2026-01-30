# ReactPlusZustand

A full-stack monorepo application with React, Zustand, Prisma, and SQLite.

## Tech Stack

- **Frontend**: React + Vite + Zustand (state management)
- **Backend**: Express.js + Prisma ORM + SQLite

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Setup the database

```bash
npm run db:generate
npm run db:push
```

### 3. Start development servers

```bash
npm run dev
```

This starts both:
- Frontend at http://localhost:5173
- Backend at http://localhost:3001

## Project Structure

```
├── frontend/           # React + Vite + Zustand
│   ├── src/
│   │   ├── api/        # API client functions
│   │   ├── components/ # React components
│   │   ├── store/      # Zustand stores
│   │   └── App.tsx
│   └── vite.config.ts
├── backend/            # Express + Prisma + SQLite
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── routes/     # API routes
│       └── index.ts    # Express server
└── package.json        # Root package with workspaces
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build both frontend and backend
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio to view/edit data
