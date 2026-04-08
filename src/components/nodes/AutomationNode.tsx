'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BpmnNodeData } from '@/lib/types';
import { BpmnTaskMarker } from './BpmnTaskMarker';

/** Tarefa automatizada — BPMN 2.0 como Service Task por padrão */
function AutomationNodeComponent({ data, selected }: NodeProps<BpmnNodeData>) {
  const taskKind = data.bpmn?.task ?? 'serviceTask';
  const showMarker = Boolean(taskKind && taskKind !== 'task');

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-white !border-[1.5px] !border-zinc-800"
      />

      <div
        className={`
          relative rounded-bpmn min-w-[132px] max-w-[200px] pb-3 pt-3.5
          ${showMarker ? 'pl-7 pr-3.5' : 'px-4'}
          text-center text-[12px] leading-snug font-medium text-zinc-900
          bg-white border border-zinc-800/85 shadow-sm
          transition-[box-shadow,border-color] duration-200
          ${selected ? 'border-zinc-900 shadow-md ring-1 ring-zinc-500/20' : 'hover:border-zinc-800 hover:shadow-md'}
        `}
      >
        <BpmnTaskMarker kind={taskKind} />
        {(data.lane ?? data.phase) && (
          <div className="text-[9px] uppercase tracking-[0.06em] text-zinc-500 mb-1 font-semibold">
            {data.lane ?? data.phase}
          </div>
        )}
        <div className="text-zinc-900">{data.label}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-white !border-[1.5px] !border-zinc-800"
      />
      {/* Invisible directional handles for smart edge routing */}
      <Handle type="target" position={Position.Top} id="top" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Top} id="top-out" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
    </div>
  );
}

export const AutomationNode = memo(AutomationNodeComponent);
