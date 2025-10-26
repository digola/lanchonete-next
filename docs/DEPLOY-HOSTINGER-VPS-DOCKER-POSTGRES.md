# Guia de Deploy: Hostinger VPS + Docker + PostgreSQL para Lanchonete Next

Este documento explica, passo a passo, como colocar o projeto em produção na Hostinger usando um VPS com Docker e PostgreSQL, cobrindo build, configuração de banco e publicação. Foi elaborado após leitura do README do projeto e consulta à documentação oficial da Hostinger.

Resumo das fontes usadas:
- PostgreSQL na Hostinger: disponível apenas em VPS [Hostinger Help Center — Is PostgreSQL Supported at Hostinger? https://support.hostinger.com/en/articles/1583659-is-postgresql-supported-at-hostinger]
- Docker em VPS Hostinger: template com Docker/Compose e Docker Manager no hPanel [Hostinger Help Center — How to Use the Docker VPS Template: https://support.hostinger.com/en/articles/8306612-how-to-use-the-docker-vps-template ; Hostinger Help Center — Docker Manager: https://www.hostinger.com/support/12040815-how-to-deploy-your-first-container-with-hostinger-docker-manager/]
- Next.js suporta deploy via Docker [Next.js Docs — Deploying: https://nextjs.org/docs/app/getting-started/deploying]

## 1) Pré-requisitos
- Plano Hostinger VPS (não funciona em hospedagem compartilhada para PostgreSQL e SSR/Node) [Hostinger Help Center]
- Domínio (opcional) apontado para o IP do VPS
- Acesso SSH ao VPS (root)
- Porta 80/443 liberadas no VPS (firewall)

## 2) Preparar o VPS com Docker
Opção A — Template com Docker já instalado:
- No hPanel: VPS → OS & Panel → Operating System → selecione "Ubuntu 24.04 64bit with Docker" [Hostinger Help Center]
- Conecte via SSH: `ssh root@SEU_IP`
- Valide: `docker --version` e `docker-compose --version`

Opção B — Instalar Docker manualmente (se necessário):
- `sudo apt update && sudo apt upgrade -y`
- `sudo apt install docker.io docker-compose -y`
- `sudo systemctl enable --now docker`

Opcional: usar o Docker Manager do hPanel para compor serviços via UI [Hostinger Help Center — Docker Manager].

## 3) Ajustes do projeto para produção com Postgres
O projeto foi simplificado para SQLite em desenvolvimento. Em produção:
- Defina `DATABASE_URL` e `DIRECT_URL` para Postgres (veja .env.example).
- Garanta que `src/lib/prisma.ts` receba `DATABASE_URL` em produção (já há lógica para isso).
- Sobre o schema Prisma: o arquivo atual `prisma/schema.prisma` está para SQLite. Recomenda-se criar uma versão Postgres (ex.: `prisma/schema-postgres.prisma`) com `datasource db { provider = "postgresql" url = env("DATABASE_URL") }` e migrar seu schema para Postgres. Como os tipos estão em Float, é compatível com Postgres (double precision). Se quiser utilizar `Decimal` (recomendado para valores monetários), ajuste os tipos e rode migrações.
- Crie migrações para Postgres: `npx prisma migrate dev --name init` (localmente apontando para um Postgres) e commite `prisma/migrations`. Em produção, use `prisma migrate deploy`.

Se preferir um caminho rápido (sem manter migrações): `prisma db push` para sincronizar o schema diretamente com Postgres, e em seguida `db:seed`.

## 4) Estrutura de Docker
Crie um Dockerfile otimizado para Next.js (multi-stage, output "standalone"):

```
# Dockerfile (produção)
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile não encontrado" && exit 1; fi

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next.js
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
# Copia assets necessários para o runtime standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
```

Compose com Postgres e persistência:

```
# docker-compose.yml
version: "3.9"
services:
  app:
    build: .
    container_name: lanchonete-app
    restart: unless-stopped
    depends_on:
      - db
    environment:
      NODE_ENV: "production"
      # Banco (rede interna do Compose)
      DATABASE_URL: "postgresql://postgres:STRONG_PASSWORD@db:5432/lanchonete_db?schema=public"
      DIRECT_URL: "postgresql://postgres:STRONG_PASSWORD@db:5432/lanchonete_db?schema=public"
      JWT_SECRET: "defina-uma-chave-segura"
      JWT_EXPIRES_IN: "7d"
      JWT_REFRESH_EXPIRES_IN: "30d"
      APP_NAME: "Sistema Lanchonete"
      APP_URL: "http://SEU_DOMINIO_OU_IP"
    ports:
      - "80:3000"  # expõe Next.js em HTTP 80
    volumes:
      - app_uploads:/app/public/uploads/images
    command: ["sh", "-c", "npx prisma migrate deploy && node server.js"]

  db:
    image: postgres:16-alpine
    container_name: lanchonete-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: STRONG_PASSWORD
      POSTGRES_DB: lanchonete_db
    volumes:
      - pg_data:/var/lib/postgresql/data
    # NÃO expor a porta 5432 publicamente; acesso apenas pela rede interna do Compose
    # ports:
    #   - "5432:5432"  # Evite expor em produção

volumes:
  pg_data:
  app_uploads:
```

Observações:
- Persistência: `pg_data` guarda os dados do Postgres; `app_uploads` persiste imagens de `public/uploads/images`.
- Segurança: não exponha a porta do Postgres; o serviço `app` acessa `db` pela rede interna.
- Se quiser usar Nginx com SSL, adicione um serviço reverse proxy na frente do `app`.

## 5) .env de produção (exemplo)
Crie `.env.production` para uso local e valide variáveis:
```
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@db:5432/lanchonete_db?schema=public
DIRECT_URL=postgresql://postgres:STRONG_PASSWORD@db:5432/lanchonete_db?schema=public
JWT_SECRET=troque-por-uma-chave-aleatória-grande
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
APP_NAME=Sistema Lanchonete
APP_URL=http://SEU_DOMINIO_OU_IP
NODE_ENV=production
```

## 6) Deploy na Hostinger
Caminho 1 — hPanel Docker Manager [Hostinger Help Center — Docker Manager]:
- hPanel → VPS → Docker Manager → Compose manually
- Cole o conteúdo do `docker-compose.yml`
- Defina variáveis e volumes conforme acima
- Clique "Deploy"; aguarde iniciar; acesse `http://SEU_IP`.

Caminho 2 — Linha de comando via SSH:
- Transfira arquivos (Dockerfile e docker-compose.yml) para o VPS (`scp` ou Git):
  - `scp Dockerfile docker-compose.yml root@SEU_IP:/opt/lanchonete/`
- Conecte: `ssh root@SEU_IP` e rode:
  - `cd /opt/lanchonete`
  - `docker compose up -d --build`

## 7) Migrações e seed
- Migrações: o `command` do serviço `app` já roda `prisma migrate deploy` antes de subir o servidor.
- Seed inicial: `docker compose exec app npm run db:seed`

Se preferir `db push` em vez de migrações:
- Ajuste `command` para: `npx prisma db push && node server.js`

## 8) Verificações pós-deploy
- Acesse `http://SEU_IP` ou `http://SEU_DOMINIO`
- Login com usuário do seed (admin@lanchonete.com / 123456)
- Verifique criação/listagem de categorias/produtos, pedidos e uploads

## 9) Backup e manutenção (Postgres)
- Backup com `pg_dump` diário (exemplo cron):
  - `docker compose exec -T db pg_dump -U postgres -d lanchonete_db > /var/backups/lanchonete_db_$(date +%F).sql`
- Restauração: `psql -U postgres -d lanchonete_db < backup.sql`
- Atualizações: `docker compose pull && docker compose up -d`

## 10) Segurança
- Firewall: liberar apenas 80/443 e SSH; não expor 5432
- Senhas fortes e segredos (`JWT_SECRET`) longos e aleatórios
- Logs e monitoramento: `docker logs -f lanchonete-app`
- Configure HTTPS com Nginx + Let’s Encrypt

## 11) Considerações importantes
- Hospedagem compartilhada da Hostinger não suporta PostgreSQL; use VPS [Hostinger Help Center — Is PostgreSQL Supported at Hostinger?]
- Next.js em produção requer Node/SSR; VPS é o caminho recomendado; via Docker é suportado oficialmente [Next.js Docs].
- Para bancos gerenciados, você pode usar serviços externos (Neon, Railway). Neste guia, optamos por Postgres em container no VPS.

## 12) Troubleshooting rápido
- Erro "DATABASE_URL não definida": configure no hPanel (Docker Manager) ou `.env`/Compose
- App sobe mas falha em conectar ao banco: valide credenciais/host (`db`), se o Postgres está "healthy" e rede interna
- Permissões de uploads: o volume deve apontar para `/app/public/uploads/images`
- Build falha: verifique Node 18+; se necessário, rode `npm run db:generate` antes do build

---
Referências:
- Hostinger — PostgreSQL apenas em VPS: https://support.hostinger.com/en/articles/1583659-is-postgresql-supported-at-hostinger
- Hostinger — Docker VPS Template: https://support.hostinger.com/en/articles/8306612-how-to-use-the-docker-vps-template
- Hostinger — Docker Manager: https://www.hostinger.com/support/12040815-how-to-deploy-your-first-container-with-hostinger-docker-manager/
- Next.js — Deploying: https://nextjs.org/docs/app/getting-started/deploying