import { apiFetch } from '@/lib/api';
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

export type ChatMode = 'create' | 'edit';

export interface GenerateInput {
  prompt: string;
  files: File[];
  tenantId?: string;
  mode?: ChatMode;
  existingGraph?: ProcessGraphJson;
  processId?: string;
}

// ─── Análise de GAP (Epic 4.B) ────────────────────────────────────────────────

export type GapTipo =
  | 'GARGALO'
  | 'RETRABALHO'
  | 'ETAPA_MANUAL'
  | 'FALTA_DE_DADO'
  | 'RISCO_COMPLIANCE'
  | 'ESPERA'
  | 'OUTRO';
export type GapSeveridade = 'ALTA' | 'MEDIA' | 'BAIXA';
export type GapAbordagem = 'IA' | 'AUTOMACAO' | 'PROCESSO' | 'PESSOAS';

export interface Gap {
  id: string;
  titulo: string;
  tipo: GapTipo;
  severidade: GapSeveridade;
  localizacao: string;
  recomendacao: string;
  solucao: { abordagem: GapAbordagem; precisaIA: boolean; descricao: string };
}

export interface GapAnalysisResult {
  mode: 'pair' | 'single';
  resumo: string;
  gaps: Gap[];
  llmMs: number;
  asIsTitle: string;
  toBeTitle?: string;
}

/** POST /chat/analyze-gap — roda a análise de GAP do processo (par ou single). */
export async function analyzeGap(processId: string): Promise<GapAnalysisResult> {
  return apiFetch<GapAnalysisResult>('/chat/analyze-gap', {
    method: 'POST',
    body: JSON.stringify({ processId }),
  });
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bravy_token');
}

function buildFormData(input: GenerateInput): FormData {
  const formData = new FormData();
  formData.append('prompt', input.prompt);
  if (input.tenantId) formData.append('tenantId', input.tenantId);
  if (input.mode) formData.append('mode', input.mode);
  if (input.existingGraph) {
    formData.append('existingGraph', JSON.stringify(input.existingGraph));
  }
  if (input.processId) formData.append('processId', input.processId);
  for (const file of input.files) {
    formData.append('files', file);
  }
  return formData;
}

function handleAuthError(res: Response): void {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bravy_token');
      window.location.href = '/login';
    }
    throw new Error('Sessao expirada');
  }
}

/**
 * POST /chat/generate-graph (non-streaming, modo legado).
 * NAO usa apiFetch porque precisa enviar FormData, o que conflita com Content-Type: application/json default.
 */
export async function generateGraph(input: GenerateInput): Promise<GeneratedGraph> {
  const formData = buildFormData(input);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/chat/generate-graph`, {
    method: 'POST',
    body: formData,
    headers,
  });

  handleAuthError(res);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// ─── Streaming via SSE ────────────────────────────────────────────────────────

export interface StreamMetaEvent {
  type: 'meta';
  attachments: Array<{ name: string; size: number; truncated: boolean }>;
  mode: ChatMode;
}
export interface StreamDeltaEvent {
  type: 'delta';
  text: string;
}
export interface StreamDoneEvent {
  type: 'done';
  result: GeneratedGraph;
}
export interface StreamErrorEvent {
  type: 'error';
  message: string;
}

export interface StreamCallbacks {
  onMeta?: (event: StreamMetaEvent) => void;
  onDelta?: (event: StreamDeltaEvent) => void;
  onDone?: (event: StreamDoneEvent) => void;
  onError?: (event: StreamErrorEvent) => void;
  signal?: AbortSignal;
}

/**
 * POST /chat/generate-graph-stream — consome SSE.
 * Retorna uma Promise<GeneratedGraph> que resolve no evento `done` ou rejeita no `error`.
 */
export async function generateGraphStream(
  input: GenerateInput,
  callbacks: StreamCallbacks = {},
): Promise<GeneratedGraph> {
  const formData = buildFormData(input);
  const token = getToken();
  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/chat/generate-graph-stream`, {
    method: 'POST',
    body: formData,
    headers,
    signal: callbacks.signal,
  });

  handleAuthError(res);

  if (!res.ok) {
    // Erro antes do stream comecar (validacao, tenant, etc).
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (!res.body) {
    throw new Error('Resposta sem body (stream nao disponivel)');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let result: GeneratedGraph | null = null;
  let errorMessage: string | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE separa eventos por linha em branco.
      let sepIdx = buffer.indexOf('\n\n');
      while (sepIdx !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        sepIdx = buffer.indexOf('\n\n');
        const parsed = parseSseEvent(rawEvent);
        if (!parsed) continue;

        switch (parsed.type) {
          case 'meta':
            callbacks.onMeta?.(parsed as StreamMetaEvent);
            break;
          case 'delta':
            callbacks.onDelta?.(parsed as StreamDeltaEvent);
            break;
          case 'done':
            result = (parsed as StreamDoneEvent).result;
            callbacks.onDone?.(parsed as StreamDoneEvent);
            break;
          case 'error':
            errorMessage = (parsed as StreamErrorEvent).message;
            callbacks.onError?.(parsed as StreamErrorEvent);
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (errorMessage) throw new Error(errorMessage);
  if (!result) throw new Error('Stream terminou sem evento done');
  return result;
}

/**
 * Parse de um bloco SSE bruto no formato:
 *   event: <type>
 *   data: <json>
 * Comentarios (linhas iniciando com `:`) e linhas em branco sao ignorados.
 */
function parseSseEvent(
  raw: string,
): StreamMetaEvent | StreamDeltaEvent | StreamDoneEvent | StreamErrorEvent | null {
  const lines = raw.split('\n');
  let eventType = '';
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(':') || line.trim() === '') continue;
    if (line.startsWith('event:')) {
      eventType = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }
  if (!eventType || dataLines.length === 0) return null;
  try {
    const data = JSON.parse(dataLines.join('\n'));
    return data;
  } catch {
    return null;
  }
}
