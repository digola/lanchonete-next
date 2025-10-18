# Dockerfile PRODUÇÃO — Next.js + Prisma (Compatível com Render Docker Service)
# Este Dockerfile prepara a aplicação para produção em ambientes de container.
# Requer migrations versionadas e configuração de DATABASE_URL (ex.: PostgreSQL no Render).

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

# 3) Runner (Produção em container)
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
# Em produção: aplicar migrations versionadas
# OBS: As migrations devem existir em prisma/migrations (geradas com `prisma migrate dev`)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]