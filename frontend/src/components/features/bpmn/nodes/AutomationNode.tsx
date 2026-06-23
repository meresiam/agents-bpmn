'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position, NodeProps } from 'reactflow';
import { BpmnNodeData } from '@/lib/types';
import { BpmnTaskMarker } from './BpmnTaskMarker';

const nodeMotion = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

/** Tarefa automatizada — BPMN 2.0 como Service Task por padrão */
function AutomationNodeComponent({ data, selected }: NodeProps<BpmnNodeData>) {
  const taskKind = data.bpmn?.task ?? 'serviceTask';
  const showMarker = Boolean(taskKind && taskKind !== 'task');
  // Automação herda a cor da raia; sem raia, mantém o violeta AILA como acento.
  const accent = data.accent ?? '#8D80EC';

  return (
    <motion.div
      className="relative"
      {...nodeMotion}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[var(--surface-elevated)] !border-[1.5px] !border-[var(--fg-primary)]"
      />

      <div
        style={{ borderColor: accent }}
        className={`
          relative rounded-bpmn min-w-[132px] max-w-[200px] pb-3 pt-3.5
          ${showMarker ? 'pl-7 pr-3.5' : 'px-4'}
          text-center text-[12px] leading-snug font-medium text-fg-primary
          bg-surface-elevated border-[1.5px] border-dashed shadow-sm
          transition-[box-shadow,transform] duration-200
          ${selected ? 'shadow-md ring-1 ring-aila-violet/40 shadow-aila-violet/15' : 'hover:shadow-md'}
        `}
      >
        {/* Badge AUTO — canto superior direito */}
        <span
          style={{ backgroundColor: accent }}
          className="pointer-events-none absolute -top-2 -right-1.5 z-[2] inline-flex items-center px-1.5 py-px text-[8px] font-bold tracking-[0.08em] uppercase rounded-sm text-white shadow-sm"
          title="Service Task / Automação"
        >
          AUTO
        </span>
        <BpmnTaskMarker kind={taskKind} color={accent} />
        {(data.lane ?? data.phase) && (
          <div
            className="text-[9px] uppercase tracking-[0.06em] mb-1 font-semibold"
            style={{ color: accent }}
          >
            {data.lane ?? data.phase}
          </div>
        )}
        <div className="text-fg-primary">{data.label}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[var(--surface-elevated)] !border-[1.5px] !border-[var(--fg-primary)]"
      />
      {/* Invisible directional handles for smart edge routing */}
      <Handle type="target" position={Position.Top} id="top" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Top} id="top-out" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
    </motion.div>
  );
}

export const AutomationNode = memo(AutomationNodeComponent);
