'use client';

import { useCallback, useMemo, useRef, useState, FormEvent } from 'react';
import { Check, MessageCircle, Send, Trash2, X } from 'lucide-react';
import { useReactFlow, useViewport } from 'reactflow';
import {
  CommentThread,
  addComment,
  resolveThread as resolveThreadApi,
  deleteComment as deleteCommentApi,
} from '@/services/comment.service';
import { useAuth } from '@/contexts/auth.context';

interface CommentPinsProps {
  threads: CommentThread[];
  commentMode: boolean;
  onCanvasClick: (x: number, y: number) => void;
  onThreadUpdated: () => void;
}

function ThreadPopover({
  thread,
  onClose,
  onUpdated,
}: {
  thread: CommentThread;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { user } = useAuth();
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(thread.id, reply.trim());
      setReply('');
      onUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve() {
    await resolveThreadApi(thread.id, !thread.resolved);
    onUpdated();
  }

  async function handleDeleteComment(commentId: string) {
    await deleteCommentApi(commentId);
    onUpdated();
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white border border-zinc-200 rounded-bpmn shadow-xl w-72 max-h-80 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-500">
          {thread.comments.length} comentario{thread.comments.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResolve}
            className={`p-1 rounded transition-colors ${
              thread.resolved ? 'text-zinc-400 hover:text-zinc-700' : 'text-green-600 hover:bg-green-50'
            }`}
            title={thread.resolved ? 'Reabrir' : 'Resolver'}
          >
            <Check size={12} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
        {thread.comments.map((c) => (
          <div key={c.id} className="group">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-semibold text-zinc-700">{c.author.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-400">{formatDate(c.createdAt)}</span>
                {(c.authorId === user?.id || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
          </div>
        ))}
      </div>

      {/* Reply */}
      {!thread.resolved && (
        <form onSubmit={handleReply} className="border-t border-zinc-100 px-3 py-2 flex gap-1.5">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Responder..."
            autoFocus
            className="flex-1 px-2 py-1.5 text-[11px] border border-zinc-200 rounded bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900/10"
          />
          <button
            type="submit"
            disabled={!reply.trim() || submitting}
            className="px-2 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <Send size={11} />
          </button>
        </form>
      )}
    </div>
  );
}

export function CommentPins({
  threads,
  commentMode,
  onCanvasClick,
  onThreadUpdated,
}: CommentPinsProps) {
  const { project } = useReactFlow();
  const viewport = useViewport();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!commentMode) {
        setOpenThreadId(null);
        return;
      }
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const flowPos = project({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      onCanvasClick(flowPos.x, flowPos.y);
    },
    [commentMode, onCanvasClick, project],
  );

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
      {threads.map((thread) => {
        const screen = toScreen(thread.x, thread.y);
        const isOpen = openThreadId === thread.id;
        const count = thread.comments.length;

        return (
          <div
            key={thread.id}
            style={{
              position: 'absolute',
              left: screen.x - 14,
              top: screen.y - 14,
              pointerEvents: 'auto',
            }}
          >
            {/* Pin button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenThreadId(isOpen ? null : thread.id);
              }}
              className={`
                flex items-center justify-center
                w-7 h-7 rounded-full shadow-md border-2 transition-all duration-150
                ${thread.resolved
                  ? 'bg-zinc-200 border-zinc-300 text-zinc-500'
                  : isOpen
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

            {/* Popover */}
            {isOpen && (
              <div className="absolute left-10 top-0 z-50">
                <ThreadPopover
                  thread={thread}
                  onClose={() => setOpenThreadId(null)}
                  onUpdated={onThreadUpdated}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
