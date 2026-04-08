import { apiFetch } from '@/lib/api';

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
}

export interface Comment {
  id: string;
  content: string;
  threadId: string;
  authorId: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface CommentThread {
  id: string;
  processId: string;
  x: number;
  y: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export async function getThreads(processId: string): Promise<CommentThread[]> {
  return apiFetch<CommentThread[]>(`/processes/${processId}/threads`);
}

export async function createThread(
  processId: string,
  x: number,
  y: number,
  content: string,
): Promise<CommentThread> {
  return apiFetch<CommentThread>(`/processes/${processId}/threads`, {
    method: 'POST',
    body: JSON.stringify({ x, y, content }),
  });
}

export async function addComment(threadId: string, content: string): Promise<Comment> {
  return apiFetch<Comment>(`/threads/${threadId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function resolveThread(threadId: string, resolved: boolean): Promise<void> {
  await apiFetch(`/threads/${threadId}`, {
    method: 'PATCH',
    body: JSON.stringify({ resolved }),
  });
}

export async function deleteThread(threadId: string): Promise<void> {
  await apiFetch(`/threads/${threadId}`, { method: 'DELETE' });
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
}
