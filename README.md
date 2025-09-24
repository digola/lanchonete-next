# 🍔 Sistema Lanchonete - Next.js

Sistema completo de gestão para lanchonetes e restaurantes desenvolvido com Next.js 15, TypeScript, Prisma e Tailwind CSS.

## 🚀 Funcionalidades

- **Sistema de Usuários**: 3 roles (Cliente, Funcionário, Administrador)
- **Gestão de Produtos**: CRUD completo com categorias e opções
- **Sistema de Pedidos**: Status em tempo real e histórico
- **Controle de Mesas**: Gestão de ocupação e atribuição
- **Autenticação JWT**: Sistema seguro com refresh tokens
- **Interface Responsiva**: Design moderno e mobile-first
- **Relatórios**: Dashboard com métricas e análises

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT com bcrypt
- **Estado**: Zustand
- **Ícones**: Lucide React + Heroicons

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd lanchonete-next
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure o banco de dados
```bash
# Crie um banco PostgreSQL
createdb lanchonete_db

# Configure as variáveis de ambiente
cp env.example .env.local
```

### 4. Configure o arquivo `.env.local`
```env
DATABASE_URL="postgresql://username:password@localhost:5432/lanchonete_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Execute as migrações e seed
```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

### 6. Inicie o servidor de desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 👤 Usuários Padrão

Após executar o seed, você terá os seguintes usuários:

| Email | Senha | Role |
|-------|-------|------|
| admin@lanchonete.com | 123456 | Administrador |
| funcionario@lanchonete.com | 123456 | Funcionário |
| cliente@lanchonete.com | 123456 | Cliente |

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── api/               # Rotas de API
│   ├── admin/             # Páginas administrativas
│   ├── staff/             # Páginas de funcionários
│   ├── customer/          # Páginas de clientes
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial (cardápio)
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
├── hooks/                 # Hooks customizados
├── lib/                   # Utilitários e configurações
├── stores/                # Estado global (Zustand)
└── types/                 # Definições de tipos
```

## 🔐 Sistema de Permissões

### Cliente
- Visualizar cardápio
- Fazer pedidos
- Acompanhar pedidos
- Gerenciar perfil

### Funcionário
- Visualizar pedidos
- Atualizar status dos pedidos
- Gerenciar mesas
- Visualizar cardápio

### Administrador
- Acesso total ao sistema
- Gerenciar usuários, produtos, categorias
- Visualizar relatórios
- Configurar sistema

## 🎨 Design System

O sistema utiliza um design system personalizado com:

- **Cores**: Laranja (#f97316) e Vermelho (#ef4444) como principais
- **Fontes**: Inter (textos) e Poppins (títulos)
- **Componentes**: Botões, inputs, cards padronizados
- **Animações**: Transições suaves e feedback visual

## 📱 Responsividade

- **Mobile**: 320px+
- **Tablet**: 768px+
- **Desktop**: 1024px+
- **Large**: 1280px+

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Verificar código
npm run lint:fix     # Corrigir problemas de lint
npm run type-check   # Verificar tipos TypeScript
npm run db:generate  # Gerar cliente Prisma
npm run db:push      # Sincronizar schema
npm run db:migrate   # Executar migrações
npm run db:seed      # Popular banco
npm run db:studio    # Interface do Prisma
npm run format       # Formatar código
```

## 🗄️ Banco de Dados

### Entidades Principais

- **Users**: Usuários do sistema
- **Categories**: Categorias de produtos
- **Products**: Produtos do cardápio
- **Orders**: Pedidos dos clientes
- **OrderItems**: Itens dos pedidos
- **Tables**: Mesas do restaurante
- **SystemSettings**: Configurações do sistema

### Enums

- **UserRole**: CLIENTE, FUNCIONARIO, ADMINISTRADOR
- **OrderStatus**: PENDENTE, CONFIRMADO, PREPARANDO, PRONTO, ENTREGUE, CANCELADO
- **TableStatus**: LIVRE, OCUPADA, RESERVADA, MANUTENCAO
- **DeliveryType**: RETIRADA, DELIVERY
- **PaymentMethod**: DINHEIRO, CARTAO, PIX

## 🔧 Configurações

### Variáveis de Ambiente

```env
# Obrigatórias
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"

# Opcionais
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_MAX_SIZE="10485760"
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp"
```

### Configurações do Sistema

O sistema possui configurações internas gerenciáveis via interface:

- Nome do restaurante
- Endereço e telefone
- Taxa de entrega
- Valor mínimo do pedido
- Tempo médio de entrega

## 📊 Relatórios

O sistema gera relatórios de:

- Vendas por período
- Produtos mais vendidos
- Performance por funcionário
- Horários de maior movimento
- Receita por categoria

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Configure o banco PostgreSQL (Vercel Postgres)
4. Deploy automático

### Outras Plataformas

- **Railway**: Suporte nativo ao PostgreSQL
- **Heroku**: Com addon PostgreSQL
- **DigitalOcean**: App Platform
- **AWS**: Amplify + RDS

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte, entre em contato:

- **Email**: suporte@lanchonete.com
- **Issues**: [GitHub Issues](https://github.com/username/lanchonete-next/issues)
- **Documentação**: [Wiki do projeto](https://github.com/username/lanchonete-next/wiki)

## 🎯 Roadmap

- [ ] Sistema de notificações push
- [ ] Integração com sistemas de pagamento
- [ ] App mobile (React Native)
- [ ] PWA (Progressive Web App)
- [ ] Integração com delivery (iFood, Uber Eats)
- [ ] Sistema de cupons e promoções
- [ ] Relatórios avançados
- [ ] Multi-idioma
- [ ] Modo escuro

---

**Desenvolvido com ❤️ para lanchonetes e restaurantes**
