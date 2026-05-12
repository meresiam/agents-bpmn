"use client";

import { BpmnPoolNodeData } from "@/lib/types";
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { NodeProps } from "reactflow";

const BORDER = "border-border-app";

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
    <motion.div
      className={`pointer-events-none select-none relative bg-surface-elevated border-2 ${BORDER} rounded-xl shadow-md overflow-hidden`}
      style={{ width: poolWidth, height: poolHeight, boxSizing: "border-box" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Lane backgrounds — full width including label area */}
      {lanes.map((_, i) => (
        <div
          key={`lane-bg-${i}`}
          className={`absolute pointer-events-none ${i % 2 === 0 ? "bg-surface-elevated" : "bg-surface-hover/40"}`}
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
            className={`absolute left-0 w-full pointer-events-none border-t ${BORDER}`}
            style={{ top: laneYOffsets[i] }}
          />
        );
      })}

      {/* Pool name column */}
      <div
        className={`absolute top-0 bottom-0 border-r ${BORDER} flex items-center justify-center bg-surface-hover/80`}
        style={{ left: 0, width: poolNameCol }}
      >
        <span
          className="text-[11px] font-semibold text-fg-secondary tracking-[0.04em] px-1 text-center"
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
        className={`absolute top-0 bottom-0 border-r ${BORDER} bg-surface-hover/80`}
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
            <span className="text-[10px] font-semibold text-fg-secondary leading-snug tracking-tight">
              {laneName}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export const BpmnPoolNode = memo(BpmnPoolNodeComponent);
