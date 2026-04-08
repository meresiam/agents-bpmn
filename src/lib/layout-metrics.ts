/** Dimensões usadas em dagre e swimlane (alinhadas ao tamanho visual dos nós) */
export const NODE_WIDTHS: Record<string, number> = {
  /** max-w-[200px] nas tasks + padding */
  activity: 200,
  decision: 130,
  startEnd: 36,
  automation: 200,
  bpmnPool: 400,
};

export const NODE_HEIGHTS: Record<string, number> = {
  /** fase (uppercase) + label 1–2 linhas + pt/pb (Activity/Automation) */
  activity: 96,
  decision: 76,
  startEnd: 36,
  automation: 96,
  bpmnPool: 200,
};

export function nodeDimensions(type: string | undefined): { w: number; h: number } {
  const w = NODE_WIDTHS[type || 'activity'] || 150;
  const h = NODE_HEIGHTS[type || 'activity'] || 50;
  return { w, h };
}
