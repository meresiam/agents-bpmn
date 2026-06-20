import type { Gap } from '@/services/chat.service';

/**
 * Epic 4.C.1 — "Sugerir TO-BE".
 * Prompt de otimização passado ao motor LLM em modo `edit` com o grafo AS-IS como base.
 * Reusa o `generate-graph-stream` existente (sem motor novo): instrui a derivar a versão
 * TO-BE aplicando lentes de processo enxuto e materializando os ganchos de automação/IA da AILA.
 */
export const SUGGEST_TO_BE_PROMPT = [
  'Gere a versão TO-BE (otimizada) deste processo, partindo do fluxo atual como AS-IS.',
  'Aplique lentes de processo enxuto (lean):',
  '- Elimine gargalos, retrabalho, esperas e handoffs desnecessários entre raias.',
  '- Automatize etapas manuais repetitivas e determinísticas: adicione nós kind "automation" nomeando a ferramenta (ex: "Webhook n8n", "Integração n8n", "Disparo automático").',
  '- Onde o ponto for de linguagem, triagem, classificação, extração de documento ou atendimento conversacional (julgamento), adicione um nó kind "automation" com um agente de IA da AILA (ex: "Agente IA AILA — triagem", "Agente IA AILA — qualificação").',
  '- Reordene e padronize as decisões; mantenha o fluxo coerente, executável, com 1 início e fim(s) claros.',
  'Preserve os papéis/lanes do negócio quando fizerem sentido. Não invente etapas que não existem no processo real.',
].join('\n');

/** Sugestões rápidas (chips) orientadas a TO-BE — substituem as de edição pontual. */
export const TO_BE_HINTS = [
  'Automatize as etapas manuais com n8n onde a regra for determinística',
  'Adicione um agente de IA da AILA para triagem/qualificação no início',
  'Elimine o gargalo de aprovação única paralelizando a decisão',
  'Reduza os handoffs entre raias agrupando etapas do mesmo responsável',
];

/**
 * Epic 4.C.2 — "aplicar gap no TO-BE" com gancho AILA.
 * Constrói o prompt de edição a partir de um gap da análise (4.B). Quando a abordagem
 * sugerida é AUTOMACAO ou IA, instrui explicitamente a inserir um nó `automation` nomeando
 * a ferramenta (n8n para regra determinística, agente de IA da AILA para julgamento) — o
 * gancho de upsell pro ecossistema de agentes da AILA. Para PROCESSO/PESSOAS, mantém a
 * recomendação direta (sem forçar automação onde não precisa).
 */
export function buildGapEditPrompt(gap: Gap): string {
  const onde = gap.localizacao ? ` no ponto "${gap.localizacao}"` : '';
  const detalhe = [gap.recomendacao, gap.solucao.descricao]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' — ');

  switch (gap.solucao.abordagem) {
    case 'AUTOMACAO':
      return [
        `Resolva o gap "${gap.titulo}"${onde} adicionando um nó de automação (kind "automation")`,
        'com a ferramenta n8n / webhook — é regra determinística, não precisa de IA.',
        detalhe && `Contexto: ${detalhe}.`,
      ]
        .filter(Boolean)
        .join(' ');
    case 'IA':
      return [
        `Resolva o gap "${gap.titulo}"${onde} adicionando um nó de automação (kind "automation")`,
        'com um agente de IA da AILA (ex: "Agente IA AILA — ...") responsável pela tarefa de',
        'linguagem/julgamento descrita.',
        detalhe && `Contexto: ${detalhe}.`,
      ]
        .filter(Boolean)
        .join(' ');
    default:
      // PROCESSO / PESSOAS — redesenho ou capacitação, sem inserir automação à força.
      return detalhe || gap.titulo;
  }
}
