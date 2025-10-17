# Dockerfile DEMO — Next.js + Prisma (SQLite efêmero)
# Atenção: este container cria o banco SQLite dentro do filesystem do container.
# Em Cloud Run, o filesystem é efêmero. Use apenas para demonstração inicial.

# 1) Dependências
FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Gerar Prisma Client
RUN npx prisma generate
# Compilar Next
RUN npm run build

# 3) Runner (DEMO com SQLite efêmero)
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# Copiar artefatos do build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
# Em DEMO: cria o banco SQLite e popula a cada start (efêmero)
CMD ["sh", "-c", "npx prisma db push && npm run db:seed && npm run start"]