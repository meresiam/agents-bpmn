import { apiFetch } from '@/lib/api';
import type { ProcessGraphJson } from '@/types/process.types';

export type ProcessCategory =
  | 'COMERCIAL'
  | 'MARKETING'
  | 'FINANCEIRO'
  | 'OPERACOES'
  | 'RH'
  | 'ATENDIMENTO'
  | 'ONBOARDING'
  | 'LOGISTICA'
  | 'JURIDICO'
  | 'TI'
  | 'OUTRO';

/** Face do processo no pareamento AS-IS / TO-BE (Wave 4, Epic 4.A). */
export type ProcessKind = 'SINGLE' | 'AS_IS' | 'TO_BE';

export interface ProcessSummary {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string | null;
  category: ProcessCategory;
  version: number;
  processKind: ProcessKind;
  pairedProcessId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessDetail extends ProcessSummary {
  graph: ProcessGraphJson;
  layoutOverrides: Record<string, { x: number; y: number }> | null;
}

export interface TenantSummary {
  tenantId: string;
  processCount: number;
}

export async function listProcesses(tenantId?: string): Promise<ProcessSummary[]> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return apiFetch<ProcessSummary[]>(`/processes${query}`);
}

export async function listTenants(): Promise<TenantSummary[]> {
  return apiFetch<TenantSummary[]>('/processes/tenants');
}

export async function getProcess(id: string): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/processes/${id}`);
}

export async function getSharedProcess(id: string): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/share/${id}`, { skipAuth: true });
}

export async function createProcess(data: {
  slug: string;
  title: string;
  description?: string;
  category?: ProcessCategory;
  graph: ProcessGraphJson;
  /** Opcional. Apenas SUPER_ADMIN; demais roles ignoram. */
  tenantId?: string;
}): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>('/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProcess(
  id: string,
  data: { title?: string; description?: string; category?: ProcessCategory; graph?: ProcessGraphJson },
): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/processes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function saveLayoutOverrides(
  id: string,
  overrides: Record<string, { x: number; y: number }>,
): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/processes/${id}/layout`, {
    method: 'PATCH',
    body: JSON.stringify({ overrides }),
  });
}

export async function resetLayoutOverrides(id: string): Promise<void> {
  await apiFetch(`/processes/${id}/layout`, { method: 'DELETE' });
}

/** Par AS-IS / TO-BE (Epic 4.A). */
export interface ProcessPair {
  asIs: ProcessDetail;
  toBe: ProcessDetail;
}

/** Gera o TO-BE vinculado a partir de um processo SINGLE (que passa a AS-IS). */
export async function pairProcess(
  id: string,
  data?: { title?: string; slug?: string },
): Promise<ProcessPair> {
  return apiFetch<ProcessPair>(`/processes/${id}/pair`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  });
}

/** Retorna o par { asIs, toBe } a partir de qualquer uma das faces. */
export async function getProcessPair(id: string): Promise<ProcessPair> {
  return apiFetch<ProcessPair>(`/processes/${id}/pair`);
}
