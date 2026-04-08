'use client';

import { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useReactFlow, useViewport } from 'reactflow';
import {
  StickyNote,
  NoteColor,
  updateNote,
  deleteNote,
} from '@/services/sticky-note.service';

const COLOR_MAP: Record<NoteColor, { bg: string; border: string; text: string }> = {
  YELLOW: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  BLUE:   { bg: 'bg-blue-100',   border: 'border-blue-300',   text: 'text-blue-900' },
  GREEN:  { bg: 'bg-green-100',  border: 'border-green-300',  text: 'text-green-900' },
  PINK:   { bg: 'bg-pink-100',   border: 'border-pink-300',   text: 'text-pink-900' },
  ORANGE: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
  PURPLE: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
};

interface StickyNotesProps {
  notes: StickyNote[];
  noteMode: boolean;
  onCanvasClick: (x: number, y: number) => void;
  onNotesUpdated: () => void;
}

function NoteCard({
  note,
  screenX,
  screenY,
  zoom,
  onUpdated,
}: {
  note: StickyNote;
  screenX: number;
  screenY: number;
  zoom: number;
  onUpdated: () => void;
}) {
  const colors = COLOR_MAP[note.color] || COLOR_MAP.YELLOW;
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function handleSave() {
    if (content.trim() !== note.content) {
      await updateNote(note.id, { content: content.trim() });
      onUpdated();
    }
    setEditing(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    await deleteNote(note.id);
    onUpdated();
  }

  const scaledW = note.width * zoom;
  const scaledH = note.height * zoom;

  return (
    <div
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        width: scaledW,
        minHeight: scaledH,
        pointerEvents: 'auto',
      }}
      className={`group ${colors.bg} ${colors.border} border rounded-sm shadow-sm transition-shadow hover:shadow-md`}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={() => {
        setEditing(true);
        setTimeout(() => textRef.current?.focus(), 0);
      }}
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-zinc-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 z-10"
      >
        <Trash2 size={10} />
      </button>

      {editing ? (
        <textarea
          ref={textRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setContent(note.content); setEditing(false); }
            if (e.key === 'Enter' && e.metaKey) handleSave();
          }}
          className={`w-full h-full p-2 text-[11px] leading-relaxed ${colors.bg} ${colors.text} resize-none border-none outline-none font-sans`}
          style={{ minHeight: scaledH }}
        />
      ) : (
        <p className={`p-2 text-[11px] leading-relaxed ${colors.text} whitespace-pre-wrap cursor-text select-none`}>
          {note.content || 'Duplo clique para editar...'}
        </p>
      )}
    </div>
  );
}

export function StickyNotes({
  notes,
  noteMode,
  onCanvasClick,
  onNotesUpdated,
}: StickyNotesProps) {
  const { project } = useReactFlow();
  const viewport = useViewport();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!noteMode) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const flowPos = project({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      onCanvasClick(flowPos.x, flowPos.y);
    },
    [noteMode, onCanvasClick, project],
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
      onClick={handleClick}
      className="absolute inset-0 z-[5]"
      style={{
        pointerEvents: noteMode ? 'auto' : 'none',
        cursor: noteMode ? 'copy' : 'default',
      }}
    >
      {notes.map((note) => {
        const screen = toScreen(note.x, note.y);
        return (
          <NoteCard
            key={note.id}
            note={note}
            screenX={screen.x}
            screenY={screen.y}
            zoom={viewport.zoom}
            onUpdated={onNotesUpdated}
          />
        );
      })}
    </div>
  );
}
