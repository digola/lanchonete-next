# 🧪 Guia Prático de Teste - Pedidos Staff

## 🚀 Como Executar os Testes

### **1. Acesso à Página de Teste**
```
1. Acesse: http://localhost:3000/staff
2. Faça login como usuário STAFF
3. Verifique se o painel de teste aparece na página
```

### **2. Teste Automatizado**
```javascript
// No console do navegador (F12):
testPedidosStaff()
```

### **3. Teste Manual Passo a Passo**

#### **Passo 1: Verificar Estado Inicial**
- [ ] Página `/staff` carrega sem erros
- [ ] Painel de teste está visível
- [ ] Status do usuário é exibido
- [ ] Mesas são listadas corretamente

#### **Passo 2: Criar Pedido**
- [ ] Clicar em "Criar Pedido" em uma mesa livre
- [ ] Adicionar produtos ao carrinho
- [ ] Finalizar pedido
- [ ] Verificar se mesa mudou para "Ocupada"

#### **Passo 3: Gerenciar Pedido**
- [ ] Clicar em "Gerenciar Mesa" na mesa ocupada
- [ ] Verificar se pedido aparece como "Pendente"
- [ ] Tentar clicar em "Aguardando Pagamento" (deve estar desabilitado)

#### **Passo 4: Receber Pagamento**
- [ ] Clicar no botão "Receber" (verde)
- [ ] Selecionar método de pagamento
- [ ] Inserir valor recebido
- [ ] Clicar em "Confirmar Recebimento"
- [ ] Verificar se pedido mudou para "Entregue"

#### **Passo 5: Alterar Status**
- [ ] Após recebimento, verificar se botão mudou
- [ ] Clicar no botão de mudança de status
- [ ] Verificar se status mudou corretamente

#### **Passo 6: Liberar Mesa**
- [ ] Após finalizar pedidos, clicar em "Liberar Mesa"
- [ ] Verificar se mesa voltou para "Livre"
- [ ] Voltar para `/staff` e confirmar mudança

## 🔍 Verificações Importantes

### **Console do Navegador**
```javascript
// Verificar usuário logado
checkAuth()

// Ver token atual
getToken()

// Verificar localStorage
checkLocalStorage()

// Limpar dados se necessário
clearAuth()
```

### **Network Tab (F12)**
- [ ] Requisições para `/api/tables` retornam 200
- [ ] Requisições para `/api/orders` retornam 200
- [ ] Requisições para `/api/auth/me` retornam 200
- [ ] Não há erros 401/403/500

### **Dados no Banco**
- [ ] Mesa mudou status corretamente
- [ ] Pedido foi criado com status "PENDENTE"
- [ ] Pagamento foi registrado
- [ ] Status do pedido foi atualizado

## 🐛 Problemas Comuns e Soluções

### **Erro: "Token inválido"**
```javascript
// Solução: Limpar dados e fazer login novamente
clearAuth()
// Depois fazer login novamente
```

### **Erro: "Sem permissão"**
- Verificar se usuário tem role STAFF ou ADMIN
- Verificar se token não expirou

### **Erro: "Mesa não encontrada"**
- Verificar se mesa existe no banco
- Verificar se ID da mesa está correto

### **Erro: "Pedido não pode ser alterado"**
- Verificar se pedido foi pago primeiro
- Verificar se status está correto

## 📊 Resultados Esperados

### **Teste Automatizado**
```
✅ Autenticação: Usuário autenticado como STAFF
✅ Acesso Staff: Acesso ao staff OK. X mesas encontradas
✅ API Mesas: API de mesas OK. Total: X, Livres: Y, Ocupadas: Z
✅ API Pedidos: API de pedidos OK. Total: X, Hoje: Y
✅ Fluxo Mesas: Mesa livre encontrada: Mesa X
```

### **Teste Manual**
- [ ] Interface responde corretamente
- [ ] Dados são persistidos
- [ ] Restrições funcionam
- [ ] Performance está boa

## 🎯 Critérios de Sucesso

- [ ] **100% dos testes automatizados passam**
- [ ] **Fluxo manual executa sem erros**
- [ ] **Dados são persistidos corretamente**
- [ ] **Interface é responsiva**
- [ ] **Restrições de negócio funcionam**

## 📝 Relatório de Teste

### **Data/Hora:** ___________
### **Usuário:** ___________
### **Navegador:** ___________

### **Resultados:**
- [ ] Teste automatizado: ✅ Passou / ❌ Falhou
- [ ] Teste manual: ✅ Passou / ❌ Falhou
- [ ] Performance: ✅ Boa / ❌ Lenta
- [ ] Interface: ✅ OK / ❌ Problemas

### **Problemas Encontrados:**
```
1. 
2. 
3. 
```

### **Observações:**
```
1. 
2. 
3. 
```

