'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/auth.context';
import {
  createProcess,
  listProcesses,
  listTenants,
  ProcessCategory,
  ProcessSummary,
  TenantSummary,
} from '@/services/process.service';
import { generateGraph, GeneratedGraph } from '@/services/chat.service';
import { ChatSidebar } from '@/components/layout/ChatSidebar';
import { AnimatedAIChat, ChatAttachment } from '@/components/ui/animated-ai-chat';
import { GraphPreviewModal } from '@/components/features/chat/GraphPreviewModal';

const ProcessGraphEditor = dynamic(
  () => import('@/components/features/bpmn/ProcessGraphEditor'),
  { ssr: false },
);

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [showEditor, setShowEditor] = useState(false);

  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [processesByTenant, setProcessesByTenant] = useState<Record<string, ProcessSummary[]>>({});
  const [loadingTenant, setLoadingTenant] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Tenant currently targeted by the chat composer (SUPER_ADMIN only)
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  // LLM flow state
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedGraph | null>(null);
  const [lastSubmission, setLastSubmission] = useState<{
    prompt: string;
    files: File[];
    tenantId: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isSuperAdmin) {
      listTenants()
        .then((ts) => {
          setTenants(ts);
          // Default selection: 'aila' if present, else first tenant
          if (ts.length > 0 && !activeTenantId) {
            const aila = ts.find((t) => t.tenantId === 'aila');
            setActiveTenantId(aila?.tenantId ?? ts[0].tenantId);
          }
        })
        .catch((e) => console.error('listTenants failed', e))
        .finally(() => setInitialLoading(false));
    } else {
      listProcesses()
        .then((procs) => {
          const tid = user?.tenantId ?? '__self__';
          setProcessesByTenant({ [tid]: procs });
          setTenants([{ tenantId: tid, processCount: procs.length }]);
        })
        .catch((e) => console.error('listProcesses failed', e))
        .finally(() => setInitialLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isSuperAdmin, user?.tenantId]);

  const handleSelectTenant = useCallback(
    (tenantId: string) => {
      if (processesByTenant[tenantId]) return;
      setLoadingTenant(tenantId);
      listProcesses(tenantId)
        .then((procs) => {
          setProcessesByTenant((prev) => ({ ...prev, [tenantId]: procs }));
        })
        .catch((e) => console.error('listProcesses failed', e))
        .finally(() => setLoadingTenant(null));
    },
    [processesByTenant],
  );

  // Sidebar click on a tenant folder → also targets that tenant in the chat
  const handleTenantExpanded = useCallback(
    (tenantId: string) => {
      handleSelectTenant(tenantId);
      if (isSuperAdmin) setActiveTenantId(tenantId);
    },
    [handleSelectTenant, isSuperAdmin],
  );

  const runGeneration = useCallback(
    async (input: { prompt: string; files: File[]; tenantId: string }) => {
      setGenerating(true);
      setGenerationError(null);
      try {
        const result = await generateGraph({
          prompt: input.prompt,
          files: input.files,
          tenantId: isSuperAdmin ? input.tenantId : undefined,
        });
        setPreview(result);
      } catch (err) {
        setGenerationError((err as Error).message);
      } finally {
        setGenerating(false);
      }
    },
    [isSuperAdmin],
  );

  const handleChatSubmit = useCallback(
    ({ prompt, attachments }: { prompt: string; attachments: ChatAttachment[] }) => {
      const tenantId = isSuperAdmin ? activeTenantId ?? '' : user?.tenantId ?? '';
      if (isSuperAdmin && !tenantId) {
        setGenerationError('Selecione um cliente antes de enviar.');
        return;
      }
      const files = attachments.map((a) => a.file);
      setLastSubmission({ prompt, files, tenantId });
      void runGeneration({ prompt, files, tenantId });
    },
    [isSuperAdmin, activeTenantId, user?.tenantId, runGeneration],
  );

  const handleRegenerate = useCallback(() => {
    if (!lastSubmission) return;
    setPreview(null);
    void runGeneration(lastSubmission);
  }, [lastSubmission, runGeneration]);

  const handleSave = useCallback(
    async (data: {
      slug: string;
      title: string;
      description: string;
      category: ProcessCategory;
    }) => {
      if (!preview) return;
      setSaving(true);
      setSaveError(null);
      try {
        const created = await createProcess({
          slug: data.slug,
          title: data.title,
          description: data.description,
          category: data.category,
          graph: preview.graph,
          tenantId: isSuperAdmin ? preview.tenantId : undefined,
        });
        // Navigate to the new diagram
        window.location.href = `/bpmn/${created.id}`;
      } catch (err) {
        setSaveError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [preview, isSuperAdmin],
  );

  const handleClosePreview = useCallback(() => {
    setPreview(null);
    setSaveError(null);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-sm text-fg-secondary">Carregando…</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (showEditor) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-elevated/90 backdrop-blur-sm border-b border-border-app">
          <button
            type="button"
            onClick={() => setShowEditor(false)}
            className="text-xs font-medium text-fg-secondary hover:text-fg-primary"
          >
            ← Voltar
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <ProcessGraphEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <ChatSidebar
        isSuperAdmin={!!isSuperAdmin}
        tenants={tenants}
        processesByTenant={processesByTenant}
        loadingTenant={loadingTenant}
        userName={user?.name}
        onSelectTenant={handleTenantExpanded}
        onNewChat={() => {
          setPreview(null);
          setGenerationError(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenEditor={() => setShowEditor(true)}
        onLogout={logout}
      />
      <main className="flex-1 overflow-y-auto relative">
        {initialLoading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-fg-secondary">Carregando fluxos…</p>
          </div>
        ) : (
          <div className="min-h-full flex flex-col items-center">
            <AnimatedAIChat
              onSubmit={handleChatSubmit}
              isLoading={generating}
              tenantOptions={isSuperAdmin ? tenants : undefined}
              selectedTenantId={isSuperAdmin ? activeTenantId : user?.tenantId ?? null}
              onSelectTenant={(tid) => setActiveTenantId(tid)}
            />
            {generationError && !preview && (
              <div className="mt-2 max-w-2xl w-full px-6">
                <div className="px-4 py-2.5 bg-aila-error/10 border border-aila-error/30 rounded-aila text-xs text-aila-error">
                  {generationError}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {preview && (
        <GraphPreviewModal
          result={preview}
          saving={saving}
          saveError={saveError}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
