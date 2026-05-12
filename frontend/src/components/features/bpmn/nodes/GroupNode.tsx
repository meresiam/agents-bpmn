'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BpmnGroupData } from '@/lib/types';

function GroupNodeComponent({ data }: NodeProps<BpmnGroupData>) {
  return (
    <div className="w-full h-full relative border border-dashed border-fg-primary/60 bg-surface-elevated/40 rounded-md">
      <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-dashed border-fg-primary/40 flex items-center justify-center bg-surface-hover/30">
        <span
          className="text-[11px] font-medium text-fg-secondary tracking-[0.04em] whitespace-nowrap"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          {data.label}
        </span>
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
