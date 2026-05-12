'use client';

import { memo, useRef, useState } from 'react';
import { NodeProps } from 'reactflow';
import { Palette, Trash2 } from 'lucide-react';

export interface StickyNoteNodeData {
  noteId: string;
  content: string;
  color: string;
  onUpdate: (noteId: string, content: string) => void;
  onColorChange: (noteId: string, color: string) => void;
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

const COLOR_KEYS = Object.keys(COLOR_MAP);

function StickyNoteNodeComponent({ data }: NodeProps<StickyNoteNodeData>) {
  const colors = COLOR_MAP[data.color] || COLOR_MAP.YELLOW;
  const [editing, setEditing] = useState(false);
  const [showColors, setShowColors] = useState(false);
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
      {/* Action buttons — top right */}
      <div className="absolute -top-2 -right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {/* Color picker */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowColors(!showColors); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-4 h-4 bg-surface-elevated border border-border-app rounded-full flex items-center justify-center shadow-sm hover:bg-surface-hover text-fg-secondary nodrag"
        >
          <Palette size={8} />
        </button>
        {/* Delete */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); data.onDelete(data.noteId); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-4 h-4 bg-surface-elevated border border-border-app rounded-full flex items-center justify-center shadow-sm hover:bg-aila-error/10 hover:text-aila-error text-fg-secondary nodrag"
        >
          <Trash2 size={8} />
        </button>
      </div>

      {/* Color picker dropdown */}
      {showColors && (
        <div
          className="absolute -top-8 right-0 flex items-center gap-1 bg-surface-elevated border border-border-app rounded-full px-1.5 py-1 shadow-lg z-20 nodrag"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                data.onColorChange(data.noteId, key);
                setShowColors(false);
              }}
              className={`w-4 h-4 rounded-full border-2 transition-transform ${
                data.color === key ? 'scale-125 border-fg-primary' : 'border-transparent hover:scale-110'
              }`}
              style={{ background: COLOR_MAP[key].border }}
              title={key.charAt(0) + key.slice(1).toLowerCase()}
            />
          ))}
        </div>
      )}

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
