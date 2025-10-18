# 🍔 Lanchonete Next — Ambiente Local (PostgreSQL) e Deploy no Render

Sistema de gestão para lanchonetes e restaurantes desenvolvido em Next.js 15, TypeScript, Prisma e Tailwind CSS. O projeto opera exclusivamente com PostgreSQL, tanto localmente quanto em produção (Render.com).

## 🚀 Principais funcionalidades
- Usuários com roles: CLIENTE, FUNCIONARIO, ADMINISTRADOR
- Gestão de categorias e produtos
- Pedidos com itens, status e histórico
- Controle de mesas (livre/ocupada/reservada/manutenção)
- Autenticação via JWT
- Interface responsiva (Tailwind CSS)

## 🛠️ Stack
- Frontend/Backend: Next.js (App Router)
- ORM: Prisma
- Banco: PostgreSQL
- Estado: Zustand
- Ícones: Lucide + Heroicons

## 📋 Requisitos
- Node.js 18+
- npm
- Docker e Docker Compose (recomendado para ambiente local)

## ⚙️ Ambiente Local (PostgreSQL via Docker Compose)
1) Instalar dependências
```bash
npm install
```

2) Copiar variáveis de ambiente
```bash
cp env.example .env
```
Ajuste `DATABASE_URL` conforme seu ambiente local. Para o Compose padrão deste repositório, use:
```
DATABASE_URL="postgresql://app_user:app_password@localhost:5432/lanchonete_db?schema=public"
```

3) Subir serviços (Postgres + App)
```bash
docker compose up --build
```
Acesse: http://localhost:3000/

4) Criar/atualizar schema e gerar client (em ambiente local com migrations)
```bash
# Crie migrations e aplique no banco local
npx prisma migrate dev --name init

# (Opcional) Popular com dados iniciais
npm run db:seed
```

## 🔐 Variáveis de ambiente
Defina em `.env` (ou no painel do Render, para produção):
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public" # Em Render, se necessário: ?sslmode=require
DIRECT_URL="postgresql://user:pass@host:5432/dbname?schema=public"
JWT_SECRET="uma-chave-secreta-segura"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
NEXTAUTH_URL="http://localhost:3000"
```

## 👤 Usuários criados pelo seed (opcional)
- admin@lanchonete.com (senha: 123456) — ADMINISTRADOR
- funcionario@lanchonete.com (senha: 123456) — FUNCIONARIO
- cliente@lanchonete.com (senha: 123456) — CLIENTE

## 📁 Estrutura (resumo)
```
src/
├─ app/            # Rotas/pages e APIs
├─ components/     # Componentes
├─ hooks/          # Hooks
├─ lib/            # Prisma, auth, utils
├─ stores/         # Zustand
└─ types/          # Tipos
prisma/
├─ schema.prisma   # Schema principal (PostgreSQL)
├─ schema.postgres.prisma # Exemplo de schema para Postgres (referência)
└─ seed.ts         # Seed inicial
```

## 🗂️ Uploads
Uploads de imagens são salvos em `public/uploads/images`. Localmente via Compose, os uploads são persistidos via volume. Em produção no Render:
- Use storage externo (Cloudinary/S3) e salve apenas URLs, ou
- Anexe um Persistent Disk e ajuste o caminho de upload

## 📜 Scripts úteis
```bash
npm run dev        # Desenvolvimento
npm run build      # Build
npm run start      # Produção local
npm run db:migrate # Alias para `prisma migrate dev` (ajuste conforme sua preferência)
npm run db:seed    # Popular banco
npm run db:studio  # Prisma Studio
```

## 🚀 Deploy no Render.com
Guia completo:
- Veja: DEPLOY_RENDER.md

Resumo:
- Crie um PostgreSQL gerenciado no Render
- Use `schema.prisma` com `provider = "postgresql"` e `DATABASE_URL`
- Versione migrations com `npx prisma migrate dev`
- Configure Web Service no Render:
  - Build: `npm install && npx prisma generate && npm run build`
  - Start: `bash -c "npx prisma migrate deploy && npm run start"`
  - Variáveis: `DATABASE_URL`, `JWT_SECRET` (e `JWT_REFRESH_SECRET`)

## 📝 Licença
MIT. Veja o arquivo LICENSE.
