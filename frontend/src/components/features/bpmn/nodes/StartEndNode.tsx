'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position, NodeProps } from 'reactflow';
import { BpmnNodeData } from '@/lib/types';
import { inferBpmnEvent } from '@/lib/bpmn-infer';

const nodeMotion = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

/** BPMN 2.0: Start Event (círculo fino, só saída) e End Event (círculo grosso, só entrada) */
function StartEndNodeComponent({ data, selected, id }: NodeProps<BpmnNodeData>) {
  const event = data.bpmn?.event ?? inferBpmnEvent(id, data.label);
  const isEnd = event === 'end';

  const size = 36;

  // Show label if it's not a generic placeholder (Início/Fim/Start/End)
  const genericLabels = ['início', 'inicio', 'fim', 'start', 'end'];
  const hasLabel = data.label && !genericLabels.includes(data.label.trim().toLowerCase());

  return (
    <motion.div
      className="relative flex items-center"
      style={{ height: size }}
      title={isEnd ? 'End Event (BPMN)' : 'Start Event (BPMN)'}
      {...nodeMotion}
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
        {/* Invisible handles for cross-pool and backward edge routing */}
        <Handle type="target" position={Position.Top} id="top" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
        <Handle type="source" position={Position.Top} id="top-out" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />

        <svg viewBox="0 0 36 36" width={size} height={size} className="absolute inset-0 text-zinc-800">
          <circle
            cx="18"
            cy="18"
            r={isEnd ? 14 : 15}
            fill={isEnd ? '#fecaca' : '#fef9c3'}
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
    </motion.div>
  );
}

export const StartEndNode = memo(StartEndNodeComponent);
