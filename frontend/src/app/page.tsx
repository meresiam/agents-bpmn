'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  FolderOpen,
  LogOut,
  Search,
  Workflow,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import {
  listProcesses,
  listTenants,
  ProcessSummary,
  TenantSummary,
  ProcessCategory,
} from '@/services/process.service';
import { AilaLogo } from '@/components/brand/AilaLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const CATEGORY_LABELS: Record<ProcessCategory, string> = {
  COMERCIAL: 'Comercial',
  MARKETING: 'Marketing',
  FINANCEIRO: 'Financeiro',
  OPERACOES: 'Operacoes',
  RH: 'RH',
  ATENDIMENTO: 'Atendimento',
  ONBOARDING: 'Onboarding',
  LOGISTICA: 'Logistica',
  JURIDICO: 'Juridico',
  TI: 'TI',
  OUTRO: 'Outro',
};

function processMatchesQuery(proc: ProcessSummary, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const blob = [proc.title, proc.description, proc.slug, proc.tenantId, proc.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return blob.includes(q);
}

const ProcessGraphEditor = dynamic(
  () => import('@/components/features/bpmn/ProcessGraphEditor'),
  { ssr: false },
);

// ─── Tenant Folders View (SUPER_ADMIN) ──────────────────────────────────────
function TenantFoldersView({
  tenants,
  onSelectTenant,
}: {
  tenants: TenantSummary[];
  onSelectTenant: (tenantId: string) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-fg-primary tracking-tight mb-1">
        Clientes
      </h1>
      <p className="text-sm text-fg-secondary mb-5 sm:mb-6">
        Selecione um cliente para ver seus fluxogramas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {tenants.map((t) => (
          <button
            key={t.tenantId}
            type="button"
            onClick={() => onSelectTenant(t.tenantId)}
            className="group text-left border border-border-app bg-surface-elevated rounded-aila p-5 hover:shadow-md hover:border-fg-tertiary transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-surface-hover rounded-aila flex items-center justify-center group-hover:bg-aila-graphite-100 dark:group-hover:bg-aila-graphite-700 transition-colors">
                <FolderOpen size={20} className="text-fg-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-sans font-bold text-fg-primary tracking-tight uppercase">
                  {t.tenantId}
                </h2>
                <p className="text-xs text-fg-secondary">
                  {t.processCount} {t.processCount === 1 ? 'fluxo' : 'fluxos'}
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-fg-tertiary group-hover:text-fg-secondary transition-colors shrink-0"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Process List View ──────────────────────────────────────────────────────
function ProcessListView({
  processes,
  search,
  setSearch,
  tenantLabel,
  onBack,
  categoryFilter,
  setCategoryFilter,
}: {
  processes: ProcessSummary[];
  search: string;
  setSearch: (v: string) => void;
  tenantLabel?: string;
  onBack?: () => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
}) {
  const categories = useMemo(() => {
    const set = new Set(processes.map((p) => p.category));
    return Array.from(set).sort();
  }, [processes]);

  const filtered = useMemo(() => {
    let result = processes;
    if (categoryFilter) result = result.filter((p) => p.category === categoryFilter);
    return result.filter((p) => processMatchesQuery(p, search));
  }, [processes, search, categoryFilter]);

  return (
    <div>
      <div className="mb-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar aos clientes
          </button>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-fg-primary tracking-tight mb-1 break-words">
          {tenantLabel ? (
            <>
              Fluxogramas{' '}
              <span className="text-fg-tertiary font-normal italic">/ {tenantLabel.toUpperCase()}</span>
            </>
          ) : (
            'Fluxogramas'
          )}
        </h1>
        <p className="text-sm text-fg-secondary mb-4">
          Busque por nome ou trecho da descricao.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar fluxogramas..."
              autoComplete="off"
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-border-app rounded-aila bg-surface-elevated text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-aila-violet/30 focus:border-aila-violet/40 shadow-sm"
            />
          </div>
          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-border-app rounded-aila bg-surface-elevated text-fg-primary focus:outline-none focus:ring-2 focus:ring-aila-violet/30 focus:border-aila-violet/40 shadow-sm"
            >
              <option value="">Todas categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          )}
        </div>

        {(search.trim() || categoryFilter) && (
          <p className="text-xs text-fg-secondary mt-2">
            {filtered.length === 0
              ? 'Nenhum resultado'
              : `${filtered.length} de ${processes.length}`}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border-app rounded-aila bg-surface-elevated/60 px-4 sm:px-6 py-10 sm:py-14 text-center">
          <Workflow size={36} className="mx-auto text-fg-tertiary mb-3" aria-hidden />
          <p className="text-sm font-medium text-fg-primary">Nenhum fluxograma encontrado</p>
          <p className="text-xs text-fg-secondary mt-1">Ajuste o termo de busca ou limpe o filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((proc) => (
            <Link
              key={proc.id}
              href={`/bpmn/${proc.id}`}
              className="group block border border-border-app bg-surface-elevated rounded-aila p-5 hover:shadow-md hover:border-fg-tertiary transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-fg-secondary uppercase tracking-[0.08em]">
                    {proc.slug}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-fg-secondary font-medium">
                    {CATEGORY_LABELS[proc.category] ?? proc.category}
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-fg-tertiary group-hover:text-fg-secondary transition-colors"
                />
              </div>
              <h2 className="font-sans font-bold text-fg-primary mb-1 tracking-tight">
                {proc.title}
              </h2>
              <p className="text-xs text-fg-secondary leading-relaxed">{proc.description}</p>
              <p className="text-[10px] text-fg-tertiary mt-3 font-medium">
                Atualizado em {new Date(proc.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Home Page ─────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // SUPER_ADMIN: tenants + selected tenant
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  // Processes (loaded for CLIENT/ADMIN always, for SUPER_ADMIN when tenant selected)
  const [processes, setProcesses] = useState<ProcessSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) return;

    if (isSuperAdmin) {
      listTenants()
        .then(setTenants)
        .catch(console.error)
        .finally(() => setLoadingData(false));
    } else {
      listProcesses()
        .then(setProcesses)
        .catch(console.error)
        .finally(() => setLoadingData(false));
    }
  }, [isAuthenticated, isSuperAdmin]);

  // Load processes when SUPER_ADMIN selects a tenant
  useEffect(() => {
    if (!selectedTenant) return;
    setLoadingData(true);
    listProcesses(selectedTenant)
      .then(setProcesses)
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [selectedTenant]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-sm text-fg-secondary">Carregando...</p>
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
            &larr; Voltar
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <ProcessGraphEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border-app bg-surface-elevated/85 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <AilaLogo size={32} wordmarkSuffix="BPMN" className="min-w-0 truncate" />
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span className="text-xs text-fg-secondary hidden md:block">{user?.name}</span>
            <button
              type="button"
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center justify-center gap-2 h-9 w-9 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black text-sm font-semibold rounded-aila hover:opacity-90 transition-opacity shadow-sm"
              title="Editor"
              aria-label="Editor"
            >
              <Code2 size={16} />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center h-9 w-9 text-fg-secondary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-16 sm:pb-20">
        {loadingData ? (
          <div className="border border-dashed border-border-app rounded-aila bg-surface-elevated/60 px-6 py-14 text-center">
            <p className="text-sm text-fg-secondary">Carregando...</p>
          </div>
        ) : isSuperAdmin && !selectedTenant ? (
          <TenantFoldersView
            tenants={tenants}
            onSelectTenant={(id) => {
              setSelectedTenant(id);
              setSearch('');
              setCategoryFilter('');
            }}
          />
        ) : (
          <ProcessListView
            processes={processes}
            search={search}
            setSearch={setSearch}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            tenantLabel={isSuperAdmin ? selectedTenant ?? undefined : undefined}
            onBack={
              isSuperAdmin
                ? () => {
                    setSelectedTenant(null);
                    setProcesses([]);
                    setSearch('');
                    setCategoryFilter('');
                  }
                : undefined
            }
          />
        )}
      </main>
    </div>
  );
}
