import { BpmnNode, BpmnEdge } from './types';
import { nodeDimensions } from './layout-metrics';

interface NodeBox {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  type: string;
}

/**
 * Assigns sourceHandle / targetHandle on each edge based on the relative
 * position of source and target nodes after layout.
 *
 * Handle IDs expected on node components:
 *   source: default (Right), "bottom", "top-out"
 *   target: default (Left), "top"
 */
export function assignEdgeHandles(nodes: BpmnNode[], edges: BpmnEdge[]): BpmnEdge[] {
  const nodeMap = new Map<string, NodeBox>();
  for (const node of nodes) {
    if (node.type === 'bpmnPool' || node.type === 'group') continue;
    const { w, h } = nodeDimensions(node.type || 'activity');
    nodeMap.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      w,
      h,
      cx: node.position.x + w / 2,
      cy: node.position.y + h / 2,
      type: node.type || 'activity',
    });
  }

  return edges.map((edge) => {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) return edge;

    const dx = tgt.cx - src.cx;
    const dy = tgt.cy - src.cy;
    const absDy = Math.abs(dy);
    const isCrossPool =
      typeof edge.data === 'object' && edge.data !== null &&
      'crossPool' in edge.data && (edge.data as { crossPool?: boolean }).crossPool;

    let sourceHandle: string | undefined;
    let targetHandle: string | undefined;

    // Cross-pool edges: always route via bottom→top (pool below) or top→bottom (pool above)
    if (isCrossPool) {
      if (dy > 0) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else {
        sourceHandle = 'top-out';
        targetHandle = undefined;
      }
      return { ...edge, sourceHandle, targetHandle };
    }

    // Backward edge (target is to the left of source) — route via top to loop back
    if (dx < -30) {
      sourceHandle = 'top-out';
      targetHandle = 'top';
      return { ...edge, sourceHandle, targetHandle };
    }

    // Forward edge with significant vertical offset
    const isGateway = src.type === 'decision';
    const vertThreshold = isGateway ? 50 : 80;

    if (absDy > vertThreshold) {
      if (dy > 0) {
        sourceHandle = 'bottom';
        targetHandle = absDy > 180 ? 'top' : undefined;
      } else {
        sourceHandle = 'top-out';
        targetHandle = undefined;
      }
    }

    if (!sourceHandle && !targetHandle) return edge;

    return {
      ...edge,
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(targetHandle ? { targetHandle } : {}),
    };
  });
}
