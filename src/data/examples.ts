import { ProcessDefinition } from '@/lib/types';
import { ARW_COMERCIAL_GRAPH } from './graphs/arw-comercial';

export const EXAMPLE_PROCESSES: ProcessDefinition[] = [
  {
    id: 'arw-comercial',
    client: 'arw',
    process: 'comercial',
    title: 'Processo Comercial',
    description: 'Fluxo completo de vendas: captação → qualificação → negociação → fechamento → onboarding (BPMN 2.0)',
    updatedAt: '2025-01-15',
    graph: ARW_COMERCIAL_GRAPH,
  },
  {
    id: 'arw-suporte',
    client: 'arw',
    process: 'suporte',
    title: 'Processo de Suporte',
    description: 'Atendimento: triagem → resolução → encerramento (BPMN 2.0)',
    updatedAt: '2025-01-10',
    graph: {
      version: 1,
      layout: 'LR',
      pool: 'ARW — Suporte ao cliente',
      lanes: ['Triagem', 'Atendimento', 'Resolução', 'Escalação', 'Encerramento'],
      nodes: [
        { id: 'Start', kind: 'startEnd', label: 'Ticket aberto', lane: 'Triagem', bpmn: { event: 'start' } },
        { id: 'A', kind: 'activity', phase: 'Triagem', label: 'Classificar e rotear ticket', bpmn: { task: 'userTask' } },
        { id: 'B', kind: 'decision', label: 'Prioridade?', lane: 'Triagem', bpmn: { gateway: 'exclusive' } },
        { id: 'C', kind: 'activity', phase: 'Atendimento', label: 'Atender imediatamente', bpmn: { task: 'userTask' } },
        { id: 'D', kind: 'activity', phase: 'Atendimento', label: 'Responder em até 4h', bpmn: { task: 'userTask' } },
        { id: 'E', kind: 'activity', phase: 'Atendimento', label: 'Responder em até 24h', bpmn: { task: 'userTask' } },
        { id: 'F', kind: 'activity', phase: 'Resolução', label: 'Diagnosticar problema', bpmn: { task: 'userTask' } },
        { id: 'G', kind: 'decision', label: 'Resolvido?', lane: 'Resolução', bpmn: { gateway: 'exclusive' } },
        { id: 'H', kind: 'activity', phase: 'Encerramento', label: 'Documentar solução na base', bpmn: { task: 'userTask' } },
        { id: 'I', kind: 'automation', phase: 'Encerramento', label: 'Enviar pesquisa NPS', bpmn: { task: 'sendTask' } },
        { id: 'End', kind: 'startEnd', label: 'Fim — ticket fechado', lane: 'Encerramento', bpmn: { event: 'end' } },
        { id: 'J', kind: 'activity', phase: 'Escalação', label: 'Escalar para gestor', bpmn: { task: 'userTask' } },
        { id: 'K', kind: 'activity', phase: 'Escalação', label: 'Analisar caso', bpmn: { task: 'userTask' } },
      ],
      edges: [
        { from: 'Start', to: 'A' },
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C', label: 'Alta' },
        { from: 'B', to: 'D', label: 'Média' },
        { from: 'B', to: 'E', label: 'Baixa' },
        { from: 'C', to: 'F' },
        { from: 'D', to: 'F' },
        { from: 'E', to: 'F' },
        { from: 'F', to: 'G' },
        { from: 'G', to: 'H', label: 'Sim' },
        { from: 'H', to: 'I' },
        { from: 'I', to: 'End' },
        { from: 'G', to: 'J', label: 'Não' },
        { from: 'J', to: 'K' },
        { from: 'K', to: 'F' },
      ],
    },
  },
  {
    id: 'bravy-inscricao',
    client: 'bravy',
    process: 'inscricao-eventos',
    title: 'Processo de Inscrição em Eventos',
    description: 'Inscrição, aprovação e viagem corporativa (BPMN 2.0)',
    updatedAt: '2025-01-20',
    graph: {
      version: 1,
      layout: 'LR',
      pool: 'Bravy — Inscrição em eventos',
      lanes: ['Participante', 'Gestor', 'RH', 'Viagens'],
      nodes: [
        { id: 'Start', kind: 'startEnd', label: 'Solicitação recebida', lane: 'Participante', bpmn: { event: 'start' } },
        { id: 'A', kind: 'activity', phase: 'Participante', label: 'Solicitar inscrição em evento', bpmn: { task: 'userTask' } },
        { id: 'B', kind: 'activity', phase: 'Gestor', label: 'Avaliar inscrição', bpmn: { task: 'userTask' } },
        { id: 'C', kind: 'decision', label: 'Resultado da avaliação', lane: 'Gestor', bpmn: { gateway: 'exclusive' } },
        { id: 'D', kind: 'activity', phase: 'Gestor', label: 'Avaliar rejeição / retorno', bpmn: { task: 'userTask' } },
        { id: 'E', kind: 'activity', phase: 'RH', label: 'Providenciar inscrição', bpmn: { task: 'userTask' } },
        { id: 'End1', kind: 'startEnd', label: 'Fim — desistência', lane: 'Participante', bpmn: { event: 'end' } },
        { id: 'F', kind: 'activity', phase: 'Participante', label: 'Receber comunicação', bpmn: { task: 'receiveTask' } },
        { id: 'G', kind: 'decision', label: 'Evento requer viagem?', lane: 'Participante', bpmn: { gateway: 'exclusive' } },
        { id: 'H', kind: 'activity', phase: 'Participante', label: 'Participação aprovada', bpmn: { task: 'userTask' } },
        { id: 'End2', kind: 'startEnd', label: 'Fim', lane: 'Participante', bpmn: { event: 'end' } },
        { id: 'I', kind: 'activity', phase: 'Viagens', label: 'Acionar processo de viagens', bpmn: { task: 'sendTask' } },
        { id: 'End3', kind: 'startEnd', label: 'Fim — viagem', lane: 'Viagens', bpmn: { event: 'end' } },
      ],
      edges: [
        { from: 'Start', to: 'A' },
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'D', label: 'Rejeitado' },
        { from: 'C', to: 'E', label: 'Aprovado' },
        { from: 'C', to: 'End1', label: 'Desistência' },
        { from: 'D', to: 'C' },
        { from: 'E', to: 'F' },
        { from: 'F', to: 'G' },
        { from: 'G', to: 'H', label: 'Não' },
        { from: 'H', to: 'End2' },
        { from: 'G', to: 'I', label: 'Sim' },
        { from: 'I', to: 'End3' },
      ],
    },
  },
];

export function getProcess(client: string, process: string): ProcessDefinition | undefined {
  return EXAMPLE_PROCESSES.find(
    (p) => p.client.toLowerCase() === client.toLowerCase() && p.process.toLowerCase() === process.toLowerCase()
  );
}

export function getClientProcesses(client: string): ProcessDefinition[] {
  return EXAMPLE_PROCESSES.filter((p) => p.client.toLowerCase() === client.toLowerCase());
}
