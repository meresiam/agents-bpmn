import { MarkerType, Edge } from 'reactflow';
import { diagramInline } from './diagram-tokens';

/** Estilo consistente das sequence flows (BPMN) no canvas. */
export function withBpmnEdgeStyle<E extends Edge>(edges: E[]): E[] {
  return edges.map((e) => ({
    ...e,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: diagramInline.marker,
      width: 12,
      height: 12,
    },
    style: { stroke: diagramInline.edge, strokeWidth: 1.25 },
    labelStyle: {
      fontSize: 10,
      fontWeight: 500,
      fill: diagramInline.labelFill,
      fontFamily: 'var(--font-sans), system-ui, sans-serif',
    },
    labelBgStyle: { fill: diagramInline.labelBg, fillOpacity: 0.94 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 6,
  }));
}
