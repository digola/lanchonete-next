# 📚 DOCUMENTAÇÃO BASE - SISTEMA "nextjs-lanchonete"

## **VISÃO GERAL DO PROJETO**

O projeto `nextjs-lanchonete` é um sistema completo de gestão para lanchonetes e restaurantes, desenvolvido com Next.js 15, TypeScript, Prisma e Tailwind CSS. O sistema foi simplificado para usar apenas 3 roles de usuário e possui funcionalidades robustas para gestão de produtos, pedidos, usuários e mesas.

---

## **🏗️ ARQUITETURA E TECNOLOGIAS**

### **Stack Principal**
- **Frontend**: Next.js 15.5.2 (App Router)
- **Linguagem**: TypeScript 5.6.3
- **Estilização**: Tailwind CSS 3.4.14
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT (jsonwebtoken)
- **Estado Global**: Zustand
- **Ícones**: Lucide React + Heroicons
- **Utilitários**: clsx, tailwind-merge

### **Estrutura de Pastas**
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

---

## **👥 SISTEMA DE USUÁRIOS E ROLES**

### **Roles Simplificados (3 tipos)**
1. **CLIENTE** - Cliente final que faz pedidos
2. **FUNCIONARIO** - Funcionário que gerencia pedidos e mesas  
3. **ADMINISTRADOR** - Administrador com acesso total

### **Sistema de Permissões**
```typescript
const ROLE_PERMISSIONS = {
  CLIENTE: [
    'menu:read', 'orders:read', 'orders:create', 'orders:update',
    'profile:read', 'profile:write', 'cart:read', 'cart:write', 'cart:delete'
  ],
  FUNCIONARIO: [
    'menu:read', 'orders:read', 'orders:update', 'orders:write',
    'products:read', 'profile:read', 'profile:write'
  ],
  ADMINISTRADOR: [
    'users:read', 'users:write', 'users:delete',
    'products:read', 'products:write', 'products:delete',
    'categories:read', 'categories:write', 'categories:delete',
    'orders:read', 'orders:write', 'orders:delete',
    'reports:read', 'settings:read', 'settings:write',
    'menu:read', 'menu:write', 'menu:delete',
    'profile:read', 'profile:write'
  ]
}
```

---

## **🗄️ MODELO DE DADOS (Prisma)**

### **Entidades Principais**

#### **User (Usuários)**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(CLIENTE)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  orders    Order[]
  tables    Table[]  @relation("TableAssignedTo")
}
```

#### **Category (Categorias)**
```prisma
model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  icon        String    // Emoji ou ícone
  color       String    // Cor em hex
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  products    Product[]
}
```

#### **Product (Produtos)**
```prisma
model Product {
  id             String   @id @default(cuid())
  name           String
  description    String
  price          Decimal  @db.Decimal(10, 2)
  imageUrl       String?
  categoryId     String
  isAvailable    Boolean  @default(true)
  preparationTime Int     @default(15) // minutos
  allergens      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  category       Category      @relation(fields: [categoryId], references: [id])
  options        ProductOption[]
  orderItems     OrderItem[]
}
```

#### **Order (Pedidos)**
```prisma
model Order {
  id              String        @id @default(cuid())
  userId          String
  status          OrderStatus   @default(PENDENTE)
  total           Decimal       @db.Decimal(10, 2)
  deliveryType    DeliveryType  @default(RETIRADA)
  deliveryAddress String?
  paymentMethod   PaymentMethod @default(DINHEIRO)
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  user            User          @relation(fields: [userId], references: [id])
  items           OrderItem[]
}
```

#### **Table (Mesas)**
```prisma
model Table {
  id            String      @id @default(cuid())
  number        Int         @unique
  capacity      Int         @default(4)
  status        TableStatus @default(LIVRE)
  currentOrderId String?
  assignedTo    String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  assignedUser  User?       @relation("TableAssignedTo", fields: [assignedTo], references: [id])
}
```

### **Enums**
```prisma
enum UserRole {
  CLIENTE
  FUNCIONARIO
  ADMINISTRADOR
}

enum OrderStatus {
  PENDENTE
  CONFIRMADO
  PREPARANDO
  PRONTO
  ENTREGUE
  CANCELADO
}

enum TableStatus {
  LIVRE
  OCUPADA
  RESERVADA
  MANUTENCAO
}

enum DeliveryType {
  RETIRADA
  DELIVERY
}

