# Deploy no Render.com — Guia Completo

Este guia explica como fazer deploy do projeto Next.js no Render.com. Oferecemos duas abordagens: (A) Serviço Web Node (recomendado) e (B) Serviço Web com Docker. Também cobrimos banco de dados PostgreSQL gerenciado no Render e considerações sobre uploads.

IMPORTANTE: O projeto é Postgres-only (sem SQLite). Para desenvolvimento local, use o Docker Compose incluído (PostgreSQL + app). Para produção no Render, use PostgreSQL gerenciado.

## 1. Preparação
- Tenha o código em um repositório Git (GitHub/GitLab/Bitbucket).
- Verifique Node 18+ localmente e que `npm run build` funciona.
- Defina segredos de JWT no `.env` local para testes se desejar.

## 2. Banco de Dados (Render PostgreSQL)
1) Crie um PostgreSQL no Render:
   - No dashboard do Render, clique em New → PostgreSQL.
   - Escolha nome/region/plan.
   - Copie a DATABASE_URL (connection string) fornecida.

2) Ajuste o Prisma para Postgres (já padrão neste projeto):
   - `prisma/schema.prisma` já está com `provider = "postgresql"` e `url = env("DATABASE_URL")`.
   - Gere e versiona migrações a partir do seu ambiente local:
     - Garanta acesso a um Postgres local (pode ser o do Docker Compose) ou remoto.
     - Exporte a variável `DATABASE_URL` no seu ambiente local:
       - `export DATABASE_URL="postgresql://<user>:<pass>@localhost:5432/<db>?schema=public"`
     - Rode:
       - `npx prisma migrate dev --name init`
     - Confirme as tabelas no Postgres.
   - Comite `prisma/schema.prisma` e o diretório `prisma/migrations/` no repositório.

3) Seed (opcional):
   - Evite rodar seed automaticamente em produção.
   - Rode manualmente após o deploy via Shell do Render:
     - Abra Shell do serviço → `npm run db:seed`

## 3A. Deploy como Serviço Web Node (recomendado)
1) No Render: New → Web Service → Connect repo
2) Configure:
   - Name: lanchonete-next
   - Environment: Node
   - Region: escolha próxima aos usuários
   - Branch: main (ou branch de produção)
   - Root Directory: (deixe em branco se repo raiz)
   - Build Command:
     - `npm install`
     - `npx prisma generate`
     - `npm run build`
   - Start Command:
     - `bash -c "npx prisma migrate deploy && npm run start"`
   - Auto-Deploy: habilitado (opcional)

3) Variáveis de ambiente:
   - `DATABASE_URL` com a URL do Postgres do Render (se necessário, acrescente `?sslmode=require`)
   - `JWT_SECRET` e `JWT_REFRESH_SECRET`
   - Render define `PORT` automaticamente; o Next usará essa porta.

4) Verificação pós-deploy:
   - Acesse a URL pública do serviço
   - Teste `/login`, `/api/categories`, `/api/products`
   - Veja logs em "Logs"

## 3B. Deploy com Docker (opcional)
- Caso prefira Docker, crie o serviço como "Docker" e use o `Dockerfile` do repositório.
- Ajustes:
  - O Dockerfile atual executa `npx prisma migrate deploy && npm run start` no startup.
  - Garanta que `DATABASE_URL` esteja definido.
  - Porta exposta: 3000 (Render usará a variável `PORT`).

## 4. Ambiente Local (Docker Compose com PostgreSQL)
Use o Compose padrão do projeto para subir Postgres + app localmente:

```bash
# 1) Instalar dependências
npm install

# 2) Copiar .env e ajustar DATABASE_URL
cp env.example .env
# Para Compose, use:
# DATABASE_URL="postgresql://app_user:app_password@localhost:5432/lanchonete_db?schema=public"

# 3) Subir serviços
docker compose up --build
# App: http://localhost:3000
```

O serviço `app` executa `npx prisma generate && npx prisma db push` na inicialização para sincronizar o schema com o Postgres local sem criar migrations. Para versionar migrations corretamente, rode no host:

```bash
npx prisma migrate dev --name init
```

## 5. Uploads de Imagens
Por padrão, as imagens são salvas em `public/uploads/images` e servidas como arquivos estáticos.

Problema em produção: em Render, o filesystem do container é refeito a cada deploy. Os arquivos enviados em produção podem ser perdidos em um novo deploy.

Soluções:
- Preferido: usar um storage externo (Cloudinary, S3) e salvar apenas URLs no banco.
- Alternativo: anexar um Persistent Disk ao serviço no Render e salvar nesse disco (ex.: `/var/data/uploads/images`). Para isso:
  1) Crie um Disk no Render e anexe ao serviço.
  2) Adicione `UPLOAD_DIR=/var/data/uploads/images` como variável de ambiente.
  3) Atualize o código para usar `process.env.UPLOAD_DIR` como destino, com fallback para `public/uploads/images`.

Exemplo de ajuste (ilustrativo — atualize seu código em `src/app/api/upload/image/route.ts`):
```ts
import { join } from 'path';
const baseDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads', 'images');
// mkdir(baseDir, { recursive: true });
// const filePath = join(baseDir, fileName);
// const imageUrl = process.env.UPLOAD_BASE_URL
//   ? `${process.env.UPLOAD_BASE_URL}/${fileName}`
//   : `/uploads/images/${fileName}`;
```
- Se usar Disk fora da pasta `public`, você pode servir via uma rota Next.js dedicada (`/api/files`), ou criar um symlink durante o build para expor `/uploads`.

## 6. Boas práticas
- Não use SQLite em produção.
- Mantenha migrations versionadas e use `migrate deploy`.
- Controle de segredos via variáveis de ambiente (considere Secret Files do Render).
- Monitore logs e saúde do serviço.

## 7. Troubleshooting
- Erro de Prisma Client: rode `npx prisma generate` no build.
- Falha ao conectar no DB: valide `DATABASE_URL` e regras de acesso na instância.
- Seed não roda: confirme que `tsx` está instalado ou execute seed via Node/JS.
- Uploads não aparecem: verifique path base e exposição (static/public vs rota API).

## 8. Check-list de deploy
- [ ] Migrar Prisma para Postgres e versionar migrations
- [ ] Criar Postgres no Render e setar `DATABASE_URL`
- [ ] Configurar Build/Start commands
- [ ] Adicionar `JWT_SECRET` e `JWT_REFRESH_SECRET`
- [ ] Validar rotas e logs pós-deploy
- [ ] Definir estratégia para uploads (storage externo ou Disk)