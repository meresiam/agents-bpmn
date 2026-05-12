# Few-shots PT-BR — Descrição → JSON Bravy BPMN

> Pares (descrição em PT-BR → `ProcessGraphJson`) curados pra system prompt do agente NL→BPMN.
> Casos extraídos da apostila ESESP (gov-BR, vocabulário canônico) + adaptações do schema real Bravy.
>
> **Schema alvo:** `projetos/bpmn/agents-bpmn/frontend/src/types/process.types.ts`
> **Vocabulário:** `bpmn-vocab-canon-br.json`

---

## Few-shot #1 — Sequência simples (baseline)

**Descrição:**
> Quando uma macarronada precisa ser preparada no Restaurante Geral do Estado, o cozinheiro recebe o pedido, separa os ingredientes, cozinha o macarrão, prepara o molho, monta o prato e entrega ao garçom. Se faltar algum ingrediente, ele aciona o almoxarifado antes de cozinhar.

**JSON Bravy:**
```json
{
  "version": 1,
  "layout": "LR",
  "pool": "RGE — Preparo de Macarronada",
  "lanes": ["Cozinha", "Almoxarifado"],
  "nodes": [
    { "id": "start", "kind": "startEnd", "label": "Pedido recebido", "lane": "Cozinha", "bpmn": { "event": "start" } },
    { "id": "a1", "kind": "activity", "lane": "Cozinha", "label": "Separar ingredientes", "bpmn": { "task": "userTask" } },
    { "id": "g1", "kind": "decision", "lane": "Cozinha", "label": "Ingredientes completos?", "bpmn": { "gateway": "exclusive" } },
    { "id": "a2", "kind": "activity", "lane": "Almoxarifado", "label": "Repor ingredientes", "bpmn": { "task": "userTask" } },
    { "id": "a3", "kind": "activity", "lane": "Cozinha", "label": "Cozinhar macarrão", "bpmn": { "task": "manualTask" } },
    { "id": "a4", "kind": "activity", "lane": "Cozinha", "label": "Preparar molho", "bpmn": { "task": "manualTask" } },
    { "id": "a5", "kind": "activity", "lane": "Cozinha", "label": "Montar prato", "bpmn": { "task": "manualTask" } },
    { "id": "a6", "kind": "activity", "lane": "Cozinha", "label": "Entregar ao garçom", "bpmn": { "task": "userTask" } },
    { "id": "end", "kind": "startEnd", "label": "Prato entregue", "lane": "Cozinha", "bpmn": { "event": "end" } }
  ],
  "edges": [
    { "from": "start", "to": "a1" },
    { "from": "a1", "to": "g1" },
    { "from": "g1", "to": "a3", "label": "Sim" },
    { "from": "g1", "to": "a2", "label": "Não" },
    { "from": "a2", "to": "a3" },
    { "from": "a3", "to": "a4" },
    { "from": "a4", "to": "a5" },
    { "from": "a5", "to": "a6" },
    { "from": "a6", "to": "end" }
  ]
}
```

**Por que esse few-shot:** ensina sequência linear + 1 gateway exclusivo + 2 raias. Verbo no infinitivo. Raia = setor.

---

## Few-shot #2 — Concessão de Diárias (apostila ESESP — caso central)

**Descrição:**
> O servidor solicita diárias preenchendo o formulário no e-Docs. A chefia imediata avalia e aprova ou rejeita. Se aprovado, o RH calcula o valor e encaminha ao Financeiro. O Financeiro homologa: se o valor for acima de R$ 5.000, precisa de aprovação adicional do Ordenador de Despesas; abaixo, vai direto pra empenho. Após empenho, o sistema dispara pagamento e o servidor é notificado. Se a chefia rejeita, o servidor recebe a notificação de indeferimento e o processo encerra.

