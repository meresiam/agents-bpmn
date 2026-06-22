import { apiFetch } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
// imagemUrl vem do backend já com /api/v1/...; precisamos só do host (origin).
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// ─── Tipos (espelham o GeneratePopResult / PopContent do backend) ──────────────

export type PopStatus = 'DRAFT' | 'APPROVED';

export interface PopResponsavel {
  papel: string;
  descricao: string;
}

export interface PopPasso {
  ordem: number;
  acao: string;
  responsavel: string;
  entrada: string;
  saida: string;
  pontoControle: string;
  imagemUrl?: string;
}

export interface PopContent {
  titulo: string;
  objetivo: string;
  escopo: string;
  responsaveis: PopResponsavel[];
  materiais: string[];
  passos: PopPasso[];
  indicadores: string[];
  riscos: string[];
  processVersion: number;
}

export interface PopResult {
  id: string;
  processId: string;
  version: number;
  status: PopStatus;
  sourceKind: 'TO_BE' | 'SINGLE';
  sourceTitle: string;
  content: PopContent;
  llmMs: number;
  createdAt: string;
}

export interface PopSummary {
  id: string;
  tenantId: string;
  processId: string;
  version: number;
  status: PopStatus;
  createdAt: string;
  updatedAt: string;
}

/** Resolve a URL completa de uma imagem de passo (endpoint público do backend). */
export function popImageSrc(imagemUrl: string): string {
  return imagemUrl.startsWith('http') ? imagemUrl : `${API_ORIGIN}${imagemUrl}`;
}

/** POST /chat/generate-pop — gera (nova versão do) POP a partir do TO-BE. */
export async function generatePop(processId: string): Promise<PopResult> {
  return apiFetch<PopResult>('/chat/generate-pop', {
    method: 'POST',
    body: JSON.stringify({ processId }),
  });
}

/** GET /chat/pop/process/:processId — lista os POPs (metadados) do processo. */
export async function listPops(processId: string): Promise<PopSummary[]> {
  return apiFetch<PopSummary[]>(`/chat/pop/process/${processId}`);
}

/** GET /chat/pop/:popId — POP completo com content. */
export async function getPop(popId: string): Promise<PopResult> {
  return apiFetch<PopResult>(`/chat/pop/${popId}`);
}

/** POST /chat/pop/:popId/illustrate — gera/regenera ilustrações (sem ordens = passos sem imagem). */
export async function illustratePop(popId: string, ordens?: number[]): Promise<PopResult> {
  return apiFetch<PopResult>(`/chat/pop/${popId}/illustrate`, {
    method: 'POST',
    body: JSON.stringify(ordens && ordens.length ? { ordens } : {}),
  });
}

/** PATCH /chat/pop/:popId — edição inline (content) e/ou status. */
export async function updatePop(
  popId: string,
  patch: { content?: PopContent; status?: PopStatus },
): Promise<PopResult> {
  return apiFetch<PopResult>(`/chat/pop/${popId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
