# Contexto: Integrações de Delivery (iFood, 99food, Keeta)
**Última atualização:** 13/05/2026  
**Projeto:** Cheffya (restaurante-dashboard)  
**VPS:** 178.104.118.20 | **Domínio:** api.cheffya.com.br

---

## O que foi feito nessa sessão

### 1. Logos nos cards de integração
- Adicionadas as imagens `logo-ifood.png`, `logo-99food.png`, `logo-keeta.png` em `public/` e `dist/`
- As logos agora cobrem 100% do bloco do card (`objectFit: 'cover'`)

### 2. Nome corrigido: "Ketta" → "Keeta"
- Todas as ocorrências de "Ketta" foram renomeadas para "Keeta" em `Integracoes.jsx`
- A chave no JSONB também mudou: `ketta` → `keeta`
- O arquivo de logo antigo era `logo-ketta.png` → agora `logo-keeta.png`

### 3. Bug crítico: pedidos iFood sumiam no Kanban
**Causa:** O campo `canal` dos pedidos iFood é `'ifood'`, mas o filtro do Kanban só aceitava `canal === 'delivery'`.  
**Correção em `Kanban.jsx`:**
- Local: `.filter(p => !isDelivery(p.canal))` (exclui todos os canais delivery)
- Delivery: `if (!isDelivery(p.canal)) return false` (inclui ifood, 99food, keeta)

### 4. Helper de plataformas: `src/utils/plataformas.js`
Arquivo criado centralizando cores e labels de cada plataforma:
```js
export const PLATAFORMAS = {
  ifood:    { label: 'iFood',   cor: '#ea1d2c', ... },
  '99food': { label: '99food',  cor: '#b8860b', ... },
  keeta:    { label: 'Keeta',   cor: '#6c3fc5', ... },
  delivery: { label: 'Delivery',cor: '#f04000', ... },
}
export function isDelivery(canal) {
  return ['delivery', 'ifood', '99food', 'keeta'].includes(canal)
}
export function getPlataf(canal) {
  return PLATAFORMAS[canal] || PLATAFORMAS.delivery
}
```

### 5. Badges por plataforma
Implementado em: `Kanban.jsx`, `CaixaDisplay.jsx`, `CozinhaDisplay.jsx`, `DeliveryGerenciar.jsx`  
Cada plataforma mostra sua cor e nome: 🛵 iFood (vermelho), 🛵 99food (amarelo), 🛵 Keeta (roxo)

### 6. Bug mesa: "Pago" não liberava a mesa
**Causa:** `pagarMesa()` no AppContext só marcava os pedidos como pagos, mas não chamava `setStatusMesa('livre')`.  
**Correção em `Mesas.jsx`:** `ModalPagar.onConfirmar` agora chama `setStatusMesa(mesaId, 'livre')` após pagar.  
**Correção em `CaixaDisplay.jsx`:** Botão "Pago" no MesasBoard agora mostra confirmação inline e libera a mesa ao confirmar.

### 7. Nome do cliente no balcão/cozinha
Pedidos locais guardam `clienteId` (não `clienteNome`). Corrigido em `CaixaDisplay.jsx` e `CozinhaDisplay.jsx`:
```js
const nomeCliente = pedido.clienteNome || clientes?.find(c => c.id === pedido.clienteId)?.nome || null
```

### 8. Edge Functions deployadas na VPS
Criados dois arquivos de Edge Function (Deno/TypeScript):
- `supabase/functions/99food-webhook/index.ts`
- `supabase/functions/keeta-webhook/index.ts`

**Como foram deployadas (self-hosted Supabase):**
O CLI `supabase functions deploy` NÃO funciona para Supabase self-hosted (exige token de cloud).  
O método correto foi copiar direto para o volume Docker e reiniciar o container:
```bash
cp -r supabase/functions/99food-webhook /opt/supabase/docker/volumes/functions/
cp -r supabase/functions/keeta-webhook /opt/supabase/docker/volumes/functions/
docker restart supabase-edge-functions
```

**Testado e funcionando:**
```
curl https://api.cheffya.com.br/functions/v1/99food-webhook  → "99food-webhook ativo"
curl https://api.cheffya.com.br/functions/v1/keeta-webhook   → "keeta-webhook ativo"
```

### 9. AppContext: novos campos mapeados
Em `rowToPedido()` no `AppContext.jsx`:
```js
plataformaTaxa: row.plataforma_taxa || 0,
plataformaPedidoId: row.plataforma_pedido_id || null,
```

