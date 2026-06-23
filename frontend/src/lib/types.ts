import { Node, Edge } from 'reactflow';

// Re-export all shared types
export type {
  BpmnNodeType,
  BpmnGatewayKind,
  BpmnTaskKind,
  BpmnEventKind,
  BpmnSemantic,
  ActorType,
  ProcessGraphNodeJson,
  ProcessGraphPoolSectionJson,
  ProcessGraphEdgeJson,
  ProcessGraphJson,
  ProcessDefinition,
} from '@/types/process.types';
export { formatProcessGraphPoolLabel } from '@/types/process.types';

import type { BpmnNodeType, BpmnSemantic, ActorType } from '@/types/process.types';

export interface BpmnNodeData {
  label: string;
  actor: ActorType;
  phase?: string;
  /** Raia BPMN (deve existir em graph.lanes ou nas lanes do pool); se vazio, usa phase ou primeira raia */
  lane?: string;
  /** Presente no modo `graph.pools` — usado pelo layout multi-piscina */
  poolId?: string;
  nodeType: BpmnNodeType;
  icon?: string;
  bpmn?: BpmnSemantic;
  /** Índice da raia resolvida (injetado pelo layout swimlane). */
  laneIndex?: number;
  /** Cor de acento da raia — borda/ícone/traço (injetado pelo layout swimlane). */
  accent?: string;
}

export interface BpmnGroupData {
  label: string;
  nodeType: 'group';
}

/** Nó sintético: desenha piscina + raias (fundo do diagrama) */
export interface BpmnPoolNodeData {
  nodeType: 'bpmnPool';
  poolName: string;
  lanes: string[];
  /** @deprecated use laneHeights */
  laneHeight?: number;
  /** Altura individual de cada raia (mesmo índice de `lanes`) */
  laneHeights: number[];
  poolNameCol: number;
  laneLabelCol: number;
  contentPaddingTop: number;
  poolWidth: number;
  poolHeight: number;
  /** Tema (cor + ícone) por raia, mesmo índice de `lanes` (injetado pelo layout swimlane). */
  laneThemes?: { stroke: string; tint: string; labelBg: string; iconKey: string }[];
}

export type BpmnNode = Node<BpmnNodeData | BpmnGroupData | BpmnPoolNodeData>;
export type BpmnEdge = Edge & { data?: { label?: string; crossPool?: boolean } };
