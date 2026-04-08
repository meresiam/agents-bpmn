'use client';

import { memo, useRef, useState } from 'react';
import { NodeProps } from 'reactflow';
import { Trash2 } from 'lucide-react';

export interface StickyNoteNodeData {
  noteId: string;
  content: string;
  color: string;
  onUpdate: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  YELLOW: { bg: '#fef9c3', border: '#fde047', text: '#713f12', shadow: 'rgba(253,224,71,0.25)' },
  BLUE:   { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a5f', shadow: 'rgba(147,197,253,0.25)' },
  GREEN:  { bg: '#dcfce7', border: '#86efac', text: '#14532d', shadow: 'rgba(134,239,172,0.25)' },
  PINK:   { bg: '#fce7f3', border: '#f9a8d4', text: '#831843', shadow: 'rgba(249,168,212,0.25)' },
  ORANGE: { bg: '#ffedd5', border: '#fdba74', text: '#7c2d12', shadow: 'rgba(253,186,116,0.25)' },
  PURPLE: { bg: '#f3e8ff', border: '#c4b5fd', text: '#3b0764', shadow: 'rgba(196,181,253,0.25)' },
};

function StickyNoteNodeComponent({ data }: NodeProps<StickyNoteNodeData>) {
  const colors = COLOR_MAP[data.color] || COLOR_MAP.YELLOW;
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(data.content);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function handleSave() {
    const trimmed = content.trim();
    if (trimmed !== data.content) {
      data.onUpdate(data.noteId, trimmed);
    }
    setEditing(false);
  }

  return (
    <div
      style={{
        width: 180,
        minHeight: 50,
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
        boxShadow: `0 1px 4px ${colors.shadow}`,
      }}
      className="group rounded-sm text-[10px] leading-[1.5] relative"
      onDoubleClick={() => {
        setEditing(true);
        setTimeout(() => textRef.current?.focus(), 0);
      }}
    >
      {/* Delete */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          data.onDelete(data.noteId);
        }}
        className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-zinc-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:text-red-500 z-10"
      >
        <Trash2 size={8} />
      </button>

      {editing ? (
        <textarea
          ref={textRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setContent(data.content); setEditing(false); }
            if (e.key === 'Enter' && e.metaKey) handleSave();
          }}
          className="w-full p-2 text-[10px] leading-[1.5] resize-none border-none outline-none font-sans nopan nodrag"
          style={{ background: colors.bg, color: colors.text, minHeight: 50 }}
        />
      ) : (
        <p className="p-2 whitespace-pre-wrap select-none cursor-grab">
          {data.content || 'Duplo clique para editar...'}
        </p>
      )}
    </div>
  );
}

export const StickyNoteNode = memo(StickyNoteNodeComponent);
