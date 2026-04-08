import { MarkerType, Edge } from 'reactflow';
import { diagramInline } from './diagram-tokens';

/** Sim / Não (e equivalentes) em arestas de gateway exclusivo — fundo vermelho sólido. */
function isGatewayBranchLabel(label: string | undefined): boolean {
  if (!label?.trim()) return false;
  return /^(sim|não|nao|yes|no)(\b|\s*\(|$)/i.test(label.trim());
}

/** Estilo consistente das sequence flows (BPMN) no canvas. */
export function withBpmnEdgeStyle<E extends Edge>(edges: E[]): E[] {
  return edges.map((e) => {
    const branch = isGatewayBranchLabel(e.label as string | undefined);
    const crossPool =
      typeof e.data === 'object' &&
      e.data !== null &&
      'crossPool' in e.data &&
      (e.data as { crossPool?: boolean }).crossPool === true;
    const baseStyle =
      typeof e.style === 'object' && e.style !== null && !Array.isArray(e.style)
        ? { ...(e.style as Record<string, unknown>) }
        : {};
    return {
      ...e,
      type: 'smoothstep',
      /** Mais espaço nos quebra-cantos e segmentos — reduz “arcos” que cruzam o diagrama quando handles ficam desalinhados */
      pathOptions: { offset: 20, borderRadius: 10 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: diagramInline.marker,
        width: 12,
        height: 12,
      },
      className: crossPool ? 'bpmn-edge-flow' : undefined,
      style: {
        ...baseStyle,
        stroke: diagramInline.edge,
        strokeWidth: crossPool ? 1.35 : 1.25,
        ...(crossPool ? { strokeDasharray: '7 5' } : {}),
      },
      labelStyle: {
        fontSize: 10,
        fontWeight: 500,
        fill: branch ? diagramInline.gatewayLabelFill : diagramInline.labelFill,
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      },
      labelBgStyle: branch
        ? { fill: diagramInline.gatewayLabelBg, fillOpacity: 1 }
        : { fill: diagramInline.labelBg, fillOpacity: 0.94 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    };
  });
}