enum PaymentMethod {
  DINHEIRO
  CARTAO
  PIX
}
```

---

## **🔐 SISTEMA DE AUTENTICAÇÃO**

### **Arquivos Principais**
- `src/lib/auth.ts` - Funções de autenticação (JWT, hash, validações)
- `src/hooks/useApiAuth.ts` - Hook para autenticação via API
- `src/stores/authStore.ts` - Estado global de autenticação (Zustand)
- `src/components/ProtectedRoute.tsx` - Proteção de rotas

### **Funcionalidades**
- **Login/Logout** com JWT
- **Hash de senhas** com bcryptjs
- **Validação de permissões** por role
- **Refresh tokens** para renovação
- **Middleware de autenticação** para APIs
- **Proteção de rotas** baseada em roles

### **Fluxo de Autenticação**
1. Usuário faz login com email/senha
2. Sistema valida credenciais no banco
3. Gera JWT token com dados do usuário
4. Token é salvo no localStorage/cookies
5. Todas as requisições incluem token no header
6. Middleware valida token em rotas protegidas

---

## **🎨 SISTEMA DE DESIGN**

### **Cores Personalizadas (Tailwind)**
```typescript
colors: {
  primary: {
    50: '#fff7ed',   // Laranja claro
    500: '#f97316',  // Laranja principal
    900: '#7c2d12'   // Laranja escuro
  },
  secondary: {
    50: '#fef2f2',   // Vermelho claro
    500: '#ef4444',  // Vermelho principal
    900: '#7f1d1d'   // Vermelho escuro
  },
  success: { /* Verde */ },
  warning: { /* Amarelo */ }
}
```

### **Fontes**
- **Inter** - Fonte principal para textos
- **Poppins** - Fonte para títulos e elementos destacados

### **Componentes Base**
- `.btn` - Botões com variações (primary, secondary, danger, etc.)
- `.input` - Campos de entrada padronizados
- `.card` - Cards com sombras e bordas
- `.badge` - Badges para status e categorias

---

## **📱 PÁGINAS E FUNCIONALIDADES**

### **Página Inicial (`/`)**
- **Cardápio público** com produtos
- **Sistema de busca** e filtros
- **Carrinho de compras** persistente
- **Autenticação** integrada
- **Redirecionamento** baseado em role

### **Área do Cliente (`/customer/`)**
- **Meus Pedidos** - Acompanhar pedidos
- **Perfil** - Gerenciar dados pessoais
- **Carrinho** - Finalizar compras

### **Área do Funcionário (`/staff/`)**
- **Pedidos** - Gerenciar pedidos em tempo real
- **Mesas** - Controlar ocupação de mesas
- **Cardápio** - Visualizar produtos

### **Área Administrativa (`/admin/`)**
- **Dashboard** - Visão geral do sistema
- **Produtos** - CRUD completo de produtos
- **Categorias** - Gerenciar categorias
- **Usuários** - Gerenciar usuários e roles
- **Mesas** - Configurar mesas do restaurante
- **Relatórios** - Estatísticas e relatórios

---

## **🔌 SISTEMA DE APIs**

### **Estrutura de Rotas**
```
/api/
├── auth/                  # Autenticação
│   ├── login/            # POST - Login
│   ├── logout/           # POST - Logout
│   └── me/               # GET - Usuário atual
├── products/             # Produtos
│   ├── route.ts          # GET/POST - Listar/Criar
│   ├── [id]/            # GET/PUT/DELETE - Produto específico
│   ├── upload/           # POST - Upload de imagem
│   └── bulk/             # POST - Operações em lote
├── categories/           # Categorias
├── orders/               # Pedidos
├── tables/               # Mesas
├── users/                # Usuários
└── admin/                # Funcionalidades administrativas
```

### **Padrões de API**
- **Autenticação**: JWT no header `Authorization`
- **Respostas**: Formato padronizado com `success`, `data`, `error`
- **Validação**: Middleware de validação de dados
- **Paginação**: Parâmetros `page` e `limit`
- **Filtros**: Query parameters para busca e filtros

---

## **🛠️ HOOKS CUSTOMIZADOS**

### **useApiAuth**
```typescript
const {
  user,                    // Dados do usuário
  isLoading,              // Estado de carregamento
  isAuthenticated,        // Se está autenticado
  login,                  // Função de login
  logout,                 // Função de logout
  hasRole,                // Verificar role específico
  hasMinimumRole,         // Verificar role mínimo
  hasPermission           // Verificar permissão
} = useApiAuth()
```

### **useRoleRedirect**
```typescript
const {
  redirectByRole,         // Redirecionar por role
  getRoleRoute,           // Obter rota do role
  redirectWithDelay,      // Redirecionar com delay
  shouldRedirect          // Verificar se deve redirecionar
} = useRoleRedirect()
```

### **useCartPersistence**
```typescript
const {
  addToCart,              // Adicionar ao carrinho
  removeFromCart,         // Remover do carrinho
  updateItemQuantity,     // Atualizar quantidade
  getItemQuantity,        // Obter quantidade
  isInCart,               // Verificar se está no carrinho
  itemsCount,             // Total de itens
  totalPrice              // Preço total
} = useCartPersistence()
```

---

## **📊 SISTEMA DE ESTADO (Zustand)**

### **AuthStore**
```typescript
interface AuthStore {
  // Estado
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  token: string | null
  
  // Ações
  login: (credentials: LoginCredentials) => Promise<Result>
  register: (userData: RegisterData) => Promise<Result>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<Result>
  changePassword: (current: string, new: string) => Promise<Result>
  