### 10. SQL de migração
Adicionado ao `supabase-migration-supplement.sql` (seção 12):
```sql
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS plataforma_taxa NUMERIC DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS plataforma_pedido_id TEXT;
```
**⚠️ Verificar se foi rodado no Supabase Studio → SQL Editor.**

---

## Como funciona o fluxo de integração

### iFood (já existia antes desta sessão)
- Edge Functions: `ifood-webhook`, `ifood-connect`, `ifood-action` já estavam deployadas
- Pedidos chegam com `canal: 'ifood'` e `ifood_order_id` preenchido
- O bug de sumirem no Kanban foi corrigido nessa sessão

### 99food (novo)
**Webhook URL para configurar no painel 99food:**
```
https://api.cheffya.com.br/functions/v1/99food-webhook
```
**Fluxo:**
1. Pedido feito no 99food → plataforma faz POST no webhook
2. A Edge Function lê o `restaurant_id` no payload
3. Busca na tabela `integracoes_config` o usuário dono daquele `restaurant_id`
4. Mapeia os itens do pedido para pratos internos (por ID, nome exato ou nome parcial)
5. Insere o pedido na tabela `pedidos` com `canal: '99food'`
6. O pedido aparece no Kanban/Balcão/Cozinha com badge amarelo "99food"

**Configuração necessária no app (Integrações → 99food):**
- `restaurant_id`: ID do restaurante no 99food
- `api_key`: chave de API (para validação futura)
- `mapeamento`: objeto `{ "id_externo": "uuid_prato_interno" }` (opcional)

### Keeta (novo)
**Webhook URL para configurar no painel Keeta:**
```
https://api.cheffya.com.br/functions/v1/keeta-webhook
```
**Fluxo idêntico ao 99food**, mas identificando o restaurante pelo campo `loja_id`.

**Configuração necessária no app (Integrações → Keeta):**
- `loja_id` ou `store_id`: ID da loja na Keeta
- `mapeamento`: objeto de mapeamento de produtos (opcional)

---

## Estrutura do banco relevante

### Tabela `pedidos` — campos de plataforma
| Campo | Tipo | Uso |
|-------|------|-----|
| `canal` | TEXT | `'local'`, `'delivery'`, `'ifood'`, `'99food'`, `'keeta'` |
| `ifood_order_id` | TEXT | ID externo — prefixado: `keeta_xxx`, `99food_xxx` |
| `ifood_short_id` | TEXT | Código curto exibido na UI |
| `plataforma_taxa` | NUMERIC | Taxa/comissão cobrada pela plataforma |
| `plataforma_pedido_id` | TEXT | ID externo genérico (redundante com `ifood_order_id`) |
| `cliente_nome` | TEXT | Nome do cliente vindo da plataforma |
| `cliente_telefone` | TEXT | Telefone do cliente |
| `endereco_entrega` | TEXT | Endereço formatado |
| `forma_pagamento` | TEXT | Método de pagamento da plataforma |

### Tabela `integracoes_config`
Armazena credenciais por usuário em JSONB:
```json
{
  "99food": {
    "restaurant_id": "abc123",
    "api_key": "...",
    "mapeamento": { "id_externo": "uuid_interno" }
  },
  "keeta": {
    "loja_id": "xyz789",
    "mapeamento": {}
  }
}
```

---

## Arquivos modificados nessa sessão

| Arquivo | O que mudou |
|---------|-------------|
| `src/utils/plataformas.js` | NOVO — helper de plataformas |
| `src/pages/Kanban.jsx` | Fix filtros + badge por plataforma |
| `src/pages/CaixaDisplay.jsx` | Badge plataforma + fix mesa pago + fix nome cliente |
| `src/pages/CozinhaDisplay.jsx` | Badge plataforma + fix nome cliente |
| `src/pages/DeliveryGerenciar.jsx` | Badge plataforma |
| `src/pages/Integracoes.jsx` | Keeta renomeado + logos + URL webhook |
| `src/pages/Mesas.jsx` | Fix modal pagar libera mesa |
| `src/context/AppContext.jsx` | Mapeamento `plataformaTaxa` e `plataformaPedidoId` |
| `supabase/functions/99food-webhook/index.ts` | NOVO |
| `supabase/functions/keeta-webhook/index.ts` | NOVO |
| `supabase-migration-supplement.sql` | Colunas `plataforma_taxa` e `plataforma_pedido_id` |
| `public/logo-ifood.png` | NOVO |
| `public/logo-99food.png` | NOVO |
| `public/logo-keeta.png` | NOVO |

