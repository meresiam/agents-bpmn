'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowRight, Code2, LogOut, Search, Workflow } from 'lucide-react';
import { EXAMPLE_PROCESSES } from '@/data/examples';
import type { ProcessDefinition } from '@/lib/types';
import { formatProcessGraphPoolLabel } from '@/lib/types';
import { clearSessionCookie } from '@/lib/internal-auth';

function processMatchesQuery(proc: ProcessDefinition, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const pool = formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool ?? '';
  const blob = [proc.title, proc.description, proc.client, proc.process, proc.id, pool]
    .join(' ')
    .toLowerCase();
  return blob.includes(q);
}

const ProcessGraphEditor = dynamic(() => import('@/components/ProcessGraphEditor'), { ssr: false });

export default function HomePage() {
  const router = useRouter();

  function logout() {
    clearSessionCookie();
    router.push('/login');
    router.refresh();
  }
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState('');

  const filteredProcesses = useMemo(
    () => EXAMPLE_PROCESSES.filter((p) => processMatchesQuery(p, search)),
    [search],
  );

  if (showEditor) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setShowEditor(false)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
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
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white/85 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-zinc-900 rounded-bpmn flex items-center justify-center shadow-sm shrink-0">
              <Workflow size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-zinc-900 tracking-tight truncate">Bravy BPMN</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Code2 size={16} />
              Abrir Editor
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 bg-white text-zinc-700 text-sm font-semibold rounded-bpmn hover:bg-zinc-50 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 pb-20">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight mb-1">Fluxogramas</h1>
          <p className="text-sm text-zinc-500 mb-4">
            Busque por nome, cliente ou trecho da descrição. Abra o editor JSON pelo botão acima.
          </p>
          <label htmlFor="flow-search" className="sr-only">
            Buscar fluxogramas
          </label>
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              aria-hidden
            />
            <input
              id="flow-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar fluxogramas…"
              autoComplete="off"
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 shadow-sm"
            />
          </div>
          {search.trim() && (
            <p className="text-xs text-zinc-500 mt-2">
              {filteredProcesses.length === 0
                ? 'Nenhum resultado'
                : `${filteredProcesses.length} de ${EXAMPLE_PROCESSES.length}`}
            </p>
          )}
        </div>

        {filteredProcesses.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-bpmn bg-white/60 px-6 py-14 text-center">
            <Workflow size={36} className="mx-auto text-zinc-300 mb-3" aria-hidden />
            <p className="text-sm font-medium text-zinc-700">Nenhum fluxograma encontrado</p>
            <p className="text-xs text-zinc-500 mt-1">Ajuste o termo de busca ou limpe o campo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProcesses.map((proc) => (
              <Link
                key={proc.id}
                href={`/bpmn/${proc.client}/${proc.process}`}
                className="group block border border-zinc-200 bg-white rounded-bpmn p-5 hover:shadow-md hover:border-zinc-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">
                    {proc.client}
                  </span>
                  <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </div>
                <h2 className="font-semibold text-zinc-900 mb-1 tracking-tight">{proc.title}</h2>
                <p className="text-xs text-zinc-500 leading-relaxed">{proc.description}</p>
                {proc.updatedAt && (
                  <p className="text-[10px] text-zinc-400 mt-3 font-medium">Atualizado em {proc.updatedAt}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