**JSON Bravy:**
```json
{
  "version": 1,
  "layout": "LR",
  "pool": "Concessão de Diárias",
  "lanes": ["Servidor", "Chefia Imediata", "RH", "Financeiro"],
  "nodes": [
    { "id": "start", "kind": "startEnd", "label": "Necessidade de viagem", "lane": "Servidor", "bpmn": { "event": "start" } },
    { "id": "a1", "kind": "activity", "lane": "Servidor", "label": "Solicitar diária no e-Docs", "bpmn": { "task": "userTask" } },
    { "id": "a2", "kind": "activity", "lane": "Chefia Imediata", "label": "Avaliar solicitação", "bpmn": { "task": "userTask" } },
    { "id": "g1", "kind": "decision", "lane": "Chefia Imediata", "label": "Solicitação aprovada?", "bpmn": { "gateway": "exclusive" } },
    { "id": "a3", "kind": "activity", "lane": "RH", "label": "Calcular valor da diária", "bpmn": { "task": "userTask" } },
    { "id": "g2", "kind": "decision", "lane": "Financeiro", "label": "Valor acima de R$ 5.000?", "bpmn": { "gateway": "exclusive" } },
    { "id": "a4", "kind": "activity", "lane": "Financeiro", "label": "Aprovar com Ordenador de Despesas", "bpmn": { "task": "userTask" } },
    { "id": "a5", "kind": "automation", "lane": "Financeiro", "label": "Empenhar despesa", "bpmn": { "task": "serviceTask" } },
    { "id": "a6", "kind": "automation", "lane": "Financeiro", "label": "Disparar pagamento", "bpmn": { "task": "serviceTask" } },
    { "id": "a7", "kind": "automation", "lane": "Servidor", "label": "Notificar deferimento", "bpmn": { "task": "sendTask" } },
    { "id": "endOk", "kind": "startEnd", "label": "Diária paga", "lane": "Servidor", "bpmn": { "event": "end" } },
    { "id": "a8", "kind": "automation", "lane": "Servidor", "label": "Notificar indeferimento", "bpmn": { "task": "sendTask" } },
    { "id": "endNok", "kind": "startEnd", "label": "Solicitação indeferida", "lane": "Servidor", "bpmn": { "event": "end" } }
  ],
  "edges": [
    { "from": "start", "to": "a1" },
    { "from": "a1", "to": "a2" },
    { "from": "a2", "to": "g1" },
    { "from": "g1", "to": "a3", "label": "Sim" },
    { "from": "g1", "to": "a8", "label": "Não" },
    { "from": "a3", "to": "g2" },
    { "from": "g2", "to": "a4", "label": "Sim" },
    { "from": "g2", "to": "a5", "label": "Não" },
    { "from": "a4", "to": "a5" },
    { "from": "a5", "to": "a6" },
    { "from": "a6", "to": "a7" },
    { "from": "a7", "to": "endOk" },
    { "from": "a8", "to": "endNok" }
  ]
}
```

**Por que esse few-shot:** caso real gov-BR + 4 raias + 2 gateways aninhados + 2 eventos de fim distintos (sucesso/indeferido) + mistura `userTask` (humana) com `serviceTask`/`sendTask` (`kind: automation`). Vocabulário: "deferir/indeferir", "empenho", "Ordenador de Despesas", "e-Docs".

---

## Few-shot #3 — Multi-pool com Cliente Externo (B2B comercial)

**Descrição:**
> Lead chega via formulário do site. SDR verifica os dados e faz a primeira abordagem. Se o lead responde, o SDR qualifica usando BANT. Se qualificado, agenda reunião com o closer. O closer faz discovery, apresenta a solução e envia proposta. O cliente analisa e aceita ou rejeita. Se aceita, o sistema gera contrato, envia pra assinatura eletrônica e o CS faz kickoff. Se rejeita, o closer trata as objeções e refaz a proposta.

