'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BpmnGroupData } from '@/lib/types';

function GroupNodeComponent({ data }: NodeProps<BpmnGroupData>) {
  return (
    <div className="w-full h-full relative border border-zinc-800/90 bg-white rounded-sm shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-zinc-300 flex items-center justify-center bg-zinc-100/50">
        <span
          className="text-[11px] font-medium text-zinc-800 whitespace-nowrap"
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
