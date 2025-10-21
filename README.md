<<<<<<< Updated upstream
# 🍔 Lanchonete Next — Ambiente Local (PostgreSQL) e Deploy no Render

Sistema de gestão para lanchonetes e restaurantes desenvolvido em Next.js 15, TypeScript, Prisma e Tailwind CSS. O projeto opera exclusivamente com PostgreSQL, tanto localmente quanto em produção (Render.com).
=======
# 🍔 Lanchonete Next — Ambiente Local Simplificado

Sistema de gestão para lanchonetes e restaurantes desenvolvido em Next.js 15, TypeScript, Prisma e Tailwind CSS. Este repositório está configurado para desenvolvimento local usando SQLite (sem Vercel/PostgreSQL).
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
- Banco: PostgreSQL
=======
- Banco local: SQLite (prisma/dev.db)
>>>>>>> Stashed changes
- Estado: Zustand
- Ícones: Lucide + Heroicons

## 📋 Requisitos
- Node.js 18+
- npm
<<<<<<< Updated upstream
- Docker e Docker Compose (recomendado para ambiente local)

## ⚙️ Ambiente Local (PostgreSQL via Docker Compose)
=======

## ⚙️ Configuração (local)
>>>>>>> Stashed changes
1) Instalar dependências
```bash
npm install
```

<<<<<<< Updated upstream
2) Copiar variáveis de ambiente
```bash
cp env.example .env
```
Ajuste `DATABASE_URL` conforme seu ambiente local. Para o Compose padrão deste repositório, use:
```
DATABASE_URL="postgresql://app_user:app_password@localhost:5432/lanchonete_db?schema=public"
```

3) Subir serviços (Postgres + App + pgAdmin)
```bash
docker compose up --build
```
Acesse: 
- **App**: http://localhost:3000/
- **pgAdmin**: http://localhost:8080/ (admin@lanchonete.com / admin123)

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

# Uploads
# Diretório onde os arquivos são salvos (relativo à raiz do projeto ou absoluto)
UPLOAD_DIR="./public/uploads/images"
# URL pública base para servir os arquivos (local: /api/files)
UPLOAD_BASE_URL="http://localhost:3000/api/files"
# Tamanho máximo do upload (bytes)
UPLOAD_MAX_SIZE="10485760" # 10MB
# Tipos permitidos
UPLOAD_ALLOWED_TYPES="image/png,image/jpeg,image/webp"
=======
2) Preparar banco de dados (SQLite)
```bash
# Sincroniza o schema com o banco local
npm run db:push

# Popula dados iniciais (usuários, categorias, produtos, mesas)
npm run db:seed
```

3) Rodar em desenvolvimento
```bash
npm run dev
>>>>>>> Stashed changes
```
Acesse: http://localhost:3000/

<<<<<<< Updated upstream
## 👤 Usuários criados pelo seed (opcional)
=======
## 🔐 Variáveis de ambiente
Crie um arquivo `.env` (ou `.env.local`) se desejar customizar segredos:
```env
# Opcional — se não definir, um fallback será usado
JWT_SECRET="uma-chave-secreta-segura"
# Expirações opcionais
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
```
Observação: Para o ambiente local, o Prisma usa automaticamente `file:./dev.db` (SQLite).

## 👤 Usuários criados pelo seed
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
├─ schema.prisma   # Schema principal (PostgreSQL)
├─ schema.postgres.prisma # Exemplo de schema para Postgres (referência)
=======
├─ schema.prisma   # Schema SQLite
>>>>>>> Stashed changes
└─ seed.ts         # Seed inicial
```

## 🗂️ Uploads
<<<<<<< Updated upstream
Uploads de imagens são salvos em `public/uploads/images`. Localmente via Compose, os uploads são persistidos via volume. Em produção no Render:
- Use storage externo (Cloudinary/S3) e salve apenas URLs, ou
- Anexe um Persistent Disk e ajuste o caminho de upload

Para garantir que novos arquivos sejam servidos imediatamente em produção (Next.js `next start`), existe a rota `GET /api/files/:filename`, que faz streaming diretamente do diretório configurado em `UPLOAD_DIR` e define cabeçalhos de cache. Defina `UPLOAD_BASE_URL` para `http://localhost:3000/api/files` (ou a base pública equivalente no seu deploy) para que as respostas do upload já retornem a URL correta.
=======
Uploads de imagens são salvos em `public/uploads/images`. A pasta já existe no repositório.
>>>>>>> Stashed changes

## 📜 Scripts úteis
```bash
npm run dev        # Desenvolvimento
npm run build      # Build
npm run start      # Produção local
<<<<<<< Updated upstream
npm run db:migrate # Alias para `prisma migrate dev` (ajuste conforme sua preferência)
=======
npm run db:push    # Sincronizar schema (SQLite)
>>>>>>> Stashed changes
npm run db:seed    # Popular banco
npm run db:studio  # Prisma Studio
```

<<<<<<< Updated upstream
## 🩺 Health Check
A aplicação expõe `GET /api/health` e `GET /api/health/db` para verificação de prontidão e conectividade com o banco.

## 🐘 Administração do Banco (pgAdmin)
Interface web para administrar o PostgreSQL incluída no Docker Compose.

**Acesso**: http://localhost:8080/
- **Email**: admin@lanchonete.com  
- **Senha**: admin123

**Configuração do Servidor PostgreSQL no pgAdmin**:
- **Host**: db
- **Porta**: 5432
- **Banco**: lanchonete_db
- **Usuário**: app_user
- **Senha**: app_password

📖 **Documentação completa**: [PGADMIN_SETUP.md](./PGADMIN_SETUP.md)

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
=======
## 📝 Licença
MIT. Veja o arquivo LICENSE.

## Observações
- Este repositório está focado em ambiente local (SQLite). Integrações de produção e Vercel foram removidas para simplificar.
- Se desejar migrar para Postgres no futuro, será necessário ajustar `DATABASE_URL` e reintroduzir migrations conforme sua necessidade.
>>>>>>> Stashed changes
