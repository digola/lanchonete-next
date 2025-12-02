## Objetivo

* Voltar o valor do campo `status` para `"LIVRE"` em `PUT /api/orders/[id]/receive` no ponto de liberação da mesa.

## Escopo

* Alterar apenas a linha onde a mesa é atualizada após checagem de pedidos ativos.

* Manter intactas as demais regras (incluindo a liberação pós-pagamento total já implementada na rota de pagamento), a menos que você peça para revertê-las também.

## Arquivo e mudança

* `src/app/api/orders/[id]/receive/route.ts`

  * Trocar `status: 'livre'` por `status: 'LIVRE'` na atualização de mesa.

## Validação

* Executar um fluxo de entrega (`receive`) com uma mesa sem pedidos ativos:

  * Verificar que a mesa volta para `LIVRE`.

* Confirmar que ambientes que dependem de `TableStatus.LIVRE` continuam consistentes.

## Próximo passo

* Confirmar para aplicar a alteração pontual de volta para `"LIVRE"`.

