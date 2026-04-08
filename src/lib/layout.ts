import dagre from '@dagrejs/dagre';
import { BpmnNode, BpmnEdge, ProcessGraphJson } from './types';
import { nodeDimensions } from './layout-metrics';
import { getSwimlaneLayoutedElements } from './layout-swimlane';

export function getLayoutedElements(
  nodes: BpmnNode[],
  edges: BpmnEdge[],
  direction: 'TB' | 'LR' = 'LR'
): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 80,
    edgesep: 30,
    marginx: 60,
    marginy: 40,
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

/** Aplica dagre simples ou piscina + raias quando `graph.lanes` estiver definido. */
export function layoutProcessGraph(
  graph: ProcessGraphJson,
  nodes: BpmnNode[],
  edges: BpmnEdge[]
): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const direction = graph.layout ?? 'LR';
  if (graph.lanes && graph.lanes.length > 0) {
    return getSwimlaneLayoutedElements(nodes, edges, {
      poolName: graph.pool?.trim() || 'Pool',
      lanes: graph.lanes,
      direction,
    });
  }
  return getLayoutedElements(nodes, edges, direction);
}
