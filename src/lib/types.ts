import { Node, Edge } from 'reactflow';

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

export interface BpmnNodeData {
  label: string;
  actor: ActorType;
  phase?: string;
  /** Raia BPMN (deve existir em graph.lanes); se vazio, usa phase ou primeira raia */
  lane?: string;
  nodeType: BpmnNodeType;
  icon?: string;
  bpmn?: BpmnSemantic;
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
  laneHeight: number;
  poolNameCol: number;
  laneLabelCol: number;
  contentPaddingTop: number;
  poolWidth: number;
  poolHeight: number;
}

export type BpmnNode = Node<BpmnNodeData | BpmnGroupData | BpmnPoolNodeData>;
export type BpmnEdge = Edge & { data?: { label?: string } };

export interface ProcessGraphNodeJson {
  id: string;
  kind: BpmnNodeType;
  label: string;
  phase?: string;
  /** Nome da raia BPMN (deve constar em graph.lanes) */
  lane?: string;
  bpmn?: BpmnSemantic;
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
  /** Nome da piscina (participante / processo) */
  pool?: string;
  /**
   * Raias na ordem vertical (de cima para baixo).
   * Quando presente, o layout usa piscina + raias BPMN 2.0.
   */
  lanes?: string[];
  nodes: ProcessGraphNodeJson[];
  edges: ProcessGraphEdgeJson[];
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
