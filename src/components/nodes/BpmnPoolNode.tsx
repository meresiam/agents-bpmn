"use client";

import { BpmnPoolNodeData } from "@/lib/types";
import { memo, useMemo } from "react";
import { NodeProps } from "reactflow";

const BORDER = "border-zinc-300";
const BORDER_W = "border-[1px]";

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
      className={`pointer-events-none select-none relative bg-white border-2 ${BORDER} rounded-xl shadow-md overflow-hidden`}
      style={{ width: poolWidth, height: poolHeight, boxSizing: "border-box" }}
    >
      {/* Lane backgrounds — full width including label area */}
      {lanes.map((_, i) => (
        <div
          key={`lane-bg-${i}`}
          className={`absolute pointer-events-none ${i % 2 === 0 ? "bg-white" : "bg-zinc-50/80"}`}
          style={{
            left: 0,
            top: laneYOffsets[i],
            width: poolWidth,
            height: i === lanes.length - 1 ? poolHeight - laneYOffsets[i] : laneHeights[i],
          }}
        />
      ))}

      {/* Horizontal lane dividers */}
      {lanes.map((_, i) => {
        if (i === 0) return null;
        return (
          <div
            key={`hline-${i}`}
            className={`absolute left-0 w-full pointer-events-none border-t-${BORDER_W.slice(8, -1)} ${BORDER}`}
            style={{ top: laneYOffsets[i], borderTopWidth: 1 }}
          />
        );
      })}

      {/* Pool name column */}
      <div
        className={`absolute top-0 bottom-0 border-r ${BORDER} flex items-center justify-center bg-zinc-100/90`}
        style={{ left: 0, width: poolNameCol }}
      >
        <span
          className="text-[11px] font-semibold text-zinc-700 tracking-[0.04em] px-1 text-center"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            maxHeight: poolHeight - 24,
          }}
        >
          {poolName}
        </span>
      </div>

      {/* Lane label column */}
      <div
        className={`absolute top-0 bottom-0 border-r ${BORDER} bg-zinc-100/90`}
        style={{ left: poolNameCol, width: laneLabelCol }}
      >
        {lanes.map((laneName, i) => (
          <div
            key={laneName}
            className={`absolute left-0 flex items-center pl-2.5 pr-1.5 ${
              i < lanes.length - 1 ? `border-b ${BORDER}` : ""
            }`}
            style={{
              top: laneYOffsets[i],
              height: i === lanes.length - 1 ? poolHeight - laneYOffsets[i] : laneHeights[i],
              width: laneLabelCol,
            }}
          >
            <span className="text-[10px] font-semibold text-zinc-700 leading-snug tracking-tight">
              {laneName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const BpmnPoolNode = memo(BpmnPoolNodeComponent);