**JSON Bravy:**
```json
{
  "version": 1,
  "layout": "LR",
  "pools": [
    { "id": "empresa", "pool": "Aila — Comercial B2B", "lanes": ["Captação", "Qualificação", "Negociação", "Fechamento", "Onboarding"] },
    { "id": "cliente", "pool": "Cliente (Lead)", "lanes": ["Decisão"] }
  ],
  "nodes": [
    { "id": "start", "kind": "startEnd", "poolId": "empresa", "lane": "Captação", "label": "Lead entra no funil", "bpmn": { "event": "start" } },
    { "id": "a1", "kind": "activity", "poolId": "empresa", "lane": "Captação", "label": "Verificar dados do lead", "bpmn": { "task": "userTask" } },
    { "id": "a2", "kind": "activity", "poolId": "empresa", "lane": "Captação", "label": "Realizar primeira abordagem", "bpmn": { "task": "userTask" } },
    { "id": "a3", "kind": "activity", "poolId": "cliente", "lane": "Decisão", "label": "Responder ao SDR", "bpmn": { "task": "userTask" } },
    { "id": "g1", "kind": "decision", "poolId": "empresa", "lane": "Qualificação", "label": "Lead qualificado?", "bpmn": { "gateway": "exclusive" } },
    { "id": "a4", "kind": "activity", "poolId": "empresa", "lane": "Qualificação", "label": "Qualificar lead via BANT", "bpmn": { "task": "userTask" } },
    { "id": "a5", "kind": "activity", "poolId": "empresa", "lane": "Negociação", "label": "Realizar discovery", "bpmn": { "task": "userTask" } },
    { "id": "a6", "kind": "activity", "poolId": "empresa", "lane": "Negociação", "label": "Apresentar solução", "bpmn": { "task": "userTask" } },
    { "id": "a7", "kind": "activity", "poolId": "empresa", "lane": "Negociação", "label": "Enviar proposta", "bpmn": { "task": "sendTask" } },
    { "id": "a8", "kind": "activity", "poolId": "cliente", "lane": "Decisão", "label": "Avaliar proposta", "bpmn": { "task": "userTask" } },
    { "id": "g2", "kind": "decision", "poolId": "empresa", "lane": "Negociação", "label": "Proposta aceita?", "bpmn": { "gateway": "exclusive" } },
    { "id": "a9", "kind": "activity", "poolId": "empresa", "lane": "Negociação", "label": "Tratar objeções", "bpmn": { "task": "userTask" } },
    { "id": "a10", "kind": "automation", "poolId": "empresa", "lane": "Fechamento", "label": "Gerar contrato", "bpmn": { "task": "serviceTask" } },
    { "id": "a11", "kind": "automation", "poolId": "empresa", "lane": "Fechamento", "label": "Enviar para assinatura eletrônica", "bpmn": { "task": "sendTask" } },
    { "id": "a12", "kind": "activity", "poolId": "empresa", "lane": "Onboarding", "label": "Realizar kickoff com cliente", "bpmn": { "task": "userTask" } },
    { "id": "end", "kind": "startEnd", "poolId": "empresa", "lane": "Onboarding", "label": "Cliente ativo", "bpmn": { "event": "end" } }
  ],
  "edges": [
    { "from": "start", "to": "a1" },
    { "from": "a1", "to": "a2" },
    { "from": "a2", "to": "a3", "label": "mensagem (abordagem)" },
    { "from": "a3", "to": "a4", "label": "mensagem (resposta)" },
    { "from": "a4", "to": "g1" },
    { "from": "g1", "to": "a5", "label": "Sim" },
    { "from": "a5", "to": "a6" },
    { "from": "a6", "to": "a7" },
    { "from": "a7", "to": "a8", "label": "mensagem (proposta)" },
    { "from": "a8", "to": "g2", "label": "mensagem (decisão)" },
    { "from": "g2", "to": "a10", "label": "Sim" },
    { "from": "g2", "to": "a9", "label": "Não" },
    { "from": "a9", "to": "a7" },
    { "from": "a10", "to": "a11" },
    { "from": "a11", "to": "a12" },
    { "from": "a12", "to": "end" }
  ]
}
```

**Por que esse few-shot:** ensina **multi-pool** com fluxo de mensagem entre piscinas. Cliente é ator externo (segunda piscina). Edges com `label` "mensagem (...)" indicam fluxo de mensagem (linha tracejada na UI). Mostra loop de retrabalho (objeções → proposta).

---

## Casos pendentes pra serem expandidos

Os 3 acima cobrem 80% dos padrões. Os 3 abaixo ficam como esqueleto pra completar quando o agente real estiver sendo treinado:

### Few-shot #4 — Censo Bianual de Servidores (timer + loop temporal)
> A cada 2 anos, o sistema dispara o censo. RH gera lista de servidores ativos. Cada servidor tem 30 dias para confirmar dados via portal. Quem não confirmar entra em alerta para chefia regularizar. Quando todos confirmarem ou prazo final encerrar, o RH consolida o relatório e arquiva.
>
> **Padrões:** evento de fim duplo (consolidado / alerta-aberto), gateway com regra temporal.

### Few-shot #5 — Avaliação FADI (gateway paralelo + duas raias com aprovação cruzada)
> Avaliador e Avaliado preenchem formulários FADI em paralelo. Quando ambos terminam, há reunião conjunta. Se há concordância, finaliza. Se há divergência, escala pra comitê.
>
> **Padrões:** `gateway: parallel` (split + join), divergência humana com escalonamento.

### Few-shot #6 — Exoneração de Comissionado (sequência linear)
> Autoridade nomeante emite ato de exoneração. RH formaliza no sistema, calcula verbas rescisórias e encaminha ao Financeiro. Financeiro paga e arquiva.
>
> **Padrões:** baseline mais simples possível — sem gateway, sem multi-pool. Útil pra ensinar agente a NÃO inventar complexidade desnecessária.

---

## Notas pra quem usar esses few-shots

1. **Quantos incluir no system prompt?** No mínimo #1 + #2 + #3 (cobrem sequência simples, gov-BR multi-raia, multi-pool com mensagens). Adicionar #4-#6 se contexto disponível.
2. **Ordem matters.** Coloque do mais simples → mais complexo. LLM aprende incrementalmente.
3. **Tokens.** Cada few-shot acima custa ~600-1200 tokens. Os 3 principais somam ~2.5K — cabe folgado em contexto Sonnet 4.6.
4. **Evolução.** Esse arquivo é vivo. Quando descobrir caso novo no agente em produção que ele errou, adicione o caso corrigido aqui como few-shot #N+1.
