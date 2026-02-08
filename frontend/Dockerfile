# Frontend build when Root Directory = frontend (build context is frontend/)
# Set REACT_APP_API_URL in Railway Variables to your backend public URL.
FROM node:20-alpine AS builder

WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g serve@14

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build"]
