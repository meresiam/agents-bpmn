# ── Stage 1: deps ──────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock .yarnrc ./
RUN yarn install --frozen-lockfile --production=false

# ── Stage 2: build ─────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# ── Stage 3: run (standalone) ──────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# standalone output copies only what's needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
