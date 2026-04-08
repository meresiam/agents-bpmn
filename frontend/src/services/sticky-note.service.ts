import { apiFetch } from '@/lib/api';

export type NoteColor = 'YELLOW' | 'BLUE' | 'GREEN' | 'PINK' | 'ORANGE' | 'PURPLE';

export interface StickyNote {
  id: string;
  processId: string;
  content: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export async function getNotes(processId: string): Promise<StickyNote[]> {
  return apiFetch<StickyNote[]>(`/processes/${processId}/notes`);
}

export async function createNote(
  processId: string,
  data: { content: string; x: number; y: number; color?: NoteColor },
): Promise<StickyNote> {
  return apiFetch<StickyNote>(`/processes/${processId}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  id: string,
  data: Partial<{ content: string; color: NoteColor; x: number; y: number; width: number; height: number }>,
): Promise<StickyNote> {
  return apiFetch<StickyNote>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await apiFetch(`/notes/${id}`, { method: 'DELETE' });
}
