import type { ProcessGraphJson } from '@/types/process.types';
import type { ProcessCategory } from './process.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface GeneratedGraph {
  graph: ProcessGraphJson;
  suggestedTitle: string;
  suggestedSlug: string;
  suggestedDescription: string;
  suggestedCategory: ProcessCategory;
  tenantId: string;
  attachments: Array<{ name: string; size: number; truncated: boolean }>;
  llmMs: number;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bravy_token');
}

/**
 * POST /chat/generate-graph (multipart). NAO usa apiFetch porque precisa enviar FormData,
 * o que conflita com o Content-Type: application/json default.
 */
export async function generateGraph(input: {
  prompt: string;
  files: File[];
  tenantId?: string;
}): Promise<GeneratedGraph> {
  const formData = new FormData();
  formData.append('prompt', input.prompt);
  if (input.tenantId) formData.append('tenantId', input.tenantId);
  for (const file of input.files) {
    formData.append('files', file);
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/chat/generate-graph`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bravy_token');
      window.location.href = '/login';
    }
    throw new Error('Sessao expirada');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}
