# 📱 Plano de Implementação - API WhatsApp

## 📋 **Visão Geral**

### 🎯 **Objetivo**
Integrar o sistema de lanchonete com WhatsApp Business API para:
- Notificações automáticas de pedidos
- Confirmação de pedidos via WhatsApp
- Atualizações de status em tempo real
- Comunicação direta com clientes
- Marketing e promoções

### ⏱️ **Tempo Estimado Total: 5-7 dias úteis**

---

## 🔧 **Arquitetura Técnica**

### 📊 **Componentes Necessários**

#### 1. **WhatsApp Business API**
- **Fornecedor:** Meta (Facebook) ou parceiros (Twilio, MessageBird)
- **Custo:** ~$0.005-0.05 por mensagem
- **Setup:** 2-3 dias (aprovação Meta)

#### 2. **Webhook Handler**
- **Endpoint:** `/api/webhooks/whatsapp`
- **Função:** Receber status de mensagens e respostas
- **Tempo:** 1 dia

#### 3. **Message Service**
- **Classe:** `WhatsAppService`
- **Função:** Enviar mensagens, templates, mídia
- **Tempo:** 2 dias

#### 4. **Database Integration**
- **Tabelas:** `whatsapp_messages`, `whatsapp_templates`
- **Função:** Armazenar histórico e templates
- **Tempo:** 1 dia

#### 5. **Frontend Integration**
- **Componentes:** Notificações WhatsApp no admin
- **Páginas:** Configurações WhatsApp
- **Tempo:** 1-2 dias

---

## 📅 **Cronograma Detalhado**

### **Dia 1-2: Setup e Configuração**
- ✅ Configurar conta WhatsApp Business
- ✅ Obter tokens de acesso
- ✅ Configurar webhook básico
- ✅ Testar conexão

### **Dia 3-4: Desenvolvimento Core**
- ✅ Implementar `WhatsAppService`
- ✅ Criar modelos de dados
- ✅ Implementar envio de mensagens
- ✅ Integrar com sistema de pedidos

### **Dia 5: Templates e Notificações**
- ✅ Criar templates de mensagens
- ✅ Implementar notificações automáticas
- ✅ Configurar webhook para respostas

### **Dia 6: Interface e Testes**
- ✅ Interface de configuração no admin
- ✅ Testes de integração
- ✅ Documentação

### **Dia 7: Deploy e Monitoramento**
- ✅ Deploy em produção
- ✅ Monitoramento e logs
- ✅ Ajustes finais

---

## 🏗️ **Implementação Técnica**

### **1. Estrutura de Arquivos**

```
src/
├── app/api/whatsapp/
│   ├── send/route.ts
│   ├── webhook/route.ts
│   ├── templates/route.ts
│   └── status/route.ts
├── lib/
│   ├── whatsappService.ts
│   └── whatsappTemplates.ts
├── types/
│   └── whatsapp.ts
└── components/admin/
    └── whatsapp/
        ├── WhatsAppConfig.tsx
        ├── MessageHistory.tsx
        └── TemplateManager.tsx
```

### **2. Modelo de Dados (Prisma)**

```prisma
model WhatsAppMessage {
  id            String   @id @default(cuid())
  messageId     String   @unique
  phoneNumber   String
  messageType   String   // text, template, media
  content       String
  status        String   // sent, delivered, read, failed
  templateId    String?
  orderId       String?
  userId        String?
  sentAt        DateTime @default(now())
  deliveredAt   DateTime?
  readAt        DateTime?
  errorMessage  String?
  
  user          User?    @relation(fields: [userId], references: [id])
  order         Order?   @relation(fields: [orderId], references: [id])
  
  @@map("whatsapp_messages")
}

model WhatsAppTemplate {
  id          String   @id @default(cuid())
  templateId  String   @unique
  name        String
  category    String   // ORDER, PAYMENT, MARKETING
  language    String   @default("pt_BR")
  status      String   // PENDING, APPROVED, REJECTED
  content     String
  variables   Json?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("whatsapp_templates")
}
```

### **3. WhatsApp Service**

```typescript
// src/lib/whatsappService.ts
export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;
  }

  async sendMessage(phoneNumber: string, message: string) {
    // Implementação de envio
  }

  async sendTemplate(phoneNumber: string, templateId: string, variables: any[]) {
    // Implementação de template
  }

  async sendOrderNotification(orderId: string) {
    // Notificação de pedido
  }

  async sendPaymentConfirmation(orderId: string) {
    // Confirmação de pagamento
  }
}
```

### **4. Templates de Mensagem**

```typescript
// src/lib/whatsappTemplates.ts
export const WHATSAPP_TEMPLATES = {
  ORDER_RECEIVED: {
    name: 'order_received',
    content: 'Seu pedido #{{1}} foi recebido! Total: R$ {{2}}. Tempo estimado: {{3}} minutos.',
    variables: ['orderId', 'total', 'estimatedTime']
  },
  
  ORDER_READY: {
    name: 'order_ready',
    content: 'Seu pedido #{{1}} está pronto! Pode retirar na lanchonete.',
    variables: ['orderId']
  },
  
  PAYMENT_CONFIRMED: {
    name: 'payment_confirmed',
    content: 'Pagamento confirmado para o pedido #{{1}}! Valor: R$ {{2}}.',
    variables: ['orderId', 'amount']
  },
  
  STOCK_LOW: {
    name: 'stock_low',
    content: 'Produto {{1}} com estoque baixo ({{2}} unidades).',
    variables: ['productName', 'quantity']
  }
};
```

