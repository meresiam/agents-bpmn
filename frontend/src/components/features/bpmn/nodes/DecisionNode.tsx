'use client';

import { memo, useId } from 'react';
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

  const accent = data.accent;
  const gradientId = `aila-decision-grad-${useId().replace(/:/g, '')}`;
  const strokeColor = selected ? `url(#${gradientId})` : accent ?? 'currentColor';
  const strokeWidth = selected ? 2.5 : 1.75;

  return (
    <motion.div
      className="relative flex flex-col items-center"
      title={gwTitle}
      {...nodeMotion}
      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-1.5 !h-1.5 !bg-[var(--surface-elevated)] !border-[1.5px] !border-[var(--fg-primary)]"
        />

        <svg viewBox="0 0 48 48" width={size} height={size} className="absolute inset-0 text-fg-primary overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34C4F9" />
              <stop offset="25%" stopColor="#4CB3F6" />
              <stop offset="50%" stopColor="#8D80EC" />
              <stop offset="75%" stopColor="#CE4EE1" />
              <stop offset="100%" stopColor="#E63DE0" />
            </linearGradient>
          </defs>
          <polygon
            points="24,2 46,24 24,46 2,24"
            fill="var(--surface-elevated)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={selected ? { filter: 'drop-shadow(0 0 6px rgba(141, 128, 236, 0.45))' } : undefined}
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
          className="!w-1.5 !h-1.5 !bg-[var(--surface-elevated)] !border-[1.5px] !border-[var(--fg-primary)]"
        />
        {/* Invisible handles for edge routing (cross-pool, backward edges) */}
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
        <Handle type="target" position={Position.Top} id="top" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
        <Handle type="source" position={Position.Top} id="top-out" className="!w-[1px] !h-[1px] !opacity-0 !min-w-0 !min-h-0" />
      </div>

      {data.label ? (
        <span className="mt-1 text-[10px] text-center text-fg-primary font-medium leading-tight px-1 max-w-[130px]">
          {data.label}
        </span>
      ) : null}
    </motion.div>
  );
}

export const DecisionNode = memo(DecisionNodeComponent);
