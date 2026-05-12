import type {
  ProcessGraphJson,
  ProcessGraphNodeJson,
  ProcessGraphEdgeJson,
} from '@/types/process.types';

export interface NodeDiffRef {
  id: string;
  label: string;
  kind: string;
  lane?: string;
}

export interface NodeChange {
  id: string;
  label: string;
  changes: Array<{
    field: 'label' | 'lane' | 'kind';
    from: string | undefined;
    to: string | undefined;
  }>;
}

export interface EdgeDiffRef {
  from: string;
  to: string;
  label?: string;
}

export interface GraphDiff {
  added: NodeDiffRef[];
  removed: NodeDiffRef[];
  modified: NodeChange[];
  edgesAdded: EdgeDiffRef[];
  edgesRemoved: EdgeDiffRef[];
  lanesAdded: string[];
  lanesRemoved: string[];
  totals: {
    prevNodes: number;
    nextNodes: number;
    prevEdges: number;
    nextEdges: number;
    growthRatio: number;
  };
  warnings: string[];
}

function toRef(n: ProcessGraphNodeJson): NodeDiffRef {
  return { id: n.id, label: n.label, kind: n.kind, lane: n.lane };
}

function edgeKey(e: ProcessGraphEdgeJson): string {
  return `${e.from}->${e.to}#${e.label ?? ''}`;
}

export function computeGraphDiff(
  prev: ProcessGraphJson,
  next: ProcessGraphJson,
): GraphDiff {
  const prevNodes = new Map(prev.nodes.map((n) => [n.id, n]));
  const nextNodes = new Map(next.nodes.map((n) => [n.id, n]));

  const added: NodeDiffRef[] = [];
  const removed: NodeDiffRef[] = [];
  const modified: NodeChange[] = [];

  for (const [id, n] of nextNodes) {
    if (!prevNodes.has(id)) {
      added.push(toRef(n));
      continue;
    }
    const before = prevNodes.get(id)!;
    const changes: NodeChange['changes'] = [];
    if (before.label !== n.label) {
      changes.push({ field: 'label', from: before.label, to: n.label });
    }
    if ((before.lane ?? '') !== (n.lane ?? '')) {
      changes.push({ field: 'lane', from: before.lane, to: n.lane });
    }
    if (before.kind !== n.kind) {
      changes.push({ field: 'kind', from: before.kind, to: n.kind });
    }
    if (changes.length > 0) {
      modified.push({ id, label: n.label, changes });
    }
  }
  for (const [id, n] of prevNodes) {
    if (!nextNodes.has(id)) removed.push(toRef(n));
  }

  const prevEdgeKeys = new Set(prev.edges.map(edgeKey));
  const nextEdgeKeys = new Set(next.edges.map(edgeKey));
  const edgesAdded = next.edges.filter((e) => !prevEdgeKeys.has(edgeKey(e)));
  const edgesRemoved = prev.edges.filter((e) => !nextEdgeKeys.has(edgeKey(e)));

  const prevLanes = new Set(prev.lanes ?? []);
  const nextLanes = new Set(next.lanes ?? []);
  const lanesAdded = [...nextLanes].filter((l) => !prevLanes.has(l));
  const lanesRemoved = [...prevLanes].filter((l) => !nextLanes.has(l));

  const prevCount = prev.nodes.length;
  const nextCount = next.nodes.length;
  const growthRatio = prevCount === 0 ? 0 : (nextCount - prevCount) / prevCount;

  const warnings: string[] = [];
  if (growthRatio >= 0.4) {
    warnings.push(
      `O LLM expandiu o grafo em ${Math.round(growthRatio * 100)}% (${prevCount}→${nextCount} nodes). Confira se as adições estão alinhadas com o que você pediu — edits pequenos não deveriam crescer muito.`,
    );
  }
  if (added.length > 0 && removed.length === 0 && modified.length === 0 && edgesRemoved.length === 0) {
    warnings.push(
      `O LLM apenas adicionou nodes (nenhuma remoção ou rename). Se você pediu uma alteração pontual, considere rejeitar e refrasear o prompt.`,
    );
  }

  return {
    added,
    removed,
    modified,
    edgesAdded,
    edgesRemoved,
    lanesAdded,
    lanesRemoved,
    totals: {
      prevNodes: prevCount,
      nextNodes: nextCount,
      prevEdges: prev.edges.length,
      nextEdges: next.edges.length,
      growthRatio,
    },
    warnings,
  };
}
