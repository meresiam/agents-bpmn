'use client';

import { memo, useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { BpmnPoolNodeData } from '@/lib/types';

/**
 * Piscina BPMN 2.0: borda externa, nome do pool (vertical), raias com rótulos e linhas horizontais.
 * Renderizado atrás dos demais nós (zIndex -1).
 */
function BpmnPoolNodeComponent({ data }: NodeProps<BpmnPoolNodeData>) {
  const {
    poolName,
    lanes,
    laneHeights,
    poolNameCol,
    laneLabelCol,
    contentPaddingTop,
    poolWidth,
    poolHeight,
  } = data;

  const labelStripWidth = poolNameCol + laneLabelCol;

  /** Cumulative Y offsets for each lane */
  const laneYOffsets = useMemo(() => {
    const offsets: number[] = [];
    let y = contentPaddingTop;
    for (const h of laneHeights) {
      offsets.push(y);
      y += h;
    }
    return offsets;
  }, [laneHeights, contentPaddingTop]);

  return (
    <div
      className="pointer-events-none select-none relative bg-white border-[1.5px] border-zinc-700 rounded-sm shadow-sm"
      style={{
        width: poolWidth,
        height: poolHeight,
        boxSizing: 'border-box',
      }}
    >
      {lanes.map((_, i) => {
        if (i === 0) return null;
        const y = laneYOffsets[i];
        return (
          <div
            key={`hline-${i}`}
            className="absolute left-0 w-full pointer-events-none border-t-[1.25px] border-zinc-700"
            style={{ top: y }}
          />
        );
      })}

      <div
        className="absolute top-0 bottom-0 border-r border-zinc-600 flex items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-50"
        style={{ left: 0, width: poolNameCol }}
      >
        <span
          className="text-[11px] font-semibold text-zinc-800 tracking-[0.04em] px-1 text-center"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            maxHeight: poolHeight - 24,
          }}
        >
          {poolName}
        </span>
      </div>

      <div
        className="absolute top-0 bottom-0 border-r-[1.5px] border-zinc-700 bg-zinc-100/90"
        style={{ left: poolNameCol, width: laneLabelCol }}
      >
        {lanes.map((laneName, i) => (
          <div
            key={laneName}
            className={`absolute left-0 flex items-center pl-2.5 pr-1.5 ${
              i < lanes.length - 1 ? 'border-b border-zinc-600' : ''
            }`}
            style={{
              top: laneYOffsets[i],
              height: laneHeights[i],
              width: laneLabelCol,
            }}
          >
            <span className="text-[10px] font-semibold text-zinc-800 leading-snug tracking-tight">{laneName}</span>
          </div>
        ))}
      </div>

      <div
        className="absolute top-0 bottom-0 bg-zinc-100/80"
        style={{ left: labelStripWidth, width: poolWidth - labelStripWidth }}
      />
    </div>
  );
}

export const BpmnPoolNode = memo(BpmnPoolNodeComponent);
