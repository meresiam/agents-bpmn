import { BpmnNode, BpmnEdge, BpmnNodeData, BpmnPoolNodeData } from './types';
import { nodeDimensions } from './layout-metrics';

// ─── Constants ────────────────────────────────────────────────────────────

const POOL_NAME_COL = 44;
const LANE_LABEL_COL = 118;
export const SWIMLANE_CONTENT_OFFSET_X = POOL_NAME_COL + LANE_LABEL_COL;
const CONTENT_PADDING_TOP = 16;
const LANE_VERT_PAD = 12;
const NODE_GAP_Y = 18;
const RANK_SEP = 80;
const RIGHT_PADDING = 56;
const BOTTOM_PADDING = 24;
const MIN_EMPTY_LANE_H = 56;

// ─── Internal types ───────────────────────────────────────────────────────

interface ContentNode {
  id: string;
  type: string;
  laneIndex: number;
  w: number;
  h: number;
  rfNode: BpmnNode;
}

interface GridCell {
  items: ContentNode[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function isContentNode(n: BpmnNode): n is BpmnNode & { data: BpmnNodeData } {
  return n.type !== 'bpmnPool' && n.type !== 'group';
}

function resolveLane(data: BpmnNodeData, lanes: string[]): string {
  const key = data.lane ?? data.phase;
  if (key && lanes.includes(key)) return key;
  return lanes[0] ?? 'Geral';
}

// ─── Phase 1: Build adjacency ────────────────────────────────────────────

function buildAdjacency(nodeIds: Set<string>, edges: BpmnEdge[]) {
  const adj = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  for (const id of nodeIds) {
    adj.set(id, []);
    pred.set(id, []);
  }
  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    pred.get(e.target)!.push(e.source);
  }
  return { adj, pred };
}

// ─── Phase 2: Rank assignment (longest-path with cycle handling) ─────────

function computeRanks(
  nodeIds: Set<string>,
  adj: Map<string, string[]>,
  pred: Map<string, string[]>
): Map<string, number> {
  // Kahn's topological sort
  const inDeg = new Map<string, number>();
  for (const id of nodeIds) inDeg.set(id, 0);
  for (const [, succs] of adj) {
    for (const s of succs) inDeg.set(s, (inDeg.get(s) ?? 0) + 1);
  }
  // Fix: recount using pred lengths
  for (const id of nodeIds) inDeg.set(id, pred.get(id)!.length);

  const queue: string[] = [];
  for (const [id, d] of inDeg) {
    if (d === 0) queue.push(id);
  }

  const topo: string[] = [];
  const remaining = new Map(inDeg);
  while (queue.length > 0) {
    const node = queue.shift()!;
    topo.push(node);
    for (const succ of adj.get(node)!) {
      const d = remaining.get(succ)! - 1;
      remaining.set(succ, d);
      if (d === 0) queue.push(succ);
    }
  }

  // Cycle nodes: append any not yet visited
  const visited = new Set(topo);
  for (const id of nodeIds) {
    if (!visited.has(id)) topo.push(id);
  }

  // Build position map for back-edge detection
  const topoIdx = new Map<string, number>();
  topo.forEach((id, i) => topoIdx.set(id, i));

  // Longest-path
  const ranks = new Map<string, number>();
  for (const id of topo) {
    let maxPredRank = -1;
    for (const p of pred.get(id)!) {
      // Skip back-edges
      if ((topoIdx.get(p) ?? Infinity) >= (topoIdx.get(id) ?? 0)) continue;
      maxPredRank = Math.max(maxPredRank, ranks.get(p) ?? 0);
    }
    ranks.set(id, maxPredRank + 1);
  }

  return ranks;
}

// ─── Phase 3: Build grid & order sub-rows ─────────────────────────────────

function buildGrid(
  nodes: ContentNode[],
  ranks: Map<string, number>,
  laneCount: number,
  pred: Map<string, string[]>
): { grid: Map<string, GridCell>; maxRank: number } {
  const grid = new Map<string, GridCell>();
  let maxRank = 0;

  for (const node of nodes) {
    const rank = ranks.get(node.id) ?? 0;
    maxRank = Math.max(maxRank, rank);
    const key = `${node.laneIndex},${rank}`;
    let cell = grid.get(key);
    if (!cell) {
      cell = { items: [] };
      grid.set(key, cell);
    }
    cell.items.push(node);
  }

  // Order sub-rows rank by rank using predecessor positions (barycenter)
  const nodeYHint = new Map<string, number>();

  for (let r = 0; r <= maxRank; r++) {
    for (let l = 0; l < laneCount; l++) {
      const cell = grid.get(`${l},${r}`);
      if (!cell) continue;

      if (cell.items.length > 1 && r > 0) {
        // Sort by average predecessor Y-hint
        cell.items.sort((a, b) => {
          const aHints = pred.get(a.id)!.map((p) => nodeYHint.get(p)).filter((v): v is number => v !== undefined);
          const bHints = pred.get(b.id)!.map((p) => nodeYHint.get(p)).filter((v): v is number => v !== undefined);
          const aAvg = aHints.length > 0 ? aHints.reduce((s, v) => s + v, 0) / aHints.length : 0;
          const bAvg = bHints.length > 0 ? bHints.reduce((s, v) => s + v, 0) / bHints.length : 0;
          return aAvg - bAvg;
        });
      }

      // Assign Y hints (sub-row index) for next rank's ordering
      cell.items.forEach((item, i) => nodeYHint.set(item.id, l * 1000 + i));
    }
  }

  return { grid, maxRank };
}

// ─── Phase 4: Geometry (predecessor-aware Y) ─────────────────────────────

function stackHeight(items: ContentNode[]): number {
  let h = 0;
  for (let i = 0; i < items.length; i++) {
    h += items[i].h;
    if (i > 0) h += NODE_GAP_Y;
  }
  return h;
}

function computeGeometry(
  grid: Map<string, GridCell>,
  maxRank: number,
  lanes: string[],
  pred: Map<string, string[]>,
  adj: Map<string, string[]>,
  nodeHeightMap?: Map<string, number>
) {
  const laneCount = lanes.length;

  // ── Column widths ───────────────────────────────────────────────────
  const colWidths: number[] = [];
  for (let r = 0; r <= maxRank; r++) {
    let maxW = 0;
    for (let l = 0; l < laneCount; l++) {
      const cell = grid.get(`${l},${r}`);
      if (cell) {
        for (const item of cell.items) maxW = Math.max(maxW, item.w);
      }
    }
    colWidths.push(maxW);
  }

  // ── Column X positions ──────────────────────────────────────────────
  const colX: number[] = [];
  let x = SWIMLANE_CONTENT_OFFSET_X + 20;
  for (let r = 0; r <= maxRank; r++) {
    colX.push(x);
    x += colWidths[r] + RANK_SEP;
  }

  // ── Lane heights ────────────────────────────────────────────────────
  const laneHeights: number[] = [];
  for (let l = 0; l < laneCount; l++) {
    let maxStackH = 0;
    let hasCells = false;
    for (let r = 0; r <= maxRank; r++) {
      const cell = grid.get(`${l},${r}`);
      if (!cell) continue;
      hasCells = true;
      maxStackH = Math.max(maxStackH, stackHeight(cell.items));
    }
    laneHeights.push(hasCells ? maxStackH + 2 * LANE_VERT_PAD : MIN_EMPTY_LANE_H);
  }

  // ── Lane Y offsets ──────────────────────────────────────────────────
  const laneYOffsets: number[] = [];
  let y = CONTENT_PADDING_TOP;
  for (const h of laneHeights) {
    laneYOffsets.push(y);
    y += h;
  }

  // ── Position nodes rank-by-rank (predecessor-aware Y) ───────────────
  const positions = new Map<string, { x: number; y: number }>();

  function placeCell(l: number, r: number, targetCenterY: number | null) {
    const cell = grid.get(`${l},${r}`);
    if (!cell) return;

    const laneTop = laneYOffsets[l];
    const laneH = laneHeights[l];
    const colCenter = colX[r] + colWidths[r] / 2;
    const sh = stackHeight(cell.items);

    const laneCenterY = laneTop + laneH / 2;
    const centerY = targetCenterY ?? laneCenterY;

    const minTop = laneTop + LANE_VERT_PAD;
    const maxTop = laneTop + laneH - sh - LANE_VERT_PAD;
    let startY = centerY - sh / 2;
    startY = Math.max(minTop, Math.min(startY, maxTop));

    let nodeY = startY;
    for (const item of cell.items) {
      positions.set(item.id, { x: colCenter - item.w / 2, y: nodeY });
      nodeY += item.h + NODE_GAP_Y;
    }
  }

  // Forward pass: rank 1+ uses predecessor Y
  for (let r = 0; r <= maxRank; r++) {
    for (let l = 0; l < laneCount; l++) {
      const cell = grid.get(`${l},${r}`);
      if (!cell) continue;

      let targetCenterY: number | null = null;
      if (r > 0) {
        const predYs: number[] = [];
        for (const item of cell.items) {
          for (const p of pred.get(item.id) ?? []) {
            const pos = positions.get(p);
            if (pos) {
              const pH = nodeHeightMap?.get(p) ?? 100;
              predYs.push(pos.y + pH / 2);
            }
          }
        }
        if (predYs.length > 0) {
          targetCenterY = predYs.reduce((s, v) => s + v, 0) / predYs.length;
        }
      }
      placeCell(l, r, targetCenterY);
    }
  }

  // Final pass: align startEnd nodes to the center Y of their closest neighbor
  for (const [, cell] of grid) {
    for (const item of cell.items) {
      if (item.type !== 'startEnd') continue;
      const pos = positions.get(item.id);
      if (!pos) continue;

      const neighbors = [
        ...(adj.get(item.id) ?? []),
        ...(pred.get(item.id) ?? []),
      ];
      let bestY: number | null = null;
      for (const n of neighbors) {
        const nPos = positions.get(n);
        if (nPos) {
          const nH = nodeHeightMap?.get(n) ?? 100;
          // Align center of startEnd with center of neighbor
          bestY = nPos.y + nH / 2;
          break; // use first neighbor (most directly connected)
        }
      }
      if (bestY !== null) {
        // Set Y so that center of startEnd aligns with neighbor center
        positions.set(item.id, { x: pos.x, y: bestY - item.h / 2 });
      }
    }
  }

  return { positions, laneHeights, colX, colWidths };
}

// ─── Main entry ───────────────────────────────────────────────────────────

export function getSwimlaneLayoutedElements(
  nodes: BpmnNode[],
  edges: BpmnEdge[],
  options: {
    poolName: string;
    lanes: string[];
    direction?: 'LR' | 'TB';
    poolDomId?: string;
  }
): { nodes: BpmnNode[]; edges: BpmnEdge[] } {
  const { poolName, lanes, poolDomId = '__bpmn_pool__' } = options;
  if (lanes.length === 0) {
    throw new Error('swimlane: informe ao menos uma raia em graph.lanes');
  }

  // Build content nodes
  const contentNodes: ContentNode[] = nodes.filter(isContentNode).map((n) => {
    const d = n.data as BpmnNodeData;
    const laneName = resolveLane(d, lanes);
    const laneIndex = Math.max(0, lanes.indexOf(laneName));
    const { w, h } = nodeDimensions(n.type || 'activity');
    return { id: n.id, type: n.type || 'activity', laneIndex, w, h, rfNode: n };
  });

  const nodeIds = new Set(contentNodes.map((n) => n.id));

  // Phase 1
  const { adj, pred } = buildAdjacency(nodeIds, edges);

  // Phase 2
  const ranks = computeRanks(nodeIds, adj, pred);

  // Phase 3
  const { grid, maxRank } = buildGrid(contentNodes, ranks, lanes.length, pred);

  // Build height lookup for predecessor-aware positioning
  const nodeHeightMap = new Map<string, number>();
  for (const cn of contentNodes) nodeHeightMap.set(cn.id, cn.h);

  // Phase 4
  const { positions, laneHeights } = computeGeometry(grid, maxRank, lanes, pred, adj, nodeHeightMap);

  // Build output nodes
  const outputNodes: BpmnNode[] = contentNodes.map((cn) => ({
    ...cn.rfNode,
    position: positions.get(cn.id) ?? { x: 0, y: 0 },
  }));

  // Pool dimensions
  let maxRight = SWIMLANE_CONTENT_OFFSET_X;
  for (const cn of contentNodes) {
    const pos = positions.get(cn.id);
    if (pos) maxRight = Math.max(maxRight, pos.x + cn.w);
  }

  const totalLanesH = laneHeights.reduce((s, h) => s + h, 0);
  const poolWidth = maxRight + RIGHT_PADDING;
  const poolHeight = CONTENT_PADDING_TOP + totalLanesH + BOTTOM_PADDING;

  const poolData: BpmnPoolNodeData = {
    nodeType: 'bpmnPool',
    poolName,
    lanes,
    laneHeights,
    poolNameCol: POOL_NAME_COL,
    laneLabelCol: LANE_LABEL_COL,
    contentPaddingTop: CONTENT_PADDING_TOP,
    poolWidth,
    poolHeight,
  };

  const poolNode: BpmnNode = {
    id: poolDomId,
    type: 'bpmnPool',
    position: { x: 0, y: 0 },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: -1,
    data: poolData,
    style: { width: poolWidth, height: poolHeight, zIndex: -1 },
  };

  return { nodes: [poolNode, ...outputNodes], edges };
}
