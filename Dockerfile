FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN npm ci --prefix server

COPY server ./server
COPY prisma ./prisma

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whiteboard

RUN npm run prisma:generate --prefix server
RUN npm run build --prefix server

EXPOSE 3000

CMD ["npm", "run", "start", "--prefix", "server"]