---

## 🔗 **Integração com Sistema Atual**

### **1. Notificações Automáticas**

```typescript
// src/app/api/orders/route.ts
// Adicionar após criar pedido
try {
  const { WhatsAppService } = await import('@/lib/whatsappService');
  await WhatsAppService.sendOrderNotification(result.id);
} catch (error) {
  console.error('Erro ao enviar notificação WhatsApp:', error);
}
```

### **2. Webhook para Status**

```typescript
// src/app/api/webhooks/whatsapp/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Processar status de mensagem
  if (body.statuses) {
    for (const status of body.statuses) {
      await updateMessageStatus(status.id, status.status);
    }
  }
  
  // Processar mensagens recebidas
  if (body.messages) {
    for (const message of body.messages) {
      await processIncomingMessage(message);
    }
  }
  
  return NextResponse.json({ status: 'ok' });
}
```

---

## 💰 **Custos Estimados**

### **Setup Inicial:**
- WhatsApp Business API: Gratuito
- Verificação de negócio: Gratuito
- Desenvolvimento: Tempo da equipe

### **Operacional (mensal):**
- **100 mensagens/dia:** ~$15/mês
- **500 mensagens/dia:** ~$75/mês
- **1000 mensagens/dia:** ~$150/mês

### **Custos por Tipo:**
- Texto simples: $0.005/mensagem
- Mídia (imagem/áudio): $0.015/mensagem
- Template: $0.005/mensagem

---

## 🚀 **Funcionalidades Implementadas**

### **Fase 1: Básico (Dia 1-3)**
- ✅ Envio de mensagens simples
- ✅ Webhook básico
- ✅ Notificações de pedido

### **Fase 2: Avançado (Dia 4-5)**
- ✅ Templates aprovados
- ✅ Confirmação de pagamento
- ✅ Status de entrega

### **Fase 3: Completo (Dia 6-7)**
- ✅ Interface administrativa
- ✅ Histórico de mensagens
- ✅ Relatórios de uso
- ✅ Configurações avançadas

---

## 📋 **Checklist de Implementação**

### **Setup Inicial:**
- [ ] Criar conta WhatsApp Business
- [ ] Configurar número de telefone
- [ ] Obter tokens de acesso
- [ ] Configurar webhook URL
- [ ] Testar conectividade

### **Desenvolvimento:**
- [ ] Implementar WhatsAppService
- [ ] Criar modelos de dados
- [ ] Implementar APIs
- [ ] Criar templates
- [ ] Integrar com pedidos

### **Interface:**
- [ ] Página de configuração
- [ ] Histórico de mensagens
- [ ] Gerenciador de templates
- [ ] Relatórios de uso

### **Testes:**
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes de webhook
- [ ] Testes de templates

### **Deploy:**
- [ ] Configurar variáveis de ambiente
- [ ] Deploy em produção
- [ ] Monitoramento
- [ ] Documentação

---

## ⚠️ **Considerações Importantes**

### **Limitações do WhatsApp:**
- **Janela de 24h:** Só pode responder dentro de 24h após última mensagem do cliente
- **Templates:** Necessário aprovação da Meta para templates personalizados
- **Rate Limits:** Máximo de 1000 mensagens/segundo
- **Políticas:** Seguir políticas rigorosas da Meta

### **Alternativas:**
- **Twilio WhatsApp API:** Mais flexível, mas mais caro
- **MessageBird:** Interface mais amigável
- **Zenvia:** Opção brasileira

### **Compliance:**
- **LGPD:** Consentimento do usuário obrigatório
- **Opt-out:** Permitir cancelamento de notificações
- **Dados:** Armazenar apenas dados necessários

---

## 🎯 **Benefícios Esperados**

### **Para o Negócio:**
- 📈 **Aumento de vendas:** Comunicação direta com clientes
- ⏱️ **Redução de tempo:** Automação de confirmações
- 📊 **Melhor atendimento:** Notificações em tempo real
- 💰 **ROI positivo:** Aumento de conversões

### **Para os Clientes:**
- 📱 **Conveniência:** Notificações no WhatsApp
- ⚡ **Rapidez:** Confirmações instantâneas
- 🔄 **Transparência:** Acompanhamento em tempo real
- 💬 **Comunicação:** Canal familiar e acessível

---

## 📞 **Próximos Passos**

### **Imediato:**
1. **Aprovação do plano** pela equipe
2. **Configuração da conta** WhatsApp Business
3. **Início do desenvolvimento** (Dia 1)

### **Curto Prazo:**
1. **Implementação básica** (5-7 dias)
2. **Testes e ajustes** (2-3 dias)
3. **Deploy em produção** (1 dia)

### **Médio Prazo:**
1. **Monitoramento** e otimizações
2. **Expansão de funcionalidades**
3. **Integração com outros canais**

---

**Documento criado em:** 04/10/2025  
**Versão:** 1.0  
**Estimativa total:** 5-7 dias úteis  
**Status:** Pronto para implementação
