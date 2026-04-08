'use client';

import { useCallback, useRef } from 'react';
import { useReactFlow } from 'reactflow';

/**
 * Invisible overlay that captures clicks when in note mode.
 * Sticky notes themselves are rendered as ReactFlow nodes (StickyNoteNode).
 * This component only handles the CREATION click.
 */
export function StickyNoteCreationOverlay({
  active,
  onCanvasClick,
}: {
  active: boolean;
  onCanvasClick: (flowX: number, flowY: number) => void;
}) {
  const { project } = useReactFlow();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!active) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const flowPos = project({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      onCanvasClick(flowPos.x, flowPos.y);
    },
    [active, onCanvasClick, project],
  );

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleClick}
      className="absolute inset-0"
      style={{
        zIndex: 15,
        cursor: 'copy',
      }}
    />
  );
}
