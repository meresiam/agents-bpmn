# API Publica — Bravy BPMN

## Autenticacao

Todos os endpoints da API publica usam autenticacao via header `X-API-Key`.

```
X-API-Key: bravy-bpmn-api-key-2026
```

Base URL: `http://localhost:3001/api/v1`

---

## Endpoints

### Listar processos de um cliente

```
GET /api/v1/public/processes?tenantId={tenantId}
```

**Exemplo:**
```bash
curl -H "X-API-Key: bravy-bpmn-api-key-2026" \
  "http://localhost:3001/api/v1/public/processes?tenantId=maturi"
```

---

### Buscar um processo por ID

```
GET /api/v1/public/processes/{id}
```

---

### Criar um novo fluxo

```
POST /api/v1/public/processes
Content-Type: application/json
X-API-Key: bravy-bpmn-api-key-2026
```

**Body:**
```json
{
  "tenantId": "nome-do-cliente",
  "slug": "slug-unico-do-processo",
  "title": "Titulo do Processo",
  "description": "Descricao opcional",
  "category": "COMERCIAL",
  "graph": {
    "version": 1,
    "layout": "LR",
    "pool": "Nome da Piscina",
    "lanes": ["Raia 1", "Raia 2"],
    "nodes": [],
    "edges": []
  }
}
```

**Categorias disponiveis:**
`COMERCIAL` | `MARKETING` | `FINANCEIRO` | `OPERACOES` | `RH` | `ATENDIMENTO` | `ONBOARDING` | `LOGISTICA` | `JURIDICO` | `TI` | `OUTRO`

---

### Atualizar um fluxo

```
PATCH /api/v1/public/processes/{id}
```

**Body (parcial):**
```json
{
  "title": "Novo titulo",
  "graph": { ... }
}
```

---

### Deletar um fluxo

```
DELETE /api/v1/public/processes/{id}
```

---

## Estrutura do Graph (ProcessGraphJson)

O campo `graph` e o JSON que define o diagrama BPMN. Existem dois modos:

### Modo simples (1 pool)

```json
{
  "version": 1,
  "layout": "LR",
  "pool": "Nome da Piscina",
  "lanes": ["Raia 1", "Raia 2", "Raia 3"],
  "nodes": [...],
  "edges": [...]
}
```

### Modo multi-pool (2+ pools)

```json
{
  "version": 1,
  "layout": "LR",
  "pools": [
    { "id": "pool1", "pool": "Pool 1 — Titulo", "lanes": ["Raia A", "Raia B"] },
    { "id": "pool2", "pool": "Pool 2 — Titulo", "lanes": ["Raia C", "Raia D"] }
  ],
  "nodes": [...],
  "edges": [...]
}
```

### Nodes

Cada node tem:

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | string | sim | ID unico do node |
| `kind` | string | sim | `activity`, `decision`, `startEnd`, `automation` |
| `label` | string | sim | Texto exibido no node (suporta `\n` para quebra de linha) |
| `lane` | string | sim* | Nome da raia (deve existir em `lanes` ou nas lanes do pool) |
| `poolId` | string | sim** | ID do pool (obrigatorio quando usa `pools`) |
| `bpmn` | object | nao | Semantica BPMN (ver abaixo) |

*No modo simples, pode usar `phase` em vez de `lane`.
**Obrigatorio apenas no modo multi-pool.

### BPMN Semantics

```json
// Evento de inicio
{ "bpmn": { "event": "start" } }

// Evento de fim
{ "bpmn": { "event": "end" } }

// Gateway exclusivo (XOR — losango com X)
{ "bpmn": { "gateway": "exclusive" } }

// Gateway paralelo (AND — losango com +)
{ "bpmn": { "gateway": "parallel" } }

// Gateway inclusivo (OR — losango com O)
{ "bpmn": { "gateway": "inclusive" } }

// User Task (tarefa manual — icone de pessoa)
{ "bpmn": { "task": "userTask" } }

// Service Task (automacao — icone de engrenagem)
{ "bpmn": { "task": "serviceTask" } }

// Manual Task
{ "bpmn": { "task": "manualTask" } }

// Send Task
{ "bpmn": { "task": "sendTask" } }

// Receive Task
{ "bpmn": { "task": "receiveTask" } }

// Script Task
{ "bpmn": { "task": "scriptTask" } }
```

### Edges