  // Verificações
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRole) => boolean
  hasMinimumRole: (minimumRole: UserRole) => boolean
}
```

---

## **🎯 FUNCIONALIDADES PRINCIPAIS**

### **Gestão de Produtos**
- ✅ CRUD completo de produtos
- ✅ Upload de imagens
- ✅ Categorização por categorias
- ✅ Opções personalizáveis (tamanhos, extras)
- ✅ Controle de disponibilidade
- ✅ Tempo de preparo
- ✅ Informações de alérgenos

### **Sistema de Pedidos**
- ✅ Criação de pedidos
- ✅ Status em tempo real
- ✅ Tipos de entrega (retirada/delivery)
- ✅ Métodos de pagamento
- ✅ Observações personalizadas
- ✅ Histórico de pedidos

### **Gestão de Mesas**
- ✅ Controle de ocupação
- ✅ Atribuição a funcionários
- ✅ Status das mesas
- ✅ Capacidade configurável

### **Sistema de Usuários**
- ✅ 3 roles simplificados
- ✅ Permissões granulares
- ✅ Perfis personalizáveis
- ✅ Preferências do usuário

### **Interface e UX**
- ✅ Design responsivo
- ✅ Tema personalizado
- ✅ Animações suaves
- ✅ Feedback visual
- ✅ Navegação intuitiva

---

## **🔧 CONFIGURAÇÕES E DEPENDÊNCIAS**

### **Scripts Disponíveis**
```json
{
  "dev": "next dev",
  "build": "next build", 
  "start": "next start",
  "lint": "next lint",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:seed": "tsx prisma/seed.ts"
}
```

### **Dependências Principais**
```json
{
  "next": "15.5.2",
  "react": "^18.3.1",
  "typescript": "^5.6.3",
  "@prisma/client": "^5.22.0",
  "prisma": "^5.22.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "zustand": "^5.0.2",
  "lucide-react": "^0.460.0",
  "tailwindcss": "^3.4.14"
}
```

---

## **🚀 PONTOS FORTES DO SISTEMA**

### **Arquitetura**
- ✅ **Modular** - Código bem organizado e separado
- ✅ **Escalável** - Fácil adicionar novas funcionalidades
- ✅ **Type-safe** - TypeScript em todo o projeto
- ✅ **Performance** - Next.js com otimizações

### **Segurança**
- ✅ **Autenticação robusta** - JWT com refresh tokens
- ✅ **Autorização granular** - Sistema de permissões
- ✅ **Validação de dados** - Middleware de validação
- ✅ **Proteção de rotas** - Componente ProtectedRoute

### **UX/UI**
- ✅ **Design moderno** - Tailwind CSS personalizado
- ✅ **Responsivo** - Funciona em todos os dispositivos
- ✅ **Acessível** - Boas práticas de acessibilidade
- ✅ **Intuitivo** - Navegação clara por roles

### **Funcionalidades**
- ✅ **Completas** - Sistema end-to-end
- ✅ **Flexíveis** - Configurável para diferentes negócios
- ✅ **Robustas** - Tratamento de erros e validações
- ✅ **Testáveis** - Código bem estruturado

---

## **📝 OBSERVAÇÕES IMPORTANTES**

### **Simplificações Realizadas**
- ✅ **3 roles apenas** - CLIENTE, FUNCIONARIO, ADMINISTRADOR
- ✅ **Páginas consolidadas** - Removidas duplicatas
- ✅ **Navegação unificada** - Sistema de navegação por role
- ✅ **APIs em inglês** - Padronização de nomenclatura

### **Padrões de Código**
- ✅ **Comentários detalhados** - Documentação inline
- ✅ **Nomenclatura clara** - Nomes descritivos
- ✅ **Estrutura consistente** - Padrões definidos
- ✅ **Tratamento de erros** - Try/catch em operações críticas

### **Próximos Passos Sugeridos**
1. **Testes automatizados** - Jest + Testing Library
2. **PWA** - Transformar em Progressive Web App
3. **Notificações** - Sistema de notificações em tempo real
4. **Relatórios avançados** - Dashboard com métricas
5. **Integração de pagamento** - Stripe/PagSeguro
6. **App mobile** - React Native ou PWA

---

## **🎯 CONCLUSÃO**

O sistema `nextjs-lanchonete` é uma base sólida e bem estruturada para desenvolvimento de sistemas de gestão para lanchonetes e restaurantes. Com arquitetura moderna, código limpo e funcionalidades completas, serve como excelente ponto de partida para novos projetos.

**Principais vantagens:**
- ✅ Código bem documentado e comentado
- ✅ Arquitetura escalável e modular
- ✅ Sistema de autenticação robusto
- ✅ Interface moderna e responsiva
- ✅ Funcionalidades completas e testadas

**Ideal para:**
- 🏪 Lanchonetes e restaurantes
- 🍕 Pizzarias e fast-foods
- ☕ Cafeterias e bares
- 🍔 Food trucks e delivery
- 📱 Qualquer negócio de alimentação

---

*Documentação criada em: 23/09/2025*  
*Versão do sistema: 1.0.0*  
*Status: Produção*
