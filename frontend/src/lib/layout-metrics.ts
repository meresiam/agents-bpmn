/** Dimensões usadas em dagre e swimlane (alinhadas ao tamanho visual dos nós) */
export const NODE_WIDTHS: Record<string, number> = {
  /** max-w-[200px] nas tasks + padding */
  activity: 200,
  /** losango 48px + rótulo abaixo */
  decision: 160,
  /** circle 36px + label beside (~150px) */
  startEnd: 190,
  automation: 200,
  bpmnPool: 400,
};

export const NODE_HEIGHTS: Record<string, number> = {
  /** fase + label com várias linhas (\n) — subestimar gera nós sobrepostos e handles desalinhados */
  activity: 124,
  decision: 100,
  startEnd: 36,
  automation: 124,
  bpmnPool: 200,
};

/**
 * Altura efetiva para o eixo vertical do handle (centro do nó no DOM).
 * Os cards reais são mais baixos que NODE_HEIGHTS; sem isso o snap start/end usa um centro “virtual” baixo demais.
 * Só para alinhar eventos ao vizinho no swimlane — o grid continua usando NODE_HEIGHTS.
 */
export const NODE_HANDLE_ALIGN_HEIGHTS: Record<string, number> = {
  activity: 84,
  automation: 84,
  decision: 80,
  startEnd: 36,
};

export function nodeDimensions(type: string | undefined): { w: number; h: number } {
  const w = NODE_WIDTHS[type || 'activity'] || 150;
  const h = NODE_HEIGHTS[type || 'activity'] || 50;
  return { w, h };
}
