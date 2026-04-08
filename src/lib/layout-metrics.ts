/** Dimensões usadas em dagre e swimlane (alinhadas ao tamanho visual dos nós) */
export const NODE_WIDTHS: Record<string, number> = {
  /** max-w-[200px] nas tasks + padding */
  activity: 200,
  /** losango 48px + rótulo abaixo */
  decision: 130,
  startEnd: 36,
  automation: 200,
  bpmnPool: 400,
};

export const NODE_HEIGHTS: Record<string, number> = {
  /** fase + label com várias linhas (\n) — subestimar gera nós sobrepostos e handles desalinhados */
  activity: 124,
  decision: 88,
  startEnd: 36,
  automation: 124,
  bpmnPool: 200,
};

export function nodeDimensions(type: string | undefined): { w: number; h: number } {
  const w = NODE_WIDTHS[type || 'activity'] || 150;
  const h = NODE_HEIGHTS[type || 'activity'] || 50;
  return { w, h };
}
