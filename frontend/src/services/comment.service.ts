import { apiFetch } from '@/lib/api';

export interface Comment {
  id: string;
  content: string;
  processId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export async function getComments(processId: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/processes/${processId}/comments`);
}

export async function addComment(processId: string, content: string): Promise<Comment> {
  return apiFetch<Comment>(`/processes/${processId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
}
