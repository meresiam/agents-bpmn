'use client';

import { useState, FormEvent } from 'react';
import { Check, MessageCircle, Send, Trash2, X } from 'lucide-react';
import {
  CommentThread,
  addComment,
  resolveThread,
  deleteComment as deleteCommentApi,
} from '@/services/comment.service';
import { useAuth } from '@/contexts/auth.context';

interface CommentsPanelProps {
  threads: CommentThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onThreadUpdated: () => void;
}

export function CommentsPanel({
  threads,
  activeThreadId,
  onSelectThread,
  onThreadUpdated,
}: CommentsPanelProps) {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeThread = activeThreadId
    ? threads.find((t) => t.id === activeThreadId)
    : null;

  // Separate resolved and unresolved
  const unresolvedThreads = threads.filter((t) => !t.resolved);
  const resolvedThreads = threads.filter((t) => t.resolved);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!replyContent.trim() || !activeThreadId || submitting) return;
    setSubmitting(true);
    try {
      await addComment(activeThreadId, replyContent.trim());
      setReplyContent('');
      onThreadUpdated();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(threadId: string, resolved: boolean) {
    try {
      await resolveThread(threadId, resolved);
      onThreadUpdated();
    } catch {
      // silently fail
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteCommentApi(commentId);
      onThreadUpdated();
    } catch {
      // silently fail
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderThread(thread: CommentThread) {
    const isActive = activeThreadId === thread.id;
    const firstComment = thread.comments[0];
    if (!firstComment) return null;

    return (
      <button
        key={thread.id}
        type="button"
        onClick={() => onSelectThread(isActive ? null : thread.id)}
        className={`w-full text-left border rounded-bpmn p-3 transition-all ${
          isActive
            ? 'border-zinc-900 bg-zinc-50 shadow-sm'
            : 'border-zinc-100 bg-white hover:bg-zinc-50 hover:border-zinc-200'
        } ${thread.resolved ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[11px] font-semibold text-zinc-700">{firstComment.author.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {thread.comments.length > 1 && (
              <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                {thread.comments.length}
              </span>
            )}
            {thread.resolved && (
              <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                Resolvido
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{firstComment.content}</p>
        <span className="text-[10px] text-zinc-400 mt-1 block">{formatDate(firstComment.createdAt)}</span>
      </button>
    );
  }

  return (
    <div
      style={{ width: 360, flexShrink: 0 }}
      className="border-l border-zinc-200 flex flex-col overflow-hidden bg-white"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Comentarios</h3>
            <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
              {unresolvedThreads.length}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Pressione <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[10px] font-mono font-semibold">C</kbd> e clique no diagrama.
        </p>
      </div>

      {/* Thread detail view */}
      {activeThread ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Back + actions */}
          <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSelectThread(null)}
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
            >
              &larr; Todos
            </button>
            <button
              type="button"
              onClick={() => handleResolve(activeThread.id, !activeThread.resolved)}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                activeThread.resolved
                  ? 'text-zinc-500 hover:text-zinc-900'
                  : 'text-green-700 bg-green-50 hover:bg-green-100'
              }`}
            >
              <Check size={10} />
              {activeThread.resolved ? 'Reabrir' : 'Resolver'}
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {activeThread.comments.map((c) => (
              <div
                key={c.id}
                className="group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-zinc-700">{c.author.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400">{formatDate(c.createdAt)}</span>
                    {(c.authorId === user?.id || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>

          {/* Reply input */}
          {!activeThread.resolved && (
            <form onSubmit={handleReply} className="border-t border-zinc-200 px-4 py-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Responder..."
                className="flex-1 px-3 py-2 text-xs border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || submitting}
                className="px-3 py-2 bg-zinc-900 text-white rounded-bpmn hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Send size={13} />
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Thread list view */
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {threads.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle size={28} className="mx-auto text-zinc-200 mb-2" />
              <p className="text-xs text-zinc-400">
                Nenhum comentario. Pressione <strong>C</strong> e clique no diagrama.
              </p>
            </div>
          ) : (
            <>
              {unresolvedThreads.map(renderThread)}
              {resolvedThreads.length > 0 && (
                <>
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide pt-2">
                    Resolvidos ({resolvedThreads.length})
                  </p>
                  {resolvedThreads.map(renderThread)}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
