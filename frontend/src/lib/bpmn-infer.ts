import { BpmnEventKind, BpmnSemantic, ProcessGraphNodeJson } from './types';

/** Infere start vs end quando bpmn.event não veio no JSON */
export function inferBpmnEvent(id: string, label: string): BpmnEventKind {
  const idLower = id.toLowerCase();
  if (/^end\d*$|^fim\d*$/i.test(id) || idLower.startsWith('end_') || idLower.startsWith('fim_')) {
    return 'end';
  }
  if (idLower === 'start' || idLower.startsWith('start_')) {
    return 'start';
  }
  const l = label.toLowerCase();
  if (/\bfim\b|finalizad|encerrad|perdido|nutrido|descartad/.test(l)) return 'end';
  return 'start';
}

/** Mescla defaults BPMN 2.0 por kind */
export function mergeBpmnSemantic(n: ProcessGraphNodeJson): BpmnSemantic | undefined {
  if (n.kind === 'group') return undefined;

  const bpmn: BpmnSemantic = { ...(n.bpmn ?? {}) };

  if (n.kind === 'decision' && bpmn.gateway === undefined) {
    bpmn.gateway = 'exclusive';
  }
  if (n.kind === 'automation' && bpmn.task === undefined) {
    bpmn.task = 'serviceTask';
  }
  if (n.kind === 'startEnd' && bpmn.event === undefined) {
    bpmn.event = inferBpmnEvent(n.id, n.label);
  }

  if (bpmn.gateway === undefined && bpmn.task === undefined && bpmn.event === undefined) {
    return undefined;
  }
  return bpmn;
}
