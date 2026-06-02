# Build from the repo root: `docker build -f server/Dockerfile .`
# (the Prisma schema lives at ../prisma, so the build context must be the root)

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Prisma schema is referenced by the server build (../prisma/schema.prisma)
COPY prisma ./prisma
COPY server/package*.json ./server/
RUN cd server && npm ci

COPY server ./server
# Runs `prisma generate` then `tsc`
RUN cd server && npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/prisma ./prisma
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist

WORKDIR /app/server
EXPOSE 3000
CMD ["node", "dist/index.js"]
