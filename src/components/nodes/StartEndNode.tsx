'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BpmnNodeData } from '@/lib/types';
import { inferBpmnEvent } from '@/lib/bpmn-infer';

/** BPMN 2.0: Start Event (círculo fino, só saída) e End Event (círculo grosso, só entrada) */
function StartEndNodeComponent({ data, selected, id }: NodeProps<BpmnNodeData>) {
  const event = data.bpmn?.event ?? inferBpmnEvent(id, data.label);
  const isEnd = event === 'end';

  const size = 36;

  // Show label if it's not a generic placeholder (Início/Fim/Start/End)
  const genericLabels = ['início', 'inicio', 'fim', 'start', 'end'];
  const hasLabel = data.label && !genericLabels.includes(data.label.trim().toLowerCase());

  return (
    <div
      className="relative flex items-center"
      style={{ height: size }}
      title={isEnd ? 'End Event (BPMN)' : 'Start Event (BPMN)'}
    >
      {hasLabel && !isEnd && (
        <span
          className="text-[11px] text-zinc-500 whitespace-nowrap mr-1.5 select-none"
          style={{ lineHeight: `${size}px` }}
        >
          {data.label}
        </span>
      )}

      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {isEnd && (
          <Handle
            type="target"
            position={Position.Left}
            className="!w-1.5 !h-1.5 !bg-white !border-[1.5px] !border-zinc-800"
          />
        )}

        <svg viewBox="0 0 36 36" width={size} height={size} className="absolute inset-0 text-zinc-800">
          <circle
            cx="18"
            cy="18"
            r={isEnd ? 14 : 15}
            fill="white"
            stroke="currentColor"
            strokeWidth={isEnd ? 3.25 : selected ? 2 : 1.5}
          />
        </svg>

        {!isEnd && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-1.5 !h-1.5 !bg-white !border-[1.5px] !border-zinc-800"
          />
        )}
      </div>

      {hasLabel && isEnd && (
        <span
          className="text-[11px] text-zinc-500 whitespace-nowrap ml-1.5 select-none"
          style={{ lineHeight: `${size}px` }}
        >
          {data.label}
        </span>
      )}
    </div>
  );
}

export const StartEndNode = memo(StartEndNodeComponent);
