import {
  BpmnNode,
  BpmnEdge,
  BpmnNodeData,
  BpmnGroupData,
  BpmnNodeType,
  ProcessGraphJson,
  BpmnGatewayKind,
  BpmnTaskKind,
  BpmnEventKind,
} from './types';
import { getActorFromLabel } from './actor-from-label';
import { mergeBpmnSemantic } from './bpmn-infer';

const KIND_TO_RF_TYPE: Record<BpmnNodeType, BpmnNode['type']> = {
  activity: 'activity',
  decision: 'decision',
  startEnd: 'startEnd',
  automation: 'automation',
  group: 'group',
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const VALID_KINDS: BpmnNodeType[] = ['activity', 'decision', 'startEnd', 'automation', 'group'];
const VALID_GATEWAYS: BpmnGatewayKind[] = ['exclusive', 'parallel', 'inclusive'];
const VALID_TASKS: BpmnTaskKind[] = [
  'task',
  'userTask',
  'serviceTask',
  'scriptTask',
  'manualTask',
  'sendTask',
  'receiveTask',
];
const VALID_EVENTS: BpmnEventKind[] = ['start', 'end'];

function validateBpmnField(i: number, bpmn: Record<string, unknown>): void {
  if (bpmn.gateway !== undefined) {
    if (typeof bpmn.gateway !== 'string' || !VALID_GATEWAYS.includes(bpmn.gateway as BpmnGatewayKind)) {
      throw new Error(`nodes[${i}].bpmn.gateway deve ser: ${VALID_GATEWAYS.join(', ')}.`);
    }
  }
  if (bpmn.task !== undefined) {
    if (typeof bpmn.task !== 'string' || !VALID_TASKS.includes(bpmn.task as BpmnTaskKind)) {
      throw new Error(`nodes[${i}].bpmn.task deve ser: ${VALID_TASKS.join(', ')}.`);
    }
  }
  if (bpmn.event !== undefined) {
    if (typeof bpmn.event !== 'string' || !VALID_EVENTS.includes(bpmn.event as BpmnEventKind)) {
      throw new Error(`nodes[${i}].bpmn.event deve ser: ${VALID_EVENTS.join(', ')}.`);
    }
  }
}

export function parseProcessGraphJsonString(jsonText: string): ProcessGraphJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('JSON inválido: não foi possível fazer o parse.');
  }
  return validateProcessGraph(parsed);
}

