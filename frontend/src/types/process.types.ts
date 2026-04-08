export type BpmnNodeType = 'activity' | 'decision' | 'startEnd' | 'automation' | 'group';

/** BPMN 2.0 — tipo de gateway (losango) */
export type BpmnGatewayKind = 'exclusive' | 'parallel' | 'inclusive';

/** BPMN 2.0 — tipo de tarefa (retângulo arredondado) */
export type BpmnTaskKind =
  | 'task'
  | 'userTask'
  | 'serviceTask'
  | 'scriptTask'
  | 'manualTask'
  | 'sendTask'
  | 'receiveTask';

/** BPMN 2.0 — evento de início ou fim (círculo) */
export type BpmnEventKind = 'start' | 'end';

/** Metadados opcionais alinhados à notação BPMN 2.0 */
export interface BpmnSemantic {
  gateway?: BpmnGatewayKind;
  task?: BpmnTaskKind;
  event?: BpmnEventKind;
}

export type ActorType =
  | 'sdr'
  | 'closer'
  | 'automacao'
  | 'cs'
  | 'financeiro'
  | 'operacoes'
  | 'cliente'
  | 'gestor'
  | 'marketing'
  | 'default';

export interface ProcessGraphNodeJson {
  id: string;
  kind: BpmnNodeType;
  label: string;
  phase?: string;
  /** Nome da raia BPMN (deve constar em graph.lanes ou nas lanes do pool em `graph.pools`) */
  lane?: string;
  /**
   * Quando `graph.pools` está definido, identifica a piscina deste nó (deve coincidir com `pools[].id`).
   */
  poolId?: string;
  bpmn?: BpmnSemantic;
}

/** Metadados de uma piscina no modo multi-pool (`graph.pools`). */
export interface ProcessGraphPoolSectionJson {
  id: string;
  pool: string;
  lanes: string[];
}

export interface ProcessGraphEdgeJson {
  from: string;
  to: string;
  label?: string;
  id?: string;
}

export interface ProcessGraphJson {
  version?: number;
  layout?: 'LR' | 'TB';
  /** Nome exibido / legado: piscina única quando `pools` não é usado */
  pool?: string;
  /**
   * Raias na ordem vertical (de cima para baixo).
   * Modo legado: uma piscina; use junto com `pool`.
   */
  lanes?: string[];
  /**
   * Várias piscinas no mesmo diagrama (empilhadas). Cada nó em `nodes` deve ter `poolId`
   * referenciando um `id` desta lista. Arestas podem ligar nós de piscinas diferentes.
   */
  pools?: ProcessGraphPoolSectionJson[];
  nodes: ProcessGraphNodeJson[];
  edges: ProcessGraphEdgeJson[];
}

/** Rótulo de pool(s) para UI (legenda do diagrama). */
export function formatProcessGraphPoolLabel(graph: ProcessGraphJson): string | undefined {
  if (graph.pools && graph.pools.length > 0) {
    return graph.pools.map((p) => p.pool).join(' · ');
  }
  return graph.pool?.trim() || undefined;
}

export interface ProcessDefinition {
  id: string;
  client: string;
  process: string;
  title: string;
  graph: ProcessGraphJson;
  description?: string;
  updatedAt?: string;
}