Cada edge conecta dois nodes:

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `from` | string | sim | ID do node de origem |
| `to` | string | sim | ID do node de destino |
| `label` | string | nao | Rotulo da seta (ex: "Sim", "Nao", "Aceite") |

---

## Exemplo completo: Criar um processo comercial

```bash
curl -X POST http://localhost:3001/api/v1/public/processes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bravy-bpmn-api-key-2026" \
  -d '{
  "tenantId": "acme",
  "slug": "comercial",
  "title": "Processo Comercial — ACME",
  "description": "Fluxo de vendas B2B",
  "category": "COMERCIAL",
  "graph": {
    "version": 1,
    "layout": "LR",
    "pool": "ACME — Comercial",
    "lanes": ["Captacao", "Qualificacao", "Fechamento"],
    "nodes": [
      { "id": "start", "kind": "startEnd", "label": "Lead entra", "lane": "Captacao", "bpmn": { "event": "start" } },
      { "id": "a1", "kind": "activity", "label": "Verificar dados do lead", "lane": "Captacao", "bpmn": { "task": "userTask" } },
      { "id": "a2", "kind": "activity", "label": "Primeira abordagem (SDR)", "lane": "Captacao", "bpmn": { "task": "userTask" } },
      { "id": "gw1", "kind": "decision", "label": "Respondeu?", "lane": "Captacao", "bpmn": { "gateway": "exclusive" } },
      { "id": "auto1", "kind": "automation", "label": "Disparar follow-up automatico", "lane": "Captacao", "bpmn": { "task": "serviceTask" } },
      { "id": "a3", "kind": "activity", "label": "Qualificar lead (BANT)", "lane": "Qualificacao", "bpmn": { "task": "userTask" } },
      { "id": "gw2", "kind": "decision", "label": "Qualificado?", "lane": "Qualificacao", "bpmn": { "gateway": "exclusive" } },
      { "id": "a4", "kind": "activity", "label": "Enviar proposta", "lane": "Fechamento", "bpmn": { "task": "userTask" } },
      { "id": "end_ok", "kind": "startEnd", "label": "Cliente ativo", "lane": "Fechamento", "bpmn": { "event": "end" } },
      { "id": "end_lost", "kind": "startEnd", "label": "Lead perdido", "lane": "Qualificacao", "bpmn": { "event": "end" } }
    ],
    "edges": [
      { "from": "start", "to": "a1" },
      { "from": "a1", "to": "a2" },
      { "from": "a2", "to": "gw1" },
      { "from": "gw1", "to": "a3", "label": "Sim" },
      { "from": "gw1", "to": "auto1", "label": "Nao" },
      { "from": "auto1", "to": "a2" },
      { "from": "a3", "to": "gw2" },
      { "from": "gw2", "to": "a4", "label": "Sim" },
      { "from": "gw2", "to": "end_lost", "label": "Nao" },
      { "from": "a4", "to": "end_ok" }
    ]
  }
}'
```

**Resultado:** O processo fica acessivel em `http://localhost:3000/share/{id}` (URL publica, sem login).

---

## Instrucoes para LLM (Claude Code)

Ao criar fluxos BPMN via API:

1. **Sempre defina `tenantId`** — e o identificador do cliente (ex: "acme", "maturi", "arw")
2. **Slug deve ser unico por tenant** — use kebab-case (ex: "comercial", "onboarding", "marketing")
3. **IDs de nodes devem ser unicos** dentro do graph
4. **Toda edge referencia nodes existentes** — `from` e `to` devem ser IDs de nodes
5. **Nodes de `startEnd` precisam de `bpmn.event`** — `"start"` ou `"end"`
6. **Nodes de `decision` precisam de `bpmn.gateway`** — geralmente `"exclusive"`
7. **Nodes de `automation` representam automacoes** (n8n, Brevo, Zappfy) — use `bpmn.task: "serviceTask"`
8. **Nodes de `activity` representam tarefas humanas** — use `bpmn.task: "userTask"` ou `"manualTask"`
9. **Use `\n` no label** para quebrar linhas longas
10. **Edges com `label`** sao usadas em saidas de gateways (ex: "Sim", "Nao", "Aceite", "Objecao")
11. **No modo multi-pool**, todo node deve ter `poolId` apontando para um `pools[].id`
12. **Apos criar**, o fluxo ja fica visivel no frontend (login do cliente ou URL publica)
