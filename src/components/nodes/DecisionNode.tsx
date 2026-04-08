'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position, NodeProps } from 'reactflow';
import { BpmnNodeData, BpmnGatewayKind } from '@/lib/types';

const nodeMotion = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

function DecisionNodeComponent({ data, selected }: NodeProps<BpmnNodeData>) {
  const size = 48;
  const gateway: BpmnGatewayKind = data.bpmn?.gateway ?? 'exclusive';
  const gwTitle =
    gateway === 'exclusive'
      ? 'Exclusive Gateway (XOR)'
      : gateway === 'parallel'
        ? 'Parallel Gateway (AND)'
        : 'Inclusive Gateway (OR)';

  return (
    <motion.div className="relative flex flex-col items-center" title={gwTitle} {...nodeMotion}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-1.5 !h-1.5 !bg-white !border-[1.5px] !border-zinc-800"
        />

        <svg viewBox="0 0 48 48" width={size} height={size} className="absolute inset-0 text-zinc-800">
          <polygon
            points="24,2 46,24 24,46 2,24"
            fill="white"
            stroke="currentColor"
            strokeWidth={selected ? 2.25 : 1.5}
          />
          {gateway === 'exclusive' && (
            <>
              <line x1="16" y1="16" x2="32" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="32" y1="16" x2="16" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {gateway === 'parallel' && (
            <>
              <line x1="24" y1="12" x2="24" y2="36" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              <line x1="12" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
            </>
          )}
          {gateway === 'inclusive' && (
            <circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          )}
        </svg>

        <Handle
          type="source"
          position={Position.Right}
          className="!w-1.5 !h-1.5 !bg-white !border-[1.5px] !border-zinc-800"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!w-1.5 !h-1.5 !bg-white !border-[1.5px] !border-zinc-800"
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!w-1.5 !h-1.5 !bg-white !border-[1.5px] !border-zinc-800"
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-out"
          className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0"
        />
      </div>

      {data.label ? (
        <span className="mt-1 text-[10px] text-center text-zinc-800 font-medium leading-tight px-1 max-w-[130px]">
          {data.label}
        </span>
      ) : null}
    </motion.div>
  );
}

export const DecisionNode = memo(DecisionNodeComponent);
