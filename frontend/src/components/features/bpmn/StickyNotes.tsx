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

const COLOR_MAP: Record<NoteColor, { bg: string; border: string; text: string; shadow: string }> = {
  YELLOW: { bg: '#fef9c3', border: '#fde047', text: '#713f12', shadow: 'rgba(253,224,71,0.3)' },
  BLUE:   { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a5f', shadow: 'rgba(147,197,253,0.3)' },
  GREEN:  { bg: '#dcfce7', border: '#86efac', text: '#14532d', shadow: 'rgba(134,239,172,0.3)' },
  PINK:   { bg: '#fce7f3', border: '#f9a8d4', text: '#831843', shadow: 'rgba(249,168,212,0.3)' },
  ORANGE: { bg: '#ffedd5', border: '#fdba74', text: '#7c2d12', shadow: 'rgba(253,186,116,0.3)' },
  PURPLE: { bg: '#f3e8ff', border: '#c4b5fd', text: '#3b0764', shadow: 'rgba(196,181,253,0.3)' },
};

const NOTE_WIDTH = 160;
const NOTE_MIN_H = 60;

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
  viewportX,
  viewportY,
  onUpdated,
}: {
  note: StickyNote;
  screenX: number;
  screenY: number;
  zoom: number;
  viewportX: number;
  viewportY: number;
  onUpdated: () => void;
}) {
  const colors = COLOR_MAP[note.color] || COLOR_MAP.YELLOW;
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
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

  function handleMouseDown(e: React.MouseEvent) {
    if (editing) return;
    e.preventDefault();
    e.stopPropagation();
    const currentX = dragPos?.x ?? screenX;
    const currentY = dragPos?.y ?? screenY;
    setDragOffset({ x: e.clientX - currentX, y: e.clientY - currentY });
    setDragging(true);

    function onMove(ev: MouseEvent) {
      setDragPos({ x: ev.clientX - (e.clientX - currentX), y: ev.clientY - (e.clientY - currentY) });
    }

    function onUp(ev: MouseEvent) {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setDragging(false);

      const finalX = ev.clientX - (e.clientX - currentX);
      const finalY = ev.clientY - (e.clientY - currentY);

      // Convert screen position back to flow coordinates
      const flowX = (finalX - viewportX) / zoom;
      const flowY = (finalY - viewportY) / zoom;

      // Only save if actually moved
      if (Math.abs(finalX - currentX) > 3 || Math.abs(finalY - currentY) > 3) {
        updateNote(note.id, { x: flowX, y: flowY }).then(onUpdated);
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const displayX = dragPos?.x ?? screenX;
  const displayY = dragPos?.y ?? screenY;

  return (
    <div
      style={{
        position: 'absolute',
        left: displayX,
        top: displayY,
        width: NOTE_WIDTH,
        minHeight: NOTE_MIN_H,
        pointerEvents: 'auto',
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
        boxShadow: dragging ? `0 4px 12px ${colors.shadow}` : `0 1px 4px ${colors.shadow}`,
        zIndex: dragging ? 50 : 4,
        cursor: editing ? 'text' : 'grab',
        userSelect: editing ? 'text' : 'none',
        transition: dragging ? 'none' : 'box-shadow 0.15s',
      }}
      className="group rounded-sm text-[10px] leading-[1.5]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => {
        setEditing(true);
        setTimeout(() => textRef.current?.focus(), 0);
      }}
    >
      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-zinc-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:text-red-500"
        style={{ zIndex: 5 }}
      >
        <Trash2 size={8} />
      </button>

      {editing ? (
        <textarea
          ref={textRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setContent(note.content); setEditing(false); }
            if (e.key === 'Enter' && e.metaKey) handleSave();
          }}
          className="w-full p-2 text-[10px] leading-[1.5] resize-none border-none outline-none font-sans"
          style={{ background: colors.bg, color: colors.text, minHeight: NOTE_MIN_H }}
        />
      ) : (
        <p className="p-2 whitespace-pre-wrap select-none">
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
      className="absolute inset-0"
      style={{
        pointerEvents: noteMode ? 'auto' : 'none',
        cursor: noteMode ? 'copy' : 'default',
        zIndex: 4,
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
            viewportX={viewport.x}
            viewportY={viewport.y}
            onUpdated={onNotesUpdated}
          />
        );
      })}
    </div>
  );
}
