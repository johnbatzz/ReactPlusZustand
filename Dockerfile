# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies
RUN npm install

# Copy frontend source
COPY frontend ./frontend

# Build frontend
RUN npm run build --workspace=frontend

# Build stage for backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies
RUN npm install

# Copy backend source
COPY backend ./backend

# Generate Prisma client
RUN npm run db:generate --workspace=backend

# Build backend
RUN npm run build --workspace=backend

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm install --omit=dev

# Copy Prisma schema and generate client for production
COPY backend/prisma ./backend/prisma
RUN npx prisma generate --schema=./backend/prisma/schema.prisma

# Copy built frontend (will be served by Express)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/app.db"

# Expose port
EXPOSE 3001

# Use entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
