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

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      title={isEnd ? 'End Event (BPMN)' : 'Start Event (BPMN)'}
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
  );
}

export const StartEndNode = memo(StartEndNodeComponent);
