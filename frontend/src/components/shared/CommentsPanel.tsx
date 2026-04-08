'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { getComments, addComment, deleteComment, Comment } from '@/services/comment.service';
import { useAuth } from '@/contexts/auth.context';

interface CommentsPanelProps {
  processId: string;
}

export function CommentsPanel({ processId }: CommentsPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [processId]);

  async function loadComments() {
    try {
      const data = await getComments(processId);
      setComments(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(processId, content.trim());
      setComments((prev) => [newComment, ...prev]);
      setContent('');
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
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

  return (
    <div
      style={{ width: 340, flexShrink: 0 }}
      className="border-l border-zinc-200 flex flex-col overflow-hidden bg-white"
    >
      <div className="px-4 py-3 border-b border-zinc-200 bg-white">
        <h3 className="text-sm font-semibold text-zinc-900">Comentarios</h3>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Pontue modificacoes neste fluxo.
        </p>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <p className="text-xs text-zinc-400 text-center py-4">Carregando...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">
            Nenhum comentario ainda. Seja o primeiro!
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="group border border-zinc-100 rounded-bpmn p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-zinc-700">
                  {c.author.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400">{formatDate(c.createdAt)}</span>
                  {(c.authorId === user?.id || user?.role === 'ADMIN') && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                      title="Excluir comentario"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200 px-4 py-3 bg-white flex gap-2"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva um comentario..."
          className="flex-1 px-3 py-2 text-xs border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="px-3 py-2 bg-zinc-900 text-white rounded-bpmn hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
