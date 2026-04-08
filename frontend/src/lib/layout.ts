import dagre from '@dagrejs/dagre';
import { BpmnNode, BpmnEdge, BpmnNodeData, ProcessGraphJson } from './types';
import { nodeDimensions } from './layout-metrics';
import { getSwimlaneLayoutedElements } from './layout-swimlane';
import { assignEdgeHandles } from './edge-routing';

const POOL_STACK_GAP = 56;

function translateNodesY(nodes: BpmnNode[], dy: number): BpmnNode[] {
  return nodes.map((n) => ({
    ...n,
    position: { x: n.position.x, y: n.position.y + dy },
  }));
}

/**
 * Empilha várias piscinas (ordem de `graph.pools`) e mantém arestas entre piscinas no mesmo canvas.
 */
function layoutMultiPoolProcessGraph(
  graph: ProcessGraphJson,
  nodes: BpmnNode[],
  edges: BpmnEdge[]
): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const pools = graph.pools!;
  const direction = graph.layout ?? 'LR';

  const nodePool = new Map<string, string>();
  for (const n of nodes) {
    if (n.type === 'group') continue;
    const d = n.data as BpmnNodeData;
    if (!d.poolId?.trim()) {
      throw new Error(`Layout multi-piscina: o nó "${n.id}" precisa de poolId (defina em graph.nodes[].poolId).`);
    }
    nodePool.set(n.id, d.poolId.trim());
  }

  const internalByPool = new Map<string, BpmnEdge[]>();
  for (const p of pools) {
    internalByPool.set(p.id, []);
  }
  const crossPoolEdges: BpmnEdge[] = [];

  for (const e of edges) {
    const sp = nodePool.get(e.source);
    const tp = nodePool.get(e.target);
    const markCross = (edge: BpmnEdge): BpmnEdge => ({
      ...edge,
      data: { ...edge.data, crossPool: true },
    });
    if (sp === undefined || tp === undefined) {
      crossPoolEdges.push(markCross(e));
      continue;
    }
    if (sp === tp) {
      internalByPool.get(sp)?.push(e);
    } else {
      crossPoolEdges.push(markCross(e));
    }
  }

  let yOffset = 0;
  const allNodes: BpmnNode[] = [];
  const allEdges: BpmnEdge[] = [];

  for (const poolDef of pools) {
    const poolId = poolDef.id;
    const subsetNodes = nodes.filter((n) => nodePool.get(n.id) === poolId);
    const subsetEdges = internalByPool.get(poolId) ?? [];

    if (subsetNodes.length === 0) {
      throw new Error(`Layout multi-piscina: a piscina "${poolId}" não tem nós (poolId nos nodes).`);
    }

    const { nodes: laid, edges: laidEdges } = getSwimlaneLayoutedElements(subsetNodes, subsetEdges, {
      poolName: poolDef.pool,
      lanes: poolDef.lanes,
      direction,
      poolDomId: `__bpmn_pool__${poolId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    });

    const shifted = translateNodesY(laid, yOffset);
    allNodes.push(...shifted);
    allEdges.push(...laidEdges);

    const poolNode = shifted.find((n) => n.type === 'bpmnPool');
    const h =
      poolNode?.style && typeof poolNode.style.height === 'number' ? poolNode.style.height : 0;
    yOffset += h + POOL_STACK_GAP;
  }

  allEdges.push(...crossPoolEdges);
  return { nodes: allNodes, edges: allEdges };
}

export function getLayoutedElements(
  nodes: BpmnNode[],
  edges: BpmnEdge[],
  direction: 'TB' | 'LR' = 'LR'
): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 72,
    ranksep: 112,
    edgesep: 36,
    marginx: 64,
    marginy: 48,
    ranker: 'network-simplex',
  });

  const regularNodes = nodes.filter((n) => n.type !== 'group' && n.type !== 'bpmnPool');

  for (const node of regularNodes) {
    const nodeType = node.type || 'activity';
    const { w, h } = nodeDimensions(nodeType);
    dagreGraph.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(dagreGraph);

  const layoutedNodes: BpmnNode[] = regularNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const nodeType = node.type || 'activity';
    const { w, h } = nodeDimensions(nodeType);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/** Aplica dagre simples, piscina única ou várias piscinas empilhadas (`graph.pools`). */
export function layoutProcessGraph(
  graph: ProcessGraphJson,
  nodes: BpmnNode[],
  edges: BpmnEdge[]
): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const direction = graph.layout ?? 'LR';
  let result: { nodes: BpmnNode[]; edges: BpmnEdge[] };
  if (graph.pools && graph.pools.length > 0) {
    result = layoutMultiPoolProcessGraph(graph, nodes, edges);
  } else if (graph.lanes && graph.lanes.length > 0) {
    result = getSwimlaneLayoutedElements(nodes, edges, {
      poolName: graph.pool?.trim() || 'Pool',
      lanes: graph.lanes,
      direction,
    });
  } else {
    result = getLayoutedElements(nodes, edges, direction);
  }
  // Smart handle assignment: route edges through optimal handles based on node positions
  return { nodes: result.nodes, edges: assignEdgeHandles(result.nodes, result.edges) };
}
