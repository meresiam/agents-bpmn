'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  LogOut,
  PlusIcon,
  Search,
  Workflow,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AilaLogo } from '@/components/brand/AilaLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import type { ProcessSummary, TenantSummary } from '@/services/process.service';

interface ChatSidebarProps {
  isSuperAdmin: boolean;
  tenants: TenantSummary[];
  processesByTenant: Record<string, ProcessSummary[]>;
  loadingTenant: string | null;
  userName?: string;
  onSelectTenant: (tenantId: string) => void;
  onNewChat: () => void;
  onOpenEditor: () => void;
  onLogout: () => void;
}

export function ChatSidebar({
  isSuperAdmin,
  tenants,
  processesByTenant,
  loadingTenant,
  userName,
  onSelectTenant,
  onNewChat,
  onOpenEditor,
  onLogout,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const visibleTenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((t) => {
      if (t.tenantId.toLowerCase().includes(q)) return true;
      const procs = processesByTenant[t.tenantId] ?? [];
      return procs.some((p) =>
        [p.title, p.slug, p.description].filter(Boolean).join(' ').toLowerCase().includes(q),
      );
    });
  }, [tenants, processesByTenant, search]);

  const toggleTenant = (tenantId: string) => {
    setExpanded((prev) => ({ ...prev, [tenantId]: !prev[tenantId] }));
    if (!processesByTenant[tenantId]) {
      onSelectTenant(tenantId);
    }
  };

  return (
    <aside className="flex flex-col h-screen w-[280px] shrink-0 bg-surface border-r border-border-app">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border-app">
        <div className="flex items-center justify-between mb-3">
          <AilaLogo size={26} wordmarkSuffix="BPMN" />
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-fg-primary bg-surface-elevated hover:bg-surface-hover border border-border-app rounded-aila transition-colors"
        >
          <PlusIcon size={15} />
          <span>Novo fluxo</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isSuperAdmin ? 'Buscar cliente ou fluxo…' : 'Buscar fluxo…'}
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {isSuperAdmin ? (
          <>
            <div className="px-2 pt-2 pb-1">
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-tertiary">
                Clientes
              </span>
            </div>
            {visibleTenants.length === 0 ? (
              <p className="px-3 py-3 text-xs text-fg-tertiary">Nenhum cliente encontrado.</p>
            ) : (
              visibleTenants.map((tenant) => (
                <TenantNode
                  key={tenant.tenantId}
                  tenant={tenant}
                  expanded={!!expanded[tenant.tenantId]}
                  loading={loadingTenant === tenant.tenantId}
                  processes={processesByTenant[tenant.tenantId] ?? []}
                  onToggle={() => toggleTenant(tenant.tenantId)}
                  searchFilter={search.trim().toLowerCase()}
                />
              ))
            )}
          </>
        ) : (
          <FlatProcessList
            processes={Object.values(processesByTenant).flat()}
            search={search.trim().toLowerCase()}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border-app px-2 py-2 space-y-1">
        <button
          type="button"
          onClick={onOpenEditor}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-fg-secondary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors"
        >
          <Code2 size={14} />
          <span>Editor manual</span>
        </button>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-6 h-6 rounded-full bg-aila-violet/15 flex items-center justify-center">
            <span className="text-[10px] font-bold text-aila-violet">
              {(userName ?? 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="flex-1 text-xs text-fg-secondary truncate">{userName ?? 'Usuário'}</span>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded transition-colors"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function TenantNode({
  tenant,
  expanded,
  loading,
  processes,
  onToggle,
  searchFilter,
}: {
  tenant: TenantSummary;
  expanded: boolean;
  loading: boolean;
  processes: ProcessSummary[];
  onToggle: () => void;
  searchFilter: string;
}) {
  const filtered = useMemo(() => {
    if (!searchFilter) return processes;
    return processes.filter((p) =>
      [p.title, p.slug, p.description].filter(Boolean).join(' ').toLowerCase().includes(searchFilter),
    );
  }, [processes, searchFilter]);

  // Auto-expand if search matches inner processes
  const shouldExpand = expanded || (!!searchFilter && filtered.length > 0);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors"
      >
        {shouldExpand ? (
          <ChevronDown size={12} className="text-fg-tertiary shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-fg-tertiary shrink-0" />
        )}
        <FolderOpen size={13} className="text-fg-tertiary shrink-0" />
        <span className="truncate flex-1 text-left uppercase tracking-tight">{tenant.tenantId}</span>
        <span className="text-[10px] text-fg-tertiary">{tenant.processCount}</span>
      </button>
      {shouldExpand && (
        <div className="ml-4 pl-2 border-l border-border-app/60 mt-0.5 mb-1">
          {loading ? (
            <p className="px-2 py-1 text-[11px] text-fg-tertiary">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-fg-tertiary">
              {processes.length === 0 ? 'Sem fluxos.' : 'Nada bate com a busca.'}
            </p>
          ) : (
            filtered.map((proc) => <ProcessLink key={proc.id} process={proc} />)
          )}
        </div>
      )}
    </div>
  );
}

function FlatProcessList({
  processes,
  search,
}: {
  processes: ProcessSummary[];
  search: string;
}) {
  const filtered = useMemo(() => {
    if (!search) return processes;
    return processes.filter((p) =>
      [p.title, p.slug, p.description].filter(Boolean).join(' ').toLowerCase().includes(search),
    );
  }, [processes, search]);

  if (filtered.length === 0) {
    return <p className="px-3 py-3 text-xs text-fg-tertiary">Nenhum fluxo ainda.</p>;
  }

  return (
    <>
      <div className="px-2 pt-2 pb-1">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-tertiary">
          Fluxos
        </span>
      </div>
      {filtered.map((proc) => (
        <ProcessLink key={proc.id} process={proc} />
      ))}
    </>
  );
}

function ProcessLink({ process: proc }: { process: ProcessSummary }) {
  return (
    <Link
      href={`/bpmn/${proc.id}`}
      className={cn(
        'group flex items-center gap-1.5 px-2 py-1.5 text-xs',
        'text-fg-secondary hover:text-fg-primary hover:bg-surface-hover',
        'rounded-aila transition-colors',
      )}
    >
      <Workflow size={11} className="text-fg-tertiary group-hover:text-aila-violet transition-colors shrink-0" />
      <span className="truncate">{proc.title}</span>
    </Link>
  );
}
