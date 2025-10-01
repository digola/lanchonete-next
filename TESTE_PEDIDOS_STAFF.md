# 🧪 Teste Completo - Pedidos Staff

## 📋 Cenário de Teste
Testar o fluxo completo de pedidos feito pelo staff, incluindo recebimento e mudança de status da mesa.

## 🎯 Objetivos
1. ✅ Verificar se staff pode criar pedidos
2. ✅ Testar recebimento de pagamento
3. ✅ Validar mudança de status da mesa
4. ✅ Confirmar restrições de mudança de status

## 🚀 Passos do Teste

### **1. Preparação**
- [ ] Acessar `/staff` como usuário STAFF
- [ ] Verificar se há mesas disponíveis
- [ ] Confirmar que não há pedidos ativos

### **2. Criar Pedido**
- [ ] Clicar em "Criar Pedido" em uma mesa livre
- [ ] Adicionar produtos ao carrinho
- [ ] Finalizar pedido
- [ ] Verificar se mesa mudou para "Ocupada"

### **3. Gerenciar Pedido**
- [ ] Acessar `/tables/[id]` da mesa ocupada
- [ ] Verificar se pedido aparece como "Pendente"
- [ ] Tentar mudar status (deve falhar - aguardando pagamento)
- [ ] Verificar botão "Aguardando Pagamento"

### **4. Receber Pagamento**
- [ ] Clicar em "Receber" na página da mesa
- [ ] Selecionar método de pagamento
- [ ] Inserir valor recebido
- [ ] Confirmar recebimento
- [ ] Verificar se pedido mudou para "Entregue"

### **5. Testar Mudança de Status**
- [ ] Após recebimento, tentar mudar status do pedido
- [ ] Verificar se agora é possível alterar status
- [ ] Testar fluxo: Entregue → Pronto → Finalizado

### **6. Liberar Mesa**
- [ ] Após finalizar pedidos, liberar mesa
- [ ] Verificar se mesa voltou para "Livre"
- [ ] Confirmar que mesa aparece como disponível em `/staff`

## 🔍 Pontos de Verificação

### **Interface do Staff (`/staff`)**
- [ ] Mesas livres mostram botão "Criar Pedido"
- [ ] Mesas ocupadas mostram botão "Gerenciar Mesa"
- [ ] Contadores de estatísticas estão corretos
- [ ] Status visual das mesas está correto

### **Página da Mesa (`/tables/[id]`)**
- [ ] Pedidos ativos são exibidos
- [ ] Pedidos finalizados do dia são mostrados
- [ ] Botões de ação funcionam corretamente
- [ ] Restrições de status são respeitadas

### **Recebimento de Pagamento**
- [ ] Modal de recebimento abre corretamente
- [ ] Validação de valores funciona
- [ ] Cálculo de troco está correto
- [ ] Confirmação de recebimento funciona

### **Mudança de Status**
- [ ] Pedidos pendentes não podem ser alterados
- [ ] Após pagamento, status pode ser alterado
- [ ] Fluxo de status está correto
- [ ] Botões mostram estados corretos

## 🐛 Problemas Conhecidos
- [ ] Verificar se há erros no console
- [ ] Confirmar se APIs estão respondendo
- [ ] Validar se dados estão sendo salvos

## 📊 Resultados Esperados

### **Fluxo Normal:**
1. Mesa Livre → Criar Pedido → Mesa Ocupada
2. Pedido Pendente → Receber Pagamento → Pedido Entregue
3. Pedido Entregue → Alterar Status → Pedido Pronto
4. Finalizar Pedidos → Liberar Mesa → Mesa Livre

### **Restrições:**
- ❌ Não pode alterar status sem pagamento
- ❌ Não pode receber pagamento sem pedidos
- ❌ Não pode liberar mesa com pedidos ativos

## 🎯 Critérios de Sucesso
- [ ] Todos os passos executam sem erro
- [ ] Interface responde corretamente
- [ ] Dados são persistidos no banco
- [ ] Restrições de negócio são respeitadas
- [ ] Performance está aceitável (< 3s por ação)

## 📝 Observações
- Testar em diferentes navegadores
- Verificar responsividade mobile
- Confirmar logs no console
- Validar dados no banco após cada etapa