---

## O que falta / próximos passos

- [ ] **Confirmar se o SQL de migração foi rodado** (`plataforma_taxa`, `plataforma_pedido_id`, `taxa_comissao` em garcons)
- [ ] **Configurar credenciais reais** do 99food e Keeta na tela de Integrações para cada cliente
- [ ] **Testar recebimento de pedido real** do 99food e Keeta (ou simular com curl POST)
- [ ] **Mapeamento de produtos**: para cada cliente, mapear IDs dos produtos da plataforma para pratos internos
- [ ] **Validação de autenticidade** do webhook (verificar assinatura/token para garantir que o payload vem mesmo da plataforma)
- [ ] **Relatório de vendas por plataforma**: na tela de Vendas, mostrar receita separada por canal (iFood, 99food, Keeta, Local, Delivery)
- [ ] **Taxa da plataforma no relatório**: deduzir `plataforma_taxa` do lucro líquido

---

## Sessão 13/05/2026 — Comissão de Garçom + Agrupamento de Pedidos

### 11. Comissão de garçom
- **SQL**: `ALTER TABLE garcons ADD COLUMN IF NOT EXISTS taxa_comissao NUMERIC DEFAULT 0;` adicionado ao `supabase-migration-supplement.sql`
- **AppContext.jsx**: `rowToGarcon()` agora mapeia `taxaComissao`; nova função `atualizarGarcon(id, {nome, taxaComissao})`; `KANBAN_CONFIG_PADRAO` ganhou `comissaoGarconAtivo: false` e `garconPodeFecharConta: false`
- **Cardapio.jsx** (aba Comanda Digital): dois toggles novos — "Garçom pode fechar conta" e "Comissão de garçom"; quando comissão ativa, cada garçom ganha input `%` ao lado
- **Mesas.jsx** (ModalPagar): exibe bloco verde "🤝 Comissão NomeGarcom: X% = R$ X,XX" quando `comissaoGarconAtivo` e taxa > 0 (informativo, não altera total)
- **CaixaDisplay.jsx** (ModalPagamento): mesma comissão informativa; `abrirPagamento()` agora calcula total de TODOS os pedidos não pagos da mesa quando `mesaId` está presente
- **ComandaDigital.jsx**: seção "Fechar Conta" lista mesas abertas do garçom com botão; modal mostra itens, total, comissão, e botões de forma de pagamento; chama `pagarMesa()` + `setStatusMesa('livre')`

### 12. Agrupamento de pedidos na última coluna do Balcão
- **CaixaDisplay.jsx** — Função `agruparPedidosUltimaColuna()`: agrupa pedidos por `mesaId` ou `clienteNome` na coluna "Entregue/Completo" (apenas last column, apenas local — delivery não agrupa)
- Novo componente inline `CardGrupoMesa`: card combinado com todos os itens, total somado, comissão opcional, e botão "Pagar {Mesa}" com seletor inline de forma de pagamento

### Arquivos modificados nessa sessão (13/05)
| Arquivo | O que mudou |
|---------|-------------|
| `supabase-migration-supplement.sql` | `taxa_comissao` em garcons (seção 12b) |
| `src/context/AppContext.jsx` | `rowToGarcon` + `atualizarGarcon` + novos flags kanban |
| `src/pages/Cardapio.jsx` | Toggles + input % comissão por garçom |
| `src/pages/Mesas.jsx` | Bloco comissão no ModalPagar |
| `src/pages/CaixaDisplay.jsx` | Comissão no modal + `CardGrupoMesa` + `agruparPedidosUltimaColuna` |
| `src/pages/ComandaDigital.jsx` | Seção "Fechar Conta" + modal de pagamento |

---

## Como fazer deploy de nova Edge Function no futuro

O CLI `supabase functions deploy` **não funciona** para Supabase self-hosted.  
O processo correto é:

```bash
# 1. Copiar o arquivo da função para o volume Docker
cp -r /var/www/restaurante-src/supabase/functions/NOME_DA_FUNCAO \
      /opt/supabase/docker/volumes/functions/

# 2. Reiniciar o edge runtime
docker restart supabase-edge-functions

# 3. Testar
curl https://api.cheffya.com.br/functions/v1/NOME_DA_FUNCAO
```

O volume das funções fica em: `/opt/supabase/docker/volumes/functions/`