export function validateProcessGraph(data: unknown): ProcessGraphJson {
  if (!isRecord(data)) throw new Error('O documento raiz deve ser um objeto.');

  const nodesRaw = data.nodes;
  const edgesRaw = data.edges;
  if (!Array.isArray(nodesRaw) || nodesRaw.length === 0) {
    throw new Error('É obrigatório o array "nodes" com pelo menos um nó.');
  }
  if (!Array.isArray(edgesRaw)) {
    throw new Error('É obrigatório o array "edges".');
  }

  if (data.pool !== undefined && typeof data.pool !== 'string') {
    throw new Error('pool deve ser string, se informado.');
  }

  const ids = new Set<string>();

  for (let i = 0; i < nodesRaw.length; i++) {
    const n = nodesRaw[i];
    if (!isRecord(n)) throw new Error(`nodes[${i}] deve ser um objeto.`);
    const id = n.id;
    const kind = n.kind;
    const label = n.label;
    if (typeof id !== 'string' || !id.trim()) throw new Error(`nodes[${i}].id deve ser uma string não vazia.`);
    if (ids.has(id)) throw new Error(`ID duplicado: "${id}".`);
    ids.add(id);
    if (typeof kind !== 'string' || !VALID_KINDS.includes(kind as BpmnNodeType)) {
      throw new Error(`nodes[${i}].kind inválido. Use: ${VALID_KINDS.join(', ')}.`);
    }
    if (typeof label !== 'string') throw new Error(`nodes[${i}].label deve ser string.`);
    if (n.phase !== undefined && typeof n.phase !== 'string') {
      throw new Error(`nodes[${i}].phase deve ser string, se existir.`);
    }
    if (n.lane !== undefined && typeof n.lane !== 'string') {
      throw new Error(`nodes[${i}].lane deve ser string, se existir.`);
    }
    if (n.bpmn !== undefined) {
      if (!isRecord(n.bpmn)) throw new Error(`nodes[${i}].bpmn deve ser um objeto.`);
      validateBpmnField(i, n.bpmn);
    }
  }

  for (let i = 0; i < edgesRaw.length; i++) {
    const e = edgesRaw[i];
    if (!isRecord(e)) throw new Error(`edges[${i}] deve ser um objeto.`);
    const from = e.from;
    const to = e.to;
    if (typeof from !== 'string' || !ids.has(from)) {
      throw new Error(`edges[${i}].from deve referenciar um id existente em nodes (recebido: "${String(from)}").`);
    }
    if (typeof to !== 'string' || !ids.has(to)) {
      throw new Error(`edges[${i}].to deve referenciar um id existente em nodes (recebido: "${String(to)}").`);
    }
    if (e.label !== undefined && typeof e.label !== 'string') {
      throw new Error(`edges[${i}].label deve ser string, se existir.`);
    }
    if (e.id !== undefined && typeof e.id !== 'string') {
      throw new Error(`edges[${i}].id deve ser string, se existir.`);
    }
  }

  const layout = data.layout;
  if (layout !== undefined && layout !== 'LR' && layout !== 'TB') {
    throw new Error('layout deve ser "LR" ou "TB", se informado.');
  }

  const lanesRaw = data.lanes;
  if (lanesRaw !== undefined) {
    if (!Array.isArray(lanesRaw) || lanesRaw.length === 0) {
      throw new Error('lanes deve ser um array não vazio de strings.');
    }
    const lanesArr: string[] = [];
    for (let j = 0; j < lanesRaw.length; j++) {
      const item = lanesRaw[j];
      if (typeof item !== 'string' || !item.trim()) {
        throw new Error(`lanes[${j}] deve ser string não vazia.`);
      }
      lanesArr.push(item);
    }
    for (let i = 0; i < nodesRaw.length; i++) {
      const n = nodesRaw[i];
      if (!isRecord(n)) continue;
      if (n.kind === 'group') continue;
      const lane = n.lane;
      const phase = n.phase;
      const key =
        typeof lane === 'string' && lane.trim()
          ? lane
          : typeof phase === 'string' && phase.trim()
            ? phase
            : '';
      if (!key) {
        throw new Error(
          `nodes[${i}]: com "lanes" definido no grafo, informe "lane" ou "phase" para posicionar o nó na raia.`
        );
      }
      if (!lanesArr.includes(key)) {
        throw new Error(`nodes[${i}]: lane/phase "${key}" não consta em lanes.`);
      }
    }
  }

  return data as unknown as ProcessGraphJson;
}

export function graphToReactFlow(graph: ProcessGraphJson): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const nodes: BpmnNode[] = graph.nodes.map((n) => {
    const rfType = KIND_TO_RF_TYPE[n.kind];
    if (n.kind === 'group') {
      const data: BpmnGroupData = { label: n.label, nodeType: 'group' };
      return {
        id: n.id,
        type: rfType,
        position: { x: 0, y: 0 },
        data,
      };
    }
    const mergedBpmn = mergeBpmnSemantic(n);
    const data: BpmnNodeData = {
      label: n.label,
      actor: getActorFromLabel(n.label),
      phase: n.phase,
      lane: n.lane,
      nodeType: n.kind,
      bpmn: mergedBpmn,
    };
    return {
      id: n.id,
      type: rfType,
      position: { x: 0, y: 0 },
      data,
    };
  });

  const edges: BpmnEdge[] = graph.edges.map((e, idx) => ({
    id: e.id ?? `e-${e.from}-${e.to}-${idx}`,
    source: e.from,
    target: e.to,
    label: e.label,
    type: 'smoothstep',
  }));

  return { nodes, edges };
}

export function parseProcessGraph(graph: ProcessGraphJson): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  validateProcessGraph(graph);
  return graphToReactFlow(graph);
}
