# Backend Dockerfile for Railway (or any Node container)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/dist ./dist

# Optional: create uploads dir so app can write (ephemeral on Railway)
RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
