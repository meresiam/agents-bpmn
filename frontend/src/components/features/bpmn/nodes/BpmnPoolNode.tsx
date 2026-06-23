"use client";

import { BpmnPoolNodeData } from "@/lib/types";
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { NodeProps } from "reactflow";
import {
  User,
  Users,
  ShoppingCart,
  Calculator,
  DollarSign,
  FileSearch,
  Scale,
  Truck,
  Package,
  Factory,
  Megaphone,
  Briefcase,
  Headset,
  Monitor,
  Cog,
  Stethoscope,
  Landmark,
  Building2,
  type LucideIcon,
} from "lucide-react";

const BORDER = "border-border-app";

const LANE_ICONS: Record<string, LucideIcon> = {
  user: User,
  users: Users,
  cart: ShoppingCart,
  calculator: Calculator,
  dollar: DollarSign,
  fileSearch: FileSearch,
  scale: Scale,
  truck: Truck,
  package: Package,
  factory: Factory,
  megaphone: Megaphone,
  briefcase: Briefcase,
  headset: Headset,
  monitor: Monitor,
  cog: Cog,
  stethoscope: Stethoscope,
  landmark: Landmark,
  building: Building2,
};

function BpmnPoolNodeComponent({ data }: NodeProps<BpmnPoolNodeData>) {
  const {
    poolName,
    lanes,
    laneHeights,
    laneThemes,
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
      {/* Faixas das raias — tom leve da cor da raia (largura total, inclui rótulo) */}
      {lanes.map((_, i) => (
        <div
          key={`lane-bg-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: laneYOffsets[i],
            width: poolWidth,
            height: i === lanes.length - 1 ? poolHeight - laneYOffsets[i] : laneHeights[i],
            background: laneThemes?.[i]?.tint,
          }}
        />
      ))}

      {/* Divisórias horizontais entre raias */}
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

      {/* Coluna do nome do pool */}
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

      {/* Coluna de rótulo das raias — ícone de papel + nome, ambos na cor da raia */}
      <div
        className={`absolute top-0 bottom-0 border-r ${BORDER}`}
        style={{ left: poolNameCol, width: laneLabelCol }}
      >
        {lanes.map((laneName, i) => {
          const theme = laneThemes?.[i];
          const Icon = LANE_ICONS[theme?.iconKey ?? "building"] ?? Building2;
          const accent = theme?.stroke ?? "var(--fg-secondary)";
          return (
            <div
              key={laneName}
              className={`absolute left-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center ${
                i < lanes.length - 1 ? `border-b ${BORDER}` : ""
              }`}
              style={{
                top: laneYOffsets[i],
                height: i === lanes.length - 1 ? poolHeight - laneYOffsets[i] : laneHeights[i],
                width: laneLabelCol,
                background: theme?.labelBg,
              }}
            >
              <Icon size={22} strokeWidth={1.75} style={{ color: accent }} aria-hidden />
              <span
                className="text-[10px] font-bold leading-tight tracking-tight uppercase"
                style={{ color: accent }}
              >
                {laneName}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export const BpmnPoolNode = memo(BpmnPoolNodeComponent);
