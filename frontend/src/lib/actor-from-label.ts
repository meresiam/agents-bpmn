import { ActorType } from './types';

export function getActorFromLabel(label: string): ActorType {
  const lower = label.toLowerCase();
  const actorMap: [string[], ActorType][] = [
    [['sdr'], 'sdr'],
    [['closer', 'vendedor', 'vendas'], 'closer'],
    [['auto', '⚡', '🤖', 'automação', 'automacao', 'sistema', 'n8n', 'webhook'], 'automacao'],
    [['cs', 'sucesso', 'customer success'], 'cs'],
    [['financeiro', 'financ', 'cobrança', 'faturamento'], 'financeiro'],
    [['operações', 'operacoes', 'operação', 'ops'], 'operacoes'],
    [['cliente'], 'cliente'],
    [['gestor', 'gerente', 'diretor', 'líder', 'lider'], 'gestor'],
    [['marketing', 'mkt'], 'marketing'],
  ];
  for (const [keywords, actor] of actorMap) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return actor;
    }
  }
  const colonMatch = label.match(/^([^:]+):/);
  if (colonMatch) {
    const prefix = colonMatch[1].trim().toLowerCase();
    for (const [keywords, actor] of actorMap) {
      for (const kw of keywords) {
        if (prefix.includes(kw)) return actor;
      }
    }
  }
  return 'default';
}
