import dagre from '@dagrejs/dagre';
import { BpmnNode, BpmnEdge, BpmnNodeData, BpmnPoolNodeData } from './types';
import { nodeDimensions } from './layout-metrics';

const POOL_NAME_COL = 44;
const LANE_LABEL_COL = 118;
/** Onde o fluxo (nós) começa em X, à direita do título do pool e dos nomes das raias */
export const SWIMLANE_CONTENT_OFFSET_X = POOL_NAME_COL + LANE_LABEL_COL;
const CONTENT_PADDING_TOP = 16;
const LANE_HEIGHT = 178;
const BOTTOM_PADDING = 24;
const RIGHT_PADDING = 56;

function isContentNode(n: BpmnNode): n is BpmnNode & { data: BpmnNodeData } {
  return n.type !== 'bpmnPool' && n.type !== 'group';
}

function resolveLane(data: BpmnNodeData, lanes: string[]): string {
  const key = data.lane ?? data.phase;
  if (key && lanes.includes(key)) return key;
  if (key && !lanes.includes(key)) return lanes[0] ?? 'Geral';
  return lanes[0] ?? 'Geral';
}

/**
 * Layout BPMN 2.0: pool + raias horizontais.
 * X vem do dagre (LR); dentro de cada raia, preserva o Y relativo do dagre (ramos paralelos)
 * e aplica um passe para garantir espaçamento horizontal mínimo entre nós.
 */
export function getSwimlaneLayoutedElements(
  nodes: BpmnNode[],
  edges: BpmnEdge[],
  options: {
    poolName: string;
    lanes: string[];
    direction?: 'LR' | 'TB';
  }
): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const { poolName, lanes, direction = 'LR' } = options;
  if (lanes.length === 0) {
    throw new Error('swimlane: informe ao menos uma raia em graph.lanes');
  }

  const contentNodes = nodes.filter(isContentNode);
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 56,
    ranksep: 88,
    edgesep: 28,
    marginx: 24,
    marginy: 24,
  });

  for (const node of contentNodes) {
    const t = node.type || 'activity';
    const { w, h } = nodeDimensions(t);
    dagreGraph.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(dagreGraph);

  type LaneItem = {
    node: BpmnNode;
    laneIndex: number;
    x: number;
    dagreYCenter: number;
    w: number;
    h: number;
  };

  let minX = Infinity;
  const laneItems: LaneItem[] = contentNodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    const t = node.type || 'activity';
    const { w, h } = nodeDimensions(t);
    const x = pos.x - w / 2;
    minX = Math.min(minX, x);
    const d = node.data as BpmnNodeData;
    const laneName = resolveLane(d, lanes);
    const laneIndex = Math.max(0, lanes.indexOf(laneName));
    return {
      node,
      laneIndex,
      x,
      dagreYCenter: pos.y,
      w,
      h,
    };
  });

  const shiftX = SWIMLANE_CONTENT_OFFSET_X - (Number.isFinite(minX) ? minX : 0);
  for (const item of laneItems) {
    item.x += shiftX;
  }

  const LANE_VERT_PAD = 10;
  const byLane = new Map<number, LaneItem[]>();
  for (const item of laneItems) {
    const list = byLane.get(item.laneIndex) ?? [];
    list.push(item);
    byLane.set(item.laneIndex, list);
  }

  for (const [, items] of byLane) {
    const yCenters = items.map((i) => i.dagreYCenter);
    const minY = Math.min(...yCenters);
    const maxY = Math.max(...yCenters);
    const spreadY = maxY - minY;

    for (const item of items) {
      let yRel: number;
      if (spreadY < 1e-6) {
        yRel = (LANE_HEIGHT - item.h) / 2;
      } else {
        const t = (item.dagreYCenter - minY) / spreadY;
        const band = LANE_HEIGHT - 2 * LANE_VERT_PAD - item.h;
        yRel = LANE_VERT_PAD + t * Math.max(0, band);
      }
      yRel = Math.max(
        LANE_VERT_PAD / 2,
        Math.min(yRel, LANE_HEIGHT - item.h - LANE_VERT_PAD / 2)
      );
      item.node = {
        ...item.node,
        position: {
          x: item.x,
          y: CONTENT_PADDING_TOP + item.laneIndex * LANE_HEIGHT + yRel,
        },
      };
    }

    items.sort((a, b) => a.node.position.x - b.node.position.x);
    const MIN_GAP = 28;
    let prevRight = -Infinity;
    for (const item of items) {
      let x = item.node.position.x;
      if (x < prevRight + MIN_GAP) {
        x = prevRight + MIN_GAP;
      }
      item.node = {
        ...item.node,
        position: { ...item.node.position, x },
      };
      prevRight = x + item.w;
    }
  }

  const withLanes: BpmnNode[] = laneItems.map((item) => item.node);

  let maxRight = SWIMLANE_CONTENT_OFFSET_X;
  let maxBottom = CONTENT_PADDING_TOP + lanes.length * LANE_HEIGHT + BOTTOM_PADDING;
  for (const node of withLanes) {
    const t = node.type || 'activity';
    const { w, h } = nodeDimensions(t);
    maxRight = Math.max(maxRight, node.position.x + w);
    maxBottom = Math.max(maxBottom, node.position.y + h + BOTTOM_PADDING / 2);
  }
  const poolWidth = maxRight + RIGHT_PADDING;
  const poolHeight = Math.max(maxBottom, CONTENT_PADDING_TOP + lanes.length * LANE_HEIGHT + BOTTOM_PADDING);

  const poolData: BpmnPoolNodeData = {
    nodeType: 'bpmnPool',
    poolName,
    lanes,
    laneHeight: LANE_HEIGHT,
    poolNameCol: POOL_NAME_COL,
    laneLabelCol: LANE_LABEL_COL,
    contentPaddingTop: CONTENT_PADDING_TOP,
    poolWidth,
    poolHeight,
  };

  const poolNode: BpmnNode = {
    id: '__bpmn_pool__',
    type: 'bpmnPool',
    position: { x: 0, y: 0 },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: -1,
    data: poolData,
    style: {
      width: poolWidth,
      height: poolHeight,
      zIndex: -1,
    },
  };

  return {
    nodes: [poolNode, ...withLanes],
    edges,
  };
}
