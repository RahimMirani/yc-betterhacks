# Backend build from repo root (monorepo: no Root Directory set)
# Build context = repo root. Start command: node dist/index.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
