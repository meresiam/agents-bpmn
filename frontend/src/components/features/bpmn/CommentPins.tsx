'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useReactFlow, useViewport } from 'reactflow';
import type { CommentThread } from '@/services/comment.service';

interface CommentPinsProps {
  threads: CommentThread[];
  commentMode: boolean;
  onCanvasClick: (x: number, y: number) => void;
  onPinClick: (thread: CommentThread) => void;
  activeThreadId?: string | null;
}

export function CommentPins({
  threads,
  commentMode,
  onCanvasClick,
  onPinClick,
  activeThreadId,
}: CommentPinsProps) {
  const { project } = useReactFlow();
  const viewport = useViewport();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!commentMode) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Convert screen coords to flow coords
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const flowPos = project({ x: screenX, y: screenY });

      onCanvasClick(flowPos.x, flowPos.y);
    },
    [commentMode, onCanvasClick, project],
  );

  // Convert flow coords to screen position
  function toScreen(flowX: number, flowY: number) {
    return {
      x: flowX * viewport.zoom + viewport.x,
      y: flowY * viewport.zoom + viewport.y,
    };
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="absolute inset-0 z-10"
      style={{
        pointerEvents: commentMode ? 'auto' : 'none',
        cursor: commentMode ? 'crosshair' : 'default',
      }}
    >
      {/* Render pins for each thread */}
      {threads.map((thread) => {
        const screen = toScreen(thread.x, thread.y);
        const isActive = activeThreadId === thread.id;
        const count = thread.comments.length;

        return (
          <button
            key={thread.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPinClick(thread);
            }}
            style={{
              position: 'absolute',
              left: screen.x - 14,
              top: screen.y - 14,
              pointerEvents: 'auto',
            }}
            className={`
              group flex items-center justify-center
              w-7 h-7 rounded-full shadow-md border-2 transition-all duration-150
              ${thread.resolved
                ? 'bg-zinc-200 border-zinc-300 text-zinc-500'
                : isActive
                  ? 'bg-zinc-900 border-zinc-900 text-white scale-110'
                  : 'bg-white border-zinc-900 text-zinc-900 hover:scale-110'
              }
            `}
            title={`${count} comentario${count !== 1 ? 's' : ''}`}
          >
            {count > 1 ? (
              <span className="text-[10px] font-bold">{count}</span>
            ) : (
              <MessageCircle size={12} />
            )}
          </button>
        );
      })}
    </div>
  );
}
